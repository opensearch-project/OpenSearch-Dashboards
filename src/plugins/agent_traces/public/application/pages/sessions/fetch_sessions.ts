/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AGENT_TRACES_SESSION_ID_FIELD } from '../../../../common';
import { Dataset } from '../../../../../data/common';
import { extractSpanFilterQuery, splitPplCommands } from '../traces/table_shared';
import {
  PPLResponse,
  transformPPLDataToTraceHits,
} from '../traces/trace_details/traces/ppl_to_trace_hits';
import { hitsToAgentSpans, spanToRow } from '../traces/hooks/tree_utils';
import { Bucket } from '../../../components/fields_selector/types';
import {
  SessionRow,
  assembleSessionRows,
  buildRootSpansQuery,
  buildMatchingSessionIdsQuery,
  buildMatchingSessionCountQuery,
  withoutTimeRange,
  buildSessionStatsQuery,
  buildTraceSessionMapQuery,
  buildSessionFacetQuery,
  parseFacetBuckets,
  SESSION_FACET_FIELDS,
  SESSION_TRACES_LIMIT,
  getSourceCommand,
  parseSessionStats,
  pplResponseToRecords,
} from './session_utils';

/** Anything that can run a PPL query against a dataset (PPLService in the app and embeddable). */
export interface PPLQueryRunner {
  executeQuery(dataset: Dataset, pplQuery: string): Promise<unknown>;
}

export interface FetchSessionsResult {
  sessions: SessionRow[];
  /** Sessions matching the query and time range; `sessions` holds at most the page limit. */
  totalSessions: number | null;
  /** Commands in the query the Sessions view does not apply (stats, head, ...). */
  ignoredCommands: string[];
  /** Whether the query filters spans (so an empty list means "no match"). */
  hasFilter: boolean;
  /**
   * The listed sessions hold more traces than `maxTraces`: per-session details (first and
   * last message, tokens, trace list) come from a subset of their traces.
   */
  partial: boolean;
}

export interface FetchSessionsOptions {
  /** Max traces looked up across the listed sessions. */
  maxTraces?: number;
}

/** The span-level filter a Sessions query applies, plus what it leaves out. */
export const sessionFilterFor = (baseQueryString: string) => {
  const { filterQuery, ignoredCommands } = extractSpanFilterQuery(baseQueryString);
  return {
    whereQuery: filterQuery,
    ignoredCommands,
    hasFilter: splitPplCommands(filterQuery).length > 1,
  };
};

/** Session-level facet values for the fields panel (distinct sessions per value). */
export const fetchSessionFacets = async (
  ppl: PPLQueryRunner,
  dataset: Dataset,
  whereQuery: string
): Promise<Record<string, Bucket[]>> => {
  const entries = await Promise.all(
    SESSION_FACET_FIELDS.map(async (field) => {
      try {
        const response = await ppl.executeQuery(dataset, buildSessionFacetQuery(whereQuery, field));
        return [field, parseFacetBuckets(pplResponseToRecords(response), field)] as const;
      } catch {
        return [field, [] as Bucket[]] as const; // e.g. the field is not mapped in this index
      }
    })
  );
  return Object.fromEntries(entries);
};

/**
 * Fetch the sessions list for a query. Shared by the Sessions tab and the dashboard panel.
 *
 * 1. Session ids matching the query and time range (the filter selects sessions), plus a count.
 * 2. Stats for those sessions (trace count, start/end), over the whole session.
 * 3. Trace map: which traces belong to each session (any span may carry the id).
 * 4. Root spans of those traces: first/last message, tokens, user id.
 */
export const fetchSessions = async (
  ppl: PPLQueryRunner,
  dataset: Dataset,
  baseQueryString: string,
  formatTs: (ts: string) => string,
  { maxTraces = SESSION_TRACES_LIMIT }: FetchSessionsOptions = {}
): Promise<FetchSessionsResult> => {
  const { whereQuery, ignoredCommands, hasFilter } = sessionFilterFor(baseQueryString);
  const source = getSourceCommand(whereQuery);

  const [idsResponse, countResponse] = await Promise.all([
    ppl.executeQuery(dataset, buildMatchingSessionIdsQuery(whereQuery)),
    ppl.executeQuery(dataset, buildMatchingSessionCountQuery(whereQuery)).catch(() => null),
  ]);
  const total = countResponse
    ? Number(pplResponseToRecords(countResponse)[0]?.total_sessions)
    : NaN;
  const wholeSession = withoutTimeRange(dataset);
  const sessionIds = pplResponseToRecords(idsResponse)
    .map((r) => r[AGENT_TRACES_SESSION_ID_FIELD])
    .filter((id): id is string => typeof id === 'string' && id !== '');

  let stats: ReturnType<typeof parseSessionStats> = [];
  if (sessionIds.length > 0) {
    const statsResponse = await ppl.executeQuery(
      wholeSession,
      buildSessionStatsQuery(source, sessionIds)
    );
    stats = parseSessionStats(pplResponseToRecords(statsResponse));
  }

  let sessions: SessionRow[] = [];
  // Size the trace map from the sessions' own trace counts (plus one row of slack per
  // session for traces that carry more than one session id), capped at maxTraces.
  const tracesInSessions = stats.reduce((sum, s) => sum + s.totalTraces, 0);
  const partial = tracesInSessions > maxTraces;
  if (stats.length > 0) {
    const mapResponse = await ppl.executeQuery(
      wholeSession,
      buildTraceSessionMapQuery(
        source,
        stats.map((s) => s.sessionId),
        Math.min(tracesInSessions + stats.length, maxTraces)
      )
    );
    const traceToSession = new Map<string, string>();
    for (const rec of pplResponseToRecords(mapResponse)) {
      const traceId = rec.traceId;
      const sessionId = rec[AGENT_TRACES_SESSION_ID_FIELD];
      if (traceId && sessionId) traceToSession.set(String(traceId), String(sessionId));
    }

    const traceIds = [...traceToSession.keys()];
    let rootRows: Array<ReturnType<typeof spanToRow>> = [];
    if (traceIds.length > 0) {
      const rootsResponse = await ppl.executeQuery(
        wholeSession,
        buildRootSpansQuery(source, traceIds)
      );
      // The root-span query returns span rows in the PPL response shape.
      const rootHits = transformPPLDataToTraceHits(rootsResponse as PPLResponse);
      rootRows = hitsToAgentSpans(rootHits).map((span, i) => spanToRow(span, i, formatTs));
    }
    sessions = assembleSessionRows(stats, traceToSession, rootRows);
  }

  return {
    sessions,
    totalSessions: Number.isFinite(total) ? Math.max(total, sessions.length) : null,
    ignoredCommands,
    hasFilter,
    partial,
  };
};
