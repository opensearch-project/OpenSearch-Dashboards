/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dataset } from '../../../../data/common';
import { createFieldMappingCheck, PPLRunner } from './field_mapping_check';

export type { PPLRunner };

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
export const aiRootCondition = (datasetId: string | undefined): string =>
  hasAiRootField(datasetId)
    ? `(${GENAI_ROOT_CONDITION}) OR ${AI_ROOT_FIELD_PPL} = true`
    : GENAI_ROOT_CONDITION;

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
 * Whether `spanId` has an ancestor in `winners`, walking `parentOf` (span id to parent span id,
 * within one trace). A malformed chain (a span that is its own parent, or a cycle) never counts:
 * hiding on it could hide every span of the cycle.
 */
export const hasAncestorIn = (
  spanId: string,
  parentOf: (id: string) => string | null | undefined,
  winners: Set<string>
): boolean => {
  const seen = new Set<string>([spanId]);
  let found = false;
  let parentId = parentOf(spanId);
  while (parentId) {
    if (seen.has(parentId)) return false;
    seen.add(parentId);
    if (winners.has(parentId)) found = true;
    parentId = parentOf(parentId);
  }
  return found;
};

/**
 * Drops marked spans that have a marked ancestor among `rows`. Data Prepper can mark a span and,
 * once a late parent arrives, its outermost GenAI ancestor too; only the outermost one counts.
 */
const outermostMarked = <T extends SpanRowLike>(rows: T[], marked: T[]): T[] => {
  const parents = new Map(rows.filter((r) => r.spanId).map((r) => [r.spanId, r.parentSpanId]));
  const markedIds = new Set(marked.map((r) => r.spanId).filter((id): id is string => !!id));
  return marked.filter(
    (r) => !r.spanId || !hasAncestorIn(r.spanId, (id) => parents.get(id), markedIds)
  );
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

const aiRootFieldCheck = createFieldMappingCheck(AI_ROOT_FIELD_PPL);

/** Changes whenever the AI-root condition of any dataset changes; use in memo dependencies. */
export const useAiRootFieldVersion = (): number => aiRootFieldCheck.useVersion();

export const hasAiRootField = (datasetId: string | undefined): boolean =>
  aiRootFieldCheck.isPresent(datasetId);

/**
 * Checks once per dataset (re-checked after a few minutes, so a newly mapped field is picked up)
 * whether the AI-root marker is in the index mapping. A one-row query on the field fails while
 * it is unmapped.
 */
export const ensureAiRootFieldChecked = (
  ppl: PPLRunner | undefined,
  dataset: Dataset | undefined | null,
  sourceCommand: string
): Promise<void> => aiRootFieldCheck.ensureChecked(ppl, dataset, sourceCommand);

/** For tests. */
export const resetAiRootFieldChecks = () => aiRootFieldCheck.reset();

/** For tests and callers that already know the mapping. */
export const setAiRootFieldPresent = (datasetId: string, present: boolean) =>
  aiRootFieldCheck.setPresent(datasetId, present);
