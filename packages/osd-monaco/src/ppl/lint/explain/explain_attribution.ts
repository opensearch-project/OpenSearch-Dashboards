/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Thorough-mode probe orchestration for the explain-backed performance rules.
 *
 * The range resolver (`resolve_explain_ranges.ts`) can narrow a whole-query
 * finding to a single command only when exactly one candidate matches the
 * flagged operation. When a query has several — two `where` clauses, `stats
 * avg(x), max(y)`, `sort a, b` — Fast mode drops the finding rather than guess.
 * Thorough mode instead fires a bounded set of native "control/treatment"
 * `_explain` probes: it neutralizes all-but-one candidate and asks the engine
 * which one still reproduces the outcome, pinning the culprit with
 * `confidence: 'causal-probe'`.
 *
 * All probing is bounded by {@link ProbeBudget}: at most
 * `EXPLAIN_MAX_PROBE_REQUESTS` extra requests and `EXPLAIN_ISOLATION_WALL_MS`
 * wall-clock, and every step re-checks `isCurrent()` so a superseded lint pass
 * abandons its probes. Probes reuse the shared `explainCache` (probe partition)
 * so repeats within a session are free.
 *
 * Ported from the data-plugin implementation on poc-ppl-linter-v3; kept inside
 * `@osd/monaco` here because the PR branch drives explain from `language.ts`,
 * which already owns the cache and can reach the worker's query validator.
 */

import type { PPLLintHttpClient } from '../../lint_bridge';
import type { Diagnostic } from '../diagnostic';
import { explainCache, ExplainResolution } from './explain_cache';
import { hasExplainOutcome } from './explain_outcomes';
import { ExplainOperation, ExplainOutcome } from './explain_types';
import { ExplainAttributionSelection, resolveExplainRanges } from './resolve_explain_ranges';
import { buildExplainProbeSet, ExplainProbeSet, SourceEdit } from './attribution/probes';
import type {
  ExplainAttributionCandidateSnapshot,
  ExplainAttributionSnapshot,
} from './attribution/snapshot';

export const EXPLAIN_ISOLATION_WALL_MS = 2000;
export const EXPLAIN_MAX_AMBIGUOUS_CANDIDATES = 3;
export const EXPLAIN_MAX_PROBE_REQUESTS = 4;
const EXPLAIN_MAX_IN_FLIGHT = 2;

export interface ExplainAttributionState {
  snapshot: ExplainAttributionSnapshot;
  immediateDiagnostics: Diagnostic[];
  needsIsolation: boolean;
}

export interface ExplainAttributionInputs {
  query: string;
  snapshot: ExplainAttributionSnapshot;
  typeMap?: Map<string, string>;
  baselineDiagnostics: Diagnostic[];
  http: PPLLintHttpClient;
  dataSourceId?: string;
  validateGeneratedQueries: (queries: string[]) => Promise<boolean[]>;
  isCurrent: () => boolean;
}

function candidatesFor(
  snapshot: ExplainAttributionSnapshot,
  operation: ExplainOperation
): ExplainAttributionCandidateSnapshot[] {
  return snapshot.candidates.filter((candidate) => candidate.operation === operation);
}

function selectionsForUniqueCandidates(
  diagnostics: Diagnostic[],
  snapshot: ExplainAttributionSnapshot
): Map<ExplainOutcome, ExplainAttributionSelection> {
  const selections = new Map<ExplainOutcome, ExplainAttributionSelection>();
  for (const diagnostic of diagnostics) {
    const target = diagnostic.explainTarget;
    if (!target || snapshot.unsupportedOperations.includes(target.operation)) {
      continue;
    }
    const candidates = candidatesFor(snapshot, target.operation);
    if (candidates.length === 1) {
      selections.set(target.outcome, {
        candidateIds: new Set([candidates[0].id]),
        confidence: 'unique-source',
      });
    }
  }
  return selections;
}

export function createExplainAttributionState(
  inputs: Pick<ExplainAttributionInputs, 'query' | 'snapshot' | 'typeMap' | 'baselineDiagnostics'>
): ExplainAttributionState {
  const selections = selectionsForUniqueCandidates(inputs.baselineDiagnostics, inputs.snapshot);
  const resolvedDiagnostics = resolveExplainRanges(inputs.baselineDiagnostics, {
    query: inputs.query,
    snapshot: inputs.snapshot,
    typeMap: inputs.typeMap,
    attributions: selections,
  });
  const immediateDiagnostics = resolvedDiagnostics.map((diagnostic) => ({
    ...diagnostic,
    fix: undefined,
  }));

  const hasAmbiguous = inputs.baselineDiagnostics.some((diagnostic) => {
    const target = diagnostic.explainTarget;
    if (!target || inputs.snapshot.unsupportedOperations.includes(target.operation)) {
      return false;
    }
    const count = candidatesFor(inputs.snapshot, target.operation).length;
    return count > 1 && count <= EXPLAIN_MAX_AMBIGUOUS_CANDIDATES;
  });
  const needsVerification = resolvedDiagnostics.some((diagnostic) => {
    const candidateId = diagnostic.attribution?.candidateId;
    const candidate = inputs.snapshot.candidates.find(({ id }) => id === candidateId);
    return !!diagnostic.fix || !!candidate?.aliasBinding?.baseFieldSource;
  });

  return {
    snapshot: inputs.snapshot,
    immediateDiagnostics,
    needsIsolation: hasAmbiguous || needsVerification,
  };
}

function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  fn: (value: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (next < values.length) {
      const index = next++;
      results[index] = await fn(values[index]);
    }
  });
  return Promise.all(workers).then(() => results);
}

function nativeOutcomeFor(outcome: ExplainOutcome): ExplainOutcome | undefined {
  if (outcome.startsWith('filter:')) {
    return 'filter:native';
  }
  if (outcome.startsWith('sort:')) {
    return 'sort:native';
  }
  if (outcome.startsWith('aggregation:')) {
    return 'aggregation:native';
  }
  return undefined;
}

function fixEdit(
  query: string,
  candidate: ExplainAttributionCandidateSnapshot,
  diagnostic: Diagnostic
): SourceEdit | undefined {
  const fix = diagnostic.fix;
  if (!fix?.expectedText) {
    return undefined;
  }
  const first = candidate.sourceText.indexOf(fix.expectedText);
  if (first < 0 || first !== candidate.sourceText.lastIndexOf(fix.expectedText)) {
    return undefined;
  }
  const startOffset = candidate.startOffset + first;
  if (query.slice(startOffset, startOffset + fix.expectedText.length) !== fix.expectedText) {
    return undefined;
  }
  return {
    startOffset,
    endOffset: startOffset + fix.expectedText.length,
    text: fix.text,
  };
}

class ProbeBudget {
  private requests = 0;
  private readonly deadline = Date.now() + EXPLAIN_ISOLATION_WALL_MS;

  constructor(private readonly inputs: ExplainAttributionInputs) {}

  remainingRequests(): number {
    return EXPLAIN_MAX_PROBE_REQUESTS - this.requests;
  }

  async validate(queries: string[]): Promise<boolean[] | undefined> {
    if (
      queries.length === 0 ||
      queries.some((query) => !query) ||
      !this.inputs.isCurrent() ||
      Date.now() >= this.deadline
    ) {
      return undefined;
    }

    let timeout: ReturnType<typeof setTimeout> | undefined;
    const timeoutResult = new Promise<undefined>((resolve) => {
      timeout = setTimeout(() => resolve(undefined), Math.max(1, this.deadline - Date.now()));
    });
    try {
      const result = await Promise.race([
        this.inputs.validateGeneratedQueries(queries),
        timeoutResult,
      ]);
      if (
        !this.inputs.isCurrent() ||
        !Array.isArray(result) ||
        result.length !== queries.length ||
        result.some((entry) => typeof entry !== 'boolean')
      ) {
        return undefined;
      }
      return result;
    } catch {
      return undefined;
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }

  async explain(query: string): Promise<ExplainResolution> {
    if (
      !this.inputs.isCurrent() ||
      this.requests >= EXPLAIN_MAX_PROBE_REQUESTS ||
      Date.now() >= this.deadline
    ) {
      return { status: 'error', error: new Error('probe budget exceeded') };
    }
    this.requests++;
    const controller = typeof AbortController === 'undefined' ? undefined : new AbortController();
    const remainingMs = Math.max(1, this.deadline - Date.now());
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const timeoutResult = new Promise<ExplainResolution>((resolve) => {
      timeout = setTimeout(() => {
        controller?.abort();
        resolve({ status: 'error', error: new Error('probe wall-clock budget exceeded') });
      }, remainingMs);
    });
    const resolution = await Promise.race([
      explainCache.resolveResult(this.inputs.http, query, this.inputs.dataSourceId, {
        partition: 'probe',
        signal: controller?.signal,
      }),
      timeoutResult,
    ]);
    if (timeout) {
      clearTimeout(timeout);
    }
    return this.inputs.isCurrent()
      ? resolution
      : { status: 'error', error: new Error('stale lint generation') };
  }
}

async function isolateOutcome(
  outcome: ExplainOutcome,
  candidates: ExplainAttributionCandidateSnapshot[],
  probeSet: ExplainProbeSet,
  inputs: ExplainAttributionInputs,
  budget: ProbeBudget
): Promise<Set<string> | undefined> {
  const queries = [probeSet.controlQuery, ...probeSet.treatments.map(({ query }) => query)];
  if (budget.remainingRequests() < queries.length) {
    return undefined;
  }
  const validation = await budget.validate(queries);
  if (!validation || validation.some((valid) => !valid) || !inputs.isCurrent()) {
    return undefined;
  }

  const control = await budget.explain(probeSet.controlQuery);
  if (control.status !== 'ok' || hasExplainOutcome(control.plan, outcome)) {
    return undefined;
  }

  const treatmentResults = await mapWithConcurrency(
    probeSet.treatments,
    EXPLAIN_MAX_IN_FLIGHT,
    async (treatment) => ({
      candidate: treatment.candidate,
      resolution: await budget.explain(treatment.query),
    })
  );
  if (treatmentResults.some(({ resolution }) => resolution.status === 'error')) {
    return undefined;
  }

  return new Set(
    treatmentResults
      .filter(
        ({ resolution }) =>
          resolution.status === 'ok' && hasExplainOutcome(resolution.plan, outcome)
      )
      .map(({ candidate }) => candidate.id)
      .filter((id) => candidates.some((candidate) => candidate.id === id))
  );
}

async function confirmAliases(
  outcome: ExplainOutcome,
  candidates: ExplainAttributionCandidateSnapshot[],
  selection: ExplainAttributionSelection,
  probeSet: ExplainProbeSet,
  inputs: ExplainAttributionInputs,
  budget: ProbeBudget
): Promise<Set<string>> {
  const confirmed = new Set<string>();
  const nativeOutcome = nativeOutcomeFor(outcome);
  if (!nativeOutcome || budget.remainingRequests() < 1) {
    return confirmed;
  }

  const probes = candidates
    .filter(
      (candidate) =>
        selection.candidateIds.has(candidate.id) && !!candidate.aliasBinding?.baseFieldSource
    )
    .map((candidate) => {
      const binding = candidate.aliasBinding!;
      return {
        candidate,
        query: probeSet.buildTreatment(candidate, [
          {
            startOffset: binding.definitionStartOffset,
            endOffset: binding.definitionEndOffset,
            text: binding.baseFieldSource!,
          },
        ]),
      };
    })
    .filter(
      (probe): probe is { candidate: ExplainAttributionCandidateSnapshot; query: string } =>
        !!probe.query
    )
    .slice(0, budget.remainingRequests());
  if (probes.length === 0) {
    return confirmed;
  }

  const validation = await budget.validate(probes.map(({ query }) => query));
  if (!validation || !inputs.isCurrent()) {
    return confirmed;
  }
  for (let index = 0; index < probes.length; index++) {
    if (!validation[index] || !inputs.isCurrent()) {
      continue;
    }
    const resolution = await budget.explain(probes[index].query);
    if (
      resolution.status === 'ok' &&
      !hasExplainOutcome(resolution.plan, outcome) &&
      hasExplainOutcome(resolution.plan, nativeOutcome)
    ) {
      confirmed.add(probes[index].candidate.id);
    }
  }
  return confirmed;
}

async function verifyFixes(
  diagnostics: Diagnostic[],
  snapshot: ExplainAttributionSnapshot,
  inputs: ExplainAttributionInputs,
  budget: ProbeBudget
): Promise<Set<string>> {
  const verified = new Set<string>();
  const probes = diagnostics
    .map((diagnostic) => {
      const target = diagnostic.explainTarget;
      const candidateId = diagnostic.attribution?.candidateId;
      const candidate = snapshot.candidates.find(({ id }) => id === candidateId);
      const candidates = target ? candidatesFor(snapshot, target.operation) : [];
      const probeSet = target && buildExplainProbeSet(inputs.query, candidates);
      const edit = candidate && fixEdit(inputs.query, candidate, diagnostic);
      const query = candidate && edit && probeSet?.buildTreatment(candidate, [edit]);
      return target && candidate && query ? { target, candidate, query } : undefined;
    })
    .filter(
      (
        probe
      ): probe is {
        target: NonNullable<Diagnostic['explainTarget']>;
        candidate: ExplainAttributionCandidateSnapshot;
        query: string;
      } => !!probe
    )
    .slice(0, budget.remainingRequests());
  if (probes.length === 0) {
    return verified;
  }

  const validation = await budget.validate(probes.map(({ query }) => query));
  if (!validation || !inputs.isCurrent()) {
    return verified;
  }
  for (let index = 0; index < probes.length; index++) {
    if (!validation[index] || !inputs.isCurrent()) {
      continue;
    }
    const probe = probes[index];
    const resolution = await budget.explain(probe.query);
    if (resolution.status === 'ok' && !hasExplainOutcome(resolution.plan, probe.target.outcome)) {
      verified.add(probe.candidate.id);
    }
  }
  return verified;
}

export async function runExplainIsolation(
  inputs: ExplainAttributionInputs,
  state: ExplainAttributionState
): Promise<Diagnostic[]> {
  const selections = selectionsForUniqueCandidates(inputs.baselineDiagnostics, state.snapshot);
  const probeSets = new Map<ExplainOperation, ExplainProbeSet>();
  const budget = new ProbeBudget(inputs);

  for (const diagnostic of inputs.baselineDiagnostics) {
    const target = diagnostic.explainTarget;
    if (
      !target ||
      selections.has(target.outcome) ||
      state.snapshot.unsupportedOperations.includes(target.operation)
    ) {
      continue;
    }
    const candidates = candidatesFor(state.snapshot, target.operation);
    if (
      candidates.length < 2 ||
      candidates.length > EXPLAIN_MAX_AMBIGUOUS_CANDIDATES ||
      budget.remainingRequests() < candidates.length + 1
    ) {
      continue;
    }
    const probeSet = buildExplainProbeSet(inputs.query, candidates);
    if (!probeSet) {
      continue;
    }
    probeSets.set(target.operation, probeSet);
    const candidateIds = await isolateOutcome(target.outcome, candidates, probeSet, inputs, budget);
    if (candidateIds?.size) {
      selections.set(target.outcome, {
        candidateIds,
        confidence: 'causal-probe',
      });
    }
  }

  for (const diagnostic of inputs.baselineDiagnostics) {
    const target = diagnostic.explainTarget;
    const selection = target && selections.get(target.outcome);
    if (!target || !selection || !inputs.isCurrent()) {
      continue;
    }
    const candidates = candidatesFor(state.snapshot, target.operation);
    const probeSet =
      probeSets.get(target.operation) ?? buildExplainProbeSet(inputs.query, candidates);
    if (!probeSet) {
      continue;
    }
    const aliasConfirmedIds = await confirmAliases(
      target.outcome,
      candidates,
      selection,
      probeSet,
      inputs,
      budget
    );
    if (aliasConfirmedIds.size) {
      selection.aliasConfirmedIds = aliasConfirmedIds;
    }
  }

  if (!inputs.isCurrent()) {
    return [];
  }
  const resolved = resolveExplainRanges(inputs.baselineDiagnostics, {
    query: inputs.query,
    snapshot: state.snapshot,
    typeMap: inputs.typeMap,
    attributions: selections,
  });
  const verifiedFixes = await verifyFixes(resolved, state.snapshot, inputs, budget);
  if (!inputs.isCurrent()) {
    return [];
  }
  return resolved.map((diagnostic) =>
    diagnostic.fix && !verifiedFixes.has(diagnostic.attribution?.candidateId ?? '')
      ? { ...diagnostic, fix: undefined }
      : diagnostic
  );
}
