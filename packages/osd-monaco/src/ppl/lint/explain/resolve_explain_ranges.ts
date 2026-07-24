/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Diagnostic, DiagnosticAttribution } from '../diagnostic';
import {
  ExplainAttributionCandidateSnapshot,
  ExplainAttributionSnapshot,
} from './attribution/snapshot';
import { buildFilterInversionFix } from './explain_quick_fix';
import { ExplainOutcome } from './explain_types';

export interface ExplainAttributionSelection {
  candidateIds: Set<string>;
  confidence: DiagnosticAttribution['confidence'];
  /** Candidates whose defining alias expression passed a native control probe. */
  aliasConfirmedIds?: Set<string>;
}

export interface ResolveExplainRangesOptions {
  query: string;
  snapshot: ExplainAttributionSnapshot;
  typeMap?: Map<string, string>;
  attributions?: Map<ExplainOutcome, ExplainAttributionSelection>;
}

interface FixResult {
  fix: NonNullable<Diagnostic['fix']>;
  field: string;
  literal: string;
}

function buildFilterFix(
  candidate: ExplainAttributionCandidateSnapshot,
  query: string,
  typeMap: Map<string, string> | undefined
): FixResult | undefined {
  const comparison = candidate.filterComparison;
  if (!comparison) {
    return undefined;
  }
  const expectedText = query.slice(comparison.startOffset, comparison.endOffset);
  const inversion = buildFilterInversionFix(expectedText, typeMap);
  if (!inversion) {
    return undefined;
  }
  return {
    fix: {
      title: inversion.title,
      text: inversion.text,
      range: comparison.range,
      expectedText,
    },
    field: inversion.field,
    literal: inversion.literal,
  };
}

function resolveCandidate(
  diagnostic: Diagnostic,
  candidate: ExplainAttributionCandidateSnapshot,
  confidence: DiagnosticAttribution['confidence'],
  aliasConfirmed: boolean,
  options: ResolveExplainRangesOptions
): Diagnostic {
  const useAliasDefinition = aliasConfirmed && !!candidate.aliasBinding;
  const range = useAliasDefinition ? candidate.aliasBinding!.definitionRange : candidate.focusRange;
  const relatedRanges = useAliasDefinition
    ? [candidate.relatedRange ?? candidate.focusRange]
    : undefined;
  const resolved: Diagnostic = {
    ...diagnostic,
    range,
    attribution: {
      confidence,
      candidateId: candidate.id,
      relatedRanges,
    },
  };

  if (candidate.operation !== 'filter' || useAliasDefinition) {
    return resolved;
  }

  const fix = buildFilterFix(candidate, options.query, options.typeMap);
  if (!fix) {
    return resolved;
  }
  return {
    ...resolved,
    fix: fix.fix,
    hoverFacts: {
      ...resolved.hoverFacts,
      field: fix.field,
      literal: fix.literal,
    },
  };
}

/**
 * Resolve explain-backed diagnostics to exact snapshot candidates. Ambiguous,
 * unsupported, or missing candidates are omitted; a whole-query marker never
 * leaves this function.
 */
export function resolveExplainRanges(
  diagnostics: Diagnostic[],
  options: ResolveExplainRangesOptions
): Diagnostic[] {
  const { snapshot } = options;
  return diagnostics.flatMap((diagnostic) => {
    const target = diagnostic.explainTarget;
    if (!target) {
      return [diagnostic];
    }
    if (snapshot.unsupportedOperations.includes(target.operation)) {
      return [];
    }

    const candidates = snapshot.candidates.filter(
      (candidate) => candidate.operation === target.operation
    );
    const explicit = options.attributions?.get(target.outcome);
    const selection: ExplainAttributionSelection | undefined =
      explicit ??
      (candidates.length === 1
        ? { candidateIds: new Set([candidates[0].id]), confidence: 'unique-source' }
        : undefined);
    if (!selection) {
      return [];
    }

    return candidates
      .filter((candidate) => selection.candidateIds.has(candidate.id))
      .map((candidate) =>
        resolveCandidate(
          diagnostic,
          candidate,
          selection.confidence,
          selection.aliasConfirmedIds?.has(candidate.id) ?? false,
          options
        )
      );
  });
}
