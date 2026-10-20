/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useSyncExternalStore } from 'react';
import { Dataset } from '../../../../data/common';

/**
 * Set by Data Prepper (`otel_traces`), an SDK or the user on the outermost GenAI span of a trace
 * whose root is not a GenAI span, such as an agent behind an HTTP handler. Agent Traces lists
 * that span as the trace's AI root.
 */
export const AI_ROOT_FIELD = 'attributes.derived.gen_ai.is_root';

const OPERATION_FIELD = '`attributes.gen_ai.operation.name`';
export const AI_ROOT_FIELD_PPL = `\`${AI_ROOT_FIELD}\``;

/** A trace root that is a GenAI span. */
export const GENAI_ROOT_CONDITION = `parentSpanId = "" AND isnotnull(${OPERATION_FIELD})`;

/**
 * PPL condition for the spans listed as agent traces. The marker is only referenced once it is
 * known to be in the index mapping: PPL rejects a query that names an unmapped field.
 */
export const aiRootCondition = (datasetId: string | undefined): string => {
  if (!hasAiRootField(datasetId)) return GENAI_ROOT_CONDITION;
  const condition = `(${GENAI_ROOT_CONDITION}) OR ${AI_ROOT_FIELD_PPL} = true`;
  const hidden = shadowedAiRootSpanIds(datasetId);
  return hidden.length > 0 ? `(${condition}) AND NOT ${spanIdIn(hidden)}` : condition;
};

const quote = (value: string) => `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

/** PPL `spanId in (...)` for the given span IDs. */
export const spanIdIn = (spanIds: string[]): string =>
  `spanId in (${spanIds.map(quote).join(', ')})`;

/** Whether a span document is marked as an AI root. */
export const isMarkedAiRoot = (source: Record<string, unknown> | undefined): boolean => {
  if (!source) return false;
  const attributes = source.attributes as Record<string, unknown> | undefined;
  const flat = attributes?.['derived.gen_ai.is_root'];
  const derived = attributes?.derived as Record<string, unknown> | undefined;
  const genAi = derived?.gen_ai as Record<string, unknown> | undefined;
  const value = flat ?? genAi?.is_root ?? source[AI_ROOT_FIELD];
  return value === true || value === 'true';
};

const readFlat = (source: Record<string, unknown> | undefined, key: string): unknown => {
  if (!source) return undefined;
  const attributes = source.attributes as Record<string, unknown> | undefined;
  if (attributes && key in attributes) return attributes[key];
  let current: unknown = attributes;
  for (const part of key.split('.')) {
    if (!current || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current ?? source[`attributes.${key}`];
};

/** Whether a span document is a GenAI span (has `gen_ai.operation.name`). */
export const isGenAiSpanDocument = (source: Record<string, unknown> | undefined): boolean => {
  const value = readFlat(source, 'gen_ai.operation.name');
  return value !== undefined && value !== null && value !== '';
};

interface SpanRowLike {
  spanId?: string;
  parentSpanId?: string | null;
  rawDocument?: Record<string, unknown>;
}

/**
 * Drops marked spans that have a marked ancestor among `rows`. Data Prepper can mark a span and,
 * once a late parent arrives, its outermost GenAI ancestor too; only the outermost one counts.
 */
const outermostMarked = <T extends SpanRowLike>(rows: T[], marked: T[]): T[] => {
  const byId = new Map(rows.filter((r) => r.spanId).map((r) => [r.spanId, r]));
  const hasMarkedAncestor = (row: T) => {
    const seen = new Set<string>();
    let parentId = row.parentSpanId;
    while (parentId && !seen.has(parentId)) {
      seen.add(parentId);
      const parent = byId.get(parentId);
      if (!parent) return false;
      if (isMarkedAiRoot(parent.rawDocument)) return true;
      parentId = parent.parentSpanId;
    }
    return false;
  };
  return marked.filter((r) => !hasMarkedAncestor(r));
};

const rawStartOf = (row: SpanRowLike) => String(row.rawDocument?.startTime ?? '');

/**
 * The spans that represent one trace in Agent Traces, by the same rule everywhere: a trace root
 * that is a GenAI span or is marked wins; otherwise every marked span (parallel agents behind
 * one HTTP root), earliest first. Empty when the trace has neither.
 */
export const aiRootsOf = <T extends SpanRowLike>(rows: T[]): T[] => {
  const roots = rows.filter(
    (r) => !r.parentSpanId && (isMarkedAiRoot(r.rawDocument) || isGenAiSpanDocument(r.rawDocument))
  );
  if (roots.length > 0) return roots;
  return outermostMarked(
    rows,
    rows.filter((r) => isMarkedAiRoot(r.rawDocument))
  ).sort((a, b) => rawStartOf(a).localeCompare(rawStartOf(b)));
};

/** Whether this span is one that represents its trace (see `aiRootsOf`). */
export const isAiRootRow = (row: SpanRowLike): boolean =>
  isMarkedAiRoot(row.rawDocument) || (!row.parentSpanId && isGenAiSpanDocument(row.rawDocument));

interface SpanHit {
  _source?: Record<string, unknown>;
}

/**
 * Drops AI-root spans whose trace is also listed through its GenAI root, which can happen when an
 * SDK marks a span in a trace that also has a GenAI root. Rows without a parent are GenAI roots,
 * since only those pass the AI-root condition.
 */
export const dropShadowedAiRoots = <T extends SpanHit>(hits: T[]): T[] => {
  const rootTraceIds = new Set(
    hits.filter((hit) => !hit._source?.parentSpanId).map((hit) => hit._source?.traceId)
  );
  return hits.filter(
    (hit) => !hit._source?.parentSpanId || !rootTraceIds.has(hit._source?.traceId)
  );
};

const CHECK_TTL_MS = 5 * 60_000;
const checks = new Map<string, { at: number; present: boolean }>();
const pending = new Map<string, Promise<void>>();

// Query cache keys include the AI-root condition, so components that memoize a key subscribe here
// to recompute it once a check changes the condition.
let version = 0;
const listeners = new Set<() => void>();
const bumpVersion = () => {
  version += 1;
  listeners.forEach((listener) => listener());
};
const record = (datasetId: string, present: boolean) => {
  const changed = checks.get(datasetId)?.present !== present;
  checks.set(datasetId, { at: Date.now(), present });
  if (changed) bumpVersion();
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Changes whenever the AI-root condition of any dataset changes; use in memo dependencies. */
export const useAiRootFieldVersion = (): number => useSyncExternalStore(subscribe, () => version);

const FIELD_NOT_FOUND = /FIELD_NOT_FOUND|can't resolve Symbol|Field \[[^\]]*\] not found/i;

const isFieldNotFound = (error: unknown): boolean => {
  const parts: unknown[] = [error];
  if (error && typeof error === 'object') {
    const e = error as { message?: unknown; body?: unknown };
    parts.push(e.message, e.body);
  }
  return parts.some((part) => {
    if (part === undefined || part === null) return false;
    const text = typeof part === 'string' ? part : JSON.stringify(part);
    return FIELD_NOT_FOUND.test(text ?? '');
  });
};

export const hasAiRootField = (datasetId: string | undefined): boolean =>
  !!datasetId && !!checks.get(datasetId)?.present;

export interface ShadowedAiRoots {
  /** Marked spans that must not be listed as AI roots (see `fetchShadowedAiRoots`). */
  spanIds: string[];
  /** The lookup hit its limit, so a few duplicate agent runs may still be counted. */
  capped: boolean;
}

const NO_SHADOWED: ShadowedAiRoots = { spanIds: [], capped: false };
const shadowed = new Map<string, ShadowedAiRoots>();

/** The latest shadowed AI roots looked up for a dataset. */
export const shadowedAiRootsOf = (datasetId: string | undefined): ShadowedAiRoots =>
  (datasetId && shadowed.get(datasetId)) || NO_SHADOWED;

export const shadowedAiRootSpanIds = (datasetId: string | undefined): string[] =>
  shadowedAiRootsOf(datasetId).spanIds;

/** Records the shadowed AI roots of a dataset; `aiRootCondition` excludes them from then on. */
export const setShadowedAiRoots = (datasetId: string, next: ShadowedAiRoots) => {
  const current = shadowedAiRootsOf(datasetId);
  shadowed.set(datasetId, next);
  if (
    current.capped !== next.capped ||
    current.spanIds.length !== next.spanIds.length ||
    current.spanIds.some((id, i) => id !== next.spanIds[i])
  ) {
    bumpVersion();
  }
};

export interface PPLRunner {
  executeQuery(dataset: Dataset, pplQuery: string): Promise<unknown>;
}

/**
 * Checks once per dataset (re-checked after a few minutes, so a newly mapped field is picked up)
 * whether the AI-root marker is in the index mapping. A one-row query on the field fails while
 * it is unmapped.
 */
export const ensureAiRootFieldChecked = async (
  ppl: PPLRunner | undefined,
  dataset: Dataset | undefined | null,
  sourceCommand: string
): Promise<void> => {
  if (!ppl || !dataset?.id || !sourceCommand) return;
  const cached = checks.get(dataset.id);
  if (cached && Date.now() - cached.at < CHECK_TTL_MS) return;
  const inFlight = pending.get(dataset.id);
  if (inFlight) return inFlight;
  const check = ppl
    .executeQuery(dataset, `${sourceCommand} | where isnotnull(${AI_ROOT_FIELD_PPL}) | head 1`)
    .then(
      () => record(dataset.id, true),
      (error: unknown) => {
        // Cache "unmapped" only when the field is reported missing; a timeout or 5xx is retried on
        // the next query instead of hiding agent traces for the whole cache period.
        if (isFieldNotFound(error)) record(dataset.id, false);
      }
    )
    .then(() => undefined)
    .finally(() => pending.delete(dataset.id));
  pending.set(dataset.id, check);
  return check;
};

/** For tests. */
export const resetAiRootFieldChecks = () => {
  checks.clear();
  pending.clear();
  shadowed.clear();
};

/** For tests and callers that already know the mapping. */
export const setAiRootFieldPresent = (datasetId: string, present: boolean) =>
  record(datasetId, present);
