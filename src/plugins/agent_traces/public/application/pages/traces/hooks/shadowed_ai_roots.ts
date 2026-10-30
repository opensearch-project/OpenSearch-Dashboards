/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dataset } from '../../../../../../data/common';
import {
  AI_ROOT_FIELD_PPL,
  GENAI_ROOT_CONDITION,
  PPLRunner,
  hasAiRootField,
  hasAncestorIn,
} from '../../../utils/ai_root';
import { pplResponseToRecords } from '../../sessions/session_utils';
import { escapePPLValue } from '../trace_details/data_fetching/ppl_request_helpers';

/**
 * Traces whose parent chains are read in one lookup. PPL turns `in (...)` into one OR clause
 * per value on clusters without Calcite, so lists stay under OpenSearch's 1024-clause default.
 */
export const LOOKUP_TRACES_LIMIT = 500;
/** IDs in the metrics' exclusion, under the same clause limit. */
export const COUNTS_EXCLUSION_LIMIT = 1000;
/** Spans read to walk the parent chains of the traces looked up. */
export const CHAIN_SPANS_LIMIT = 10000;

export interface SpanLink {
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

const traceIdsOf = (response: unknown): string[] =>
  pplResponseToRecords(response)
    .map((r) => r.traceId)
    .filter((id): id is string => typeof id === 'string');

const inList = (values: string[]) => values.map(escapePPLValue).join(', ');

/** A trace's spans can start before the picked range, so their chains are read without it. */
const withoutTimeRange = (dataset: Dataset): Dataset =>
  ({
    id: dataset.id,
    title: dataset.title,
    type: dataset.type,
    ...(dataset.dataSource && { dataSource: dataset.dataSource }),
  }) as Dataset;

/** The parent of every span of `traceIds`, keyed `traceId:spanId`. */
const fetchParents = async (
  ppl: PPLRunner,
  dataset: Dataset,
  sourceCommand: string,
  traceIds: string[]
): Promise<{ parents: Map<string, string>; capped: boolean }> => {
  const spans = spanLinks(
    await ppl.executeQuery(
      withoutTimeRange(dataset),
      `${sourceCommand} | where traceId in (${inList(
        traceIds
      )}) | fields traceId, spanId, parentSpanId | head ${CHAIN_SPANS_LIMIT + 1}`
    )
  );
  return {
    parents: new Map(spans.map((s) => [runKey(s.traceId, s.spanId), s.parentSpanId])),
    capped: spans.length > CHAIN_SPANS_LIMIT,
  };
};

/** Identifies one agent run: span ids are only unique within their trace. */
export const runKey = (traceId: string, spanId: string) => `${traceId}:${spanId}`;

/** Runs of `rows` (as `runKey`s) with an ancestor among the other rows of their trace. */
const nestedAmong = (rows: SpanLink[], parents: Map<string, string>): Set<string> => {
  const byTrace = new Map<string, SpanLink[]>();
  for (const row of rows) {
    const traceRows = byTrace.get(row.traceId);
    if (traceRows) traceRows.push(row);
    else byTrace.set(row.traceId, [row]);
  }
  const nested = new Set<string>();
  for (const [traceId, traceRows] of byTrace) {
    const winners = new Set(traceRows.map((r) => r.spanId));
    for (const row of traceRows) {
      if (hasAncestorIn(row.spanId, (id) => parents.get(runKey(traceId, id)), winners)) {
        nested.add(runKey(traceId, row.spanId));
      }
    }
  }
  return nested;
};

/**
 * Agent runs to drop from rows already fetched (the Traces table, a dashboard panel, a
 * session's runs): a run whose ancestor is another of the rows, such as a marked span under
 * a GenAI root, or under a span Data Prepper marked once its late parent arrived. Only traces
 * listed more than once are looked up, and a run is dropped only while the run above it is
 * among the rows, so a filter that matches the inner run alone still shows it. Returns
 * `runKey`s.
 */
export const nestedAiRunsAmong = async (
  ppl: PPLRunner,
  dataset: Dataset,
  sourceCommand: string,
  rows: SpanLink[]
): Promise<Set<string>> => {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.traceId, (counts.get(row.traceId) ?? 0) + 1);
  const repeated = [...counts.keys()]
    .filter((id) => (counts.get(id) ?? 0) > 1)
    .slice(0, LOOKUP_TRACES_LIMIT);
  if (repeated.length === 0) return new Set();
  const { parents } = await fetchParents(ppl, dataset, sourceCommand, repeated);
  const traces = new Set(repeated);
  return nestedAmong(
    rows.filter((r) => traces.has(r.traceId)),
    parents
  );
};

export interface CountsExclusion {
  /** ` AND NOT ...` to append to the AI-root condition in the metrics' `where` clauses. */
  clause: string;
  /** Not every shadowed run could be looked up (or the lookup failed): counts may be high. */
  capped: boolean;
}

/**
 * Leaves shadowed AI roots out of the metrics, so each agent run is counted once: marked spans
 * below the root of a trace that also has a GenAI root, and marked spans under another marked
 * span. Bounded to COUNTS_EXCLUSION_LIMIT ids; beyond that, or when a lookup fails, `capped`
 * tells the metrics bar to note that counts may include a few duplicate agent runs.
 * `scopeQuery` (the user's filter) picks the runs to check, like the rows the table lists;
 * parent chains are read from `sourceCommand`, so a filter does not break them.
 */
export const shadowedAiRootsExclusion = async (
  ppl: PPLRunner,
  dataset: Dataset,
  sourceCommand: string,
  scopeQuery: string = sourceCommand
): Promise<CountsExclusion> => {
  if (!hasAiRootField(dataset.id)) return { clause: '', capped: false };
  try {
    let capped = false;
    // Independent lookups, run together: traces with a marked span below their root (then those
    // of them with a GenAI root), and traces with several marked spans.
    const [withGenAiRoot, repeatedAll] = await Promise.all([
      (async () => {
        const belowRoot = traceIdsOf(
          await ppl.executeQuery(
            dataset,
            `${scopeQuery} | where ${AI_ROOT_FIELD_PPL} = true and parentSpanId != "" | stats count() by traceId | head ${
              COUNTS_EXCLUSION_LIMIT + 1
            }`
          )
        );
        if (belowRoot.length > COUNTS_EXCLUSION_LIMIT) capped = true;
        if (belowRoot.length === 0) return [];
        return traceIdsOf(
          await ppl.executeQuery(
            dataset,
            `${scopeQuery} | where ${GENAI_ROOT_CONDITION} and traceId in (${inList(
              belowRoot.slice(0, COUNTS_EXCLUSION_LIMIT)
            )}) | stats count() by traceId`
          )
        );
      })(),
      ppl
        .executeQuery(
          dataset,
          `${scopeQuery} | where ${AI_ROOT_FIELD_PPL} = true | stats count() as runs by traceId | where runs > 1 | head ${
            LOOKUP_TRACES_LIMIT + 1
          }`
        )
        .then(traceIdsOf),
    ]);

    // Marked spans under another marked span, in traces without a GenAI root.
    const genAiTraces = new Set(withGenAiRoot);
    const repeated = repeatedAll.filter((id) => !genAiTraces.has(id));
    if (repeatedAll.length > LOOKUP_TRACES_LIMIT) capped = true;
    let nested: string[] = [];
    const lookup = repeated.slice(0, LOOKUP_TRACES_LIMIT);
    if (lookup.length > 0) {
      const [markedResponse, chains] = await Promise.all([
        // In the range and scope, like the runs counted: an outer run outside them does not
        // hide an inner run that is counted.
        ppl.executeQuery(
          dataset,
          `${scopeQuery} | where ${AI_ROOT_FIELD_PPL} = true and traceId in (${inList(
            lookup
          )}) | fields traceId, spanId, parentSpanId | head ${CHAIN_SPANS_LIMIT + 1}`
        ),
        // The chains between them, whatever the range.
        fetchParents(ppl, dataset, sourceCommand, lookup),
      ]);
      const marked = spanLinks(markedResponse);
      if (marked.length > CHAIN_SPANS_LIMIT || chains.capped) capped = true;
      nested = [...nestedAmong(marked, chains.parents)]
        .map((key) => key.slice(key.indexOf(':') + 1))
        .sort();
    }

    const traces = withGenAiRoot.slice(0, COUNTS_EXCLUSION_LIMIT);
    const spans = nested.slice(0, COUNTS_EXCLUSION_LIMIT - traces.length);
    if (spans.length < nested.length) capped = true;
    const parts = [
      ...(traces.length > 0 ? [`NOT (parentSpanId != "" AND traceId in (${inList(traces)}))`] : []),
      ...(spans.length > 0 ? [`NOT spanId in (${inList(spans)})`] : []),
    ];
    return { clause: parts.map((p) => ` AND ${p}`).join(''), capped };
  } catch {
    // Count without the exclusion, and say so.
    return { clause: '', capped: true };
  }
};
