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
const record = (datasetId: string, present: boolean) => {
  const changed = checks.get(datasetId)?.present !== present;
  checks.set(datasetId, { at: Date.now(), present });
  if (changed) {
    version += 1;
    listeners.forEach((listener) => listener());
  }
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Changes whenever the AI-root condition of any dataset changes; use in memo dependencies. */
export const useAiRootFieldVersion = (): number => useSyncExternalStore(subscribe, () => version);

export const hasAiRootField = (datasetId: string | undefined): boolean =>
  !!datasetId && !!checks.get(datasetId)?.present;

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
      () => record(dataset.id, false)
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
};

/** For tests and callers that already know the mapping. */
export const setAiRootFieldPresent = (datasetId: string, present: boolean) =>
  record(datasetId, present);
