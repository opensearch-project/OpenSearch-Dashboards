/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dataset } from '../../../../../../data/common';
import {
  AI_ROOT_FIELD_PPL,
  GENAI_ROOT_CONDITION,
  PPLRunner,
  ShadowedAiRoots,
  hasAiRootField,
  setShadowedAiRoots,
} from '../../../utils/ai_root';
import { pplResponseToRecords } from '../../sessions/session_utils';
import { escapePPLValue } from '../trace_details/data_fetching/ppl_request_helpers';

/** Marked spans looked at; beyond this a few duplicate agent runs may still be listed. */
export const MARKED_SPANS_LIMIT = 5000;
/** Spans read to walk the parent chains of traces with several marked spans. */
export const SHADOWED_SPANS_LIMIT = 10000;

const CACHE_TTL_MS = 60_000;

interface SpanLink {
  traceId: string;
  spanId: string;
  parentSpanId: string;
}

const spanLinks = (response: unknown): SpanLink[] =>
  pplResponseToRecords(response)
    .filter((r) => typeof r.traceId === 'string' && typeof r.spanId === 'string')
    .map((r) => ({
      traceId: r.traceId as string,
      spanId: r.spanId as string,
      parentSpanId: typeof r.parentSpanId === 'string' ? r.parentSpanId : '',
    }));

const inList = (values: string[]) => values.map(escapePPLValue).join(', ');

/**
 * Marked spans that must not be listed as AI roots, so each agent run is listed and counted once:
 * - a marked span below the root of a trace that also has a GenAI root (an SDK marked it);
 * - a marked span with a marked ancestor (Data Prepper marked it, then its late parent).
 */
export const fetchShadowedAiRoots = async (
  ppl: PPLRunner,
  dataset: Dataset,
  sourceCommand: string
): Promise<ShadowedAiRoots> => {
  // One more than the limit tells "exactly at the limit" from "more".
  const marked = spanLinks(
    await ppl.executeQuery(
      dataset,
      `${sourceCommand} | where ${AI_ROOT_FIELD_PPL} = true | fields traceId, spanId, parentSpanId | head ${
        MARKED_SPANS_LIMIT + 1
      }`
    )
  );
  let capped = marked.length > MARKED_SPANS_LIMIT;
  const byTrace = new Map<string, SpanLink[]>();
  for (const span of marked.slice(0, MARKED_SPANS_LIMIT)) {
    byTrace.set(span.traceId, [...(byTrace.get(span.traceId) ?? []), span]);
  }
  const hidden = new Set<string>();

  const belowRoot = [...byTrace.keys()].filter((id) =>
    byTrace.get(id)?.some((s) => s.parentSpanId !== '')
  );
  const withGenAiRoot = new Set(
    belowRoot.length === 0
      ? []
      : pplResponseToRecords(
          await ppl.executeQuery(
            dataset,
            `${sourceCommand} | where ${GENAI_ROOT_CONDITION} and traceId in (${inList(
              belowRoot
            )}) | stats count() by traceId`
          )
        ).map((r) => r.traceId)
  );
  for (const traceId of withGenAiRoot) {
    for (const span of byTrace.get(traceId as string) ?? []) {
      if (span.parentSpanId !== '') hidden.add(span.spanId);
    }
  }

  const nested = [...byTrace.keys()].filter(
    (id) => !withGenAiRoot.has(id) && (byTrace.get(id)?.length ?? 0) > 1
  );
  if (nested.length > 0) {
    const spans = spanLinks(
      await ppl.executeQuery(
        dataset,
        `${sourceCommand} | where traceId in (${inList(
          nested
        )}) | fields traceId, spanId, parentSpanId | head ${SHADOWED_SPANS_LIMIT + 1}`
      )
    );
    if (spans.length > SHADOWED_SPANS_LIMIT) capped = true;
    const parentOf = new Map(spans.map((s) => [`${s.traceId}:${s.spanId}`, s.parentSpanId]));
    for (const traceId of nested) {
      const markedIds = new Set((byTrace.get(traceId) ?? []).map((s) => s.spanId));
      for (const spanId of markedIds) {
        const seen = new Set<string>();
        let parentId = parentOf.get(`${traceId}:${spanId}`);
        while (parentId && !seen.has(parentId)) {
          if (markedIds.has(parentId)) {
            hidden.add(spanId);
            break;
          }
          seen.add(parentId);
          parentId = parentOf.get(`${traceId}:${parentId}`);
        }
      }
    }
  }
  return { spanIds: [...hidden].sort(), capped };
};

const looked = new Map<string, { source: string; timeKey?: string; at: number }>();
const pending = new Map<string, Promise<void>>();

/**
 * Looks up the shadowed AI roots of a dataset at most once a minute per source and time range,
 * and records them so `aiRootCondition` excludes them. Without a `timeKey`, any recent lookup for
 * the dataset will do. Nothing to do while the marker is unmapped; a failed lookup keeps the last
 * result.
 */
export const ensureShadowedAiRootsChecked = async (
  ppl: PPLRunner | undefined,
  dataset: Dataset | undefined | null,
  sourceCommand: string,
  timeKey?: string
): Promise<void> => {
  if (!ppl || !dataset?.id || !sourceCommand || !hasAiRootField(dataset.id)) return;
  const datasetId = dataset.id;
  const last = looked.get(datasetId);
  const fresh = !!last && Date.now() - last.at < CACHE_TTL_MS;
  if (
    fresh &&
    last?.source === sourceCommand &&
    (timeKey === undefined || last.timeKey === timeKey)
  ) {
    return;
  }
  const key = `${datasetId}|${sourceCommand}|${timeKey ?? ''}`;
  const inFlight = pending.get(key);
  if (inFlight) return inFlight;
  const lookup = fetchShadowedAiRoots(ppl, dataset, sourceCommand)
    .then(
      (result) => {
        looked.set(datasetId, { source: sourceCommand, timeKey, at: Date.now() });
        setShadowedAiRoots(datasetId, result);
      },
      () => undefined
    )
    .finally(() => pending.delete(key));
  pending.set(key, lookup);
  return lookup;
};

/** For tests. */
export const resetShadowedAiRootChecks = () => {
  looked.clear();
  pending.clear();
};
