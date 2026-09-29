/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment-timezone';
import { AGENT_TRACES_SESSION_ID_FIELD } from '../../../../common';
import { escapePPLValue } from '../traces/trace_details/data_fetching/ppl_request_helpers';
import { BaseRow } from '../traces/hooks/tree_utils';
import { Bucket } from '../../../components/fields_selector/types';
import { previewInputMessages, previewOutputMessages } from '../traces/hooks/genai_message_preview';

/** Backtick-quoted session id field for use in PPL. */
export const SESSION_FIELD_PPL = `\`${AGENT_TRACES_SESSION_ID_FIELD}\``;

/** Max sessions listed in the Sessions tab. */
export const SESSIONS_PAGE_LIMIT = 100;

/** Max traces fetched for the root-span lookup behind the sessions list. */
export const SESSION_ROOTS_LIMIT = 2000;

/** Max spans fetched when opening a single session. */
export const SESSION_SPANS_LIMIT = 5000;

export interface SessionRow {
  sessionId: string;
  /** Raw PPL timestamp of the earliest span in the session. */
  startTime: string;
  /** Raw PPL timestamp of the latest span end in the session. */
  endTime: string;
  durationMs: number;
  totalTraces: number;
  totalTokens: number | null;
  firstMessage: string;
  lastMessage: string;
  userId: string | null;
  /** Trace ids in the session, ordered earliest first. */
  traceIds: string[];
}

/** Session-level summary computed from the stats query. */
interface SessionStats {
  sessionId: string;
  startTime: string;
  endTime: string;
  totalTraces: number;
}

/**
 * Convert a PPL response (JDBC `datarows` or `data_frame` fields format) to an
 * array of records keyed by column name.
 */
export const pplResponseToRecords = (response: any): Array<Record<string, any>> => {
  if (response?.datarows && response?.schema) {
    const schema = response.schema as Array<{ name: string }>;
    return (response.datarows as any[][]).map((row) => {
      const record: Record<string, any> = {};
      schema.forEach((col, idx) => {
        record[col.name] = row[idx];
      });
      return record;
    });
  }

  const data = response?.type === 'data_frame' && response?.body ? response.body : response;
  if (data?.fields && data?.size > 0) {
    const records: Array<Record<string, any>> = [];
    for (let i = 0; i < data.size; i++) {
      const record: Record<string, any> = {};
      data.fields.forEach((field: { name: string; values: any[] }) => {
        record[field.name] = field.values?.[i];
      });
      records.push(record);
    }
    return records;
  }

  return [];
};

const inList = (values: string[]): string => values.map((v) => escapePPLValue(v)).join(', ');

/**
 * Session ids matching the user's query (source + where clauses), most recent first.
 * The user's filter selects which sessions are listed; their stats are computed unfiltered.
 */
export const buildMatchingSessionIdsQuery = (
  whereQuery: string,
  limit = SESSIONS_PAGE_LIMIT
): string =>
  `${whereQuery} | where isnotnull(${SESSION_FIELD_PPL}) | stats max(endTime) as last_seen by ${SESSION_FIELD_PPL} | sort - last_seen | head ${limit}`;

/** Fields shown as facets on the Sessions tab. */
export const SESSION_FACET_FIELDS = ['serviceName', 'attributes.gen_ai.agent.name', 'status.code'];
export const SESSION_FACET_LIMIT = 10;

/**
 * Sessions per value of a facet field, under the user's query. A session counts toward a
 * value when any of its spans has it, matching how filter-for narrows the session list.
 */
export const buildSessionFacetQuery = (
  whereQuery: string,
  field: string,
  limit = SESSION_FACET_LIMIT
): string =>
  `${whereQuery} | where isnotnull(${SESSION_FIELD_PPL}) and isnotnull(\`${field}\`) | stats distinct_count(${SESSION_FIELD_PPL}) as sessions by \`${field}\` | sort - sessions | head ${limit}`;

/** Convert facet stats records into fields-panel buckets. */
export const parseFacetBuckets = (records: Array<Record<string, any>>, field: string): Bucket[] => {
  const rows = records
    .map((r) => ({ value: r[field], count: Number(r.sessions ?? 0) }))
    .filter((r) => r.value !== null && r.value !== undefined && r.count > 0);
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  return rows.map((r) => ({
    value: String(r.value),
    display: String(r.value),
    count: r.count,
    percent: total ? (r.count / total) * 100 : 0,
  }));
};

/** Full (unfiltered) stats for the given sessions: trace count and time bounds. */
export const buildSessionStatsQuery = (source: string, sessionIds: string[]): string =>
  `${source} | where ${SESSION_FIELD_PPL} in (${inList(
    sessionIds
  )}) | stats distinct_count(traceId) as total_traces, min(startTime) as start_time, max(endTime) as end_time by ${SESSION_FIELD_PPL} | sort - start_time`;

/** Maps each trace id to its session id. Any span in a trace may carry the session id. */
export const buildTraceSessionMapQuery = (source: string, sessionIds: string[]): string =>
  `${source} | where ${SESSION_FIELD_PPL} in (${inList(
    sessionIds
  )}) | dedup traceId | fields traceId, ${SESSION_FIELD_PPL} | head ${SESSION_ROOTS_LIMIT}`;

/** Root spans of the given traces (they carry per-trace input, output and token totals). */
export const buildRootSpansQuery = (source: string, traceIds: string[]): string =>
  `${source} | where parentSpanId = "" and traceId in (${inList(
    traceIds
  )}) | sort startTime | head ${SESSION_ROOTS_LIMIT}`;

/** Every span in the given traces, for the session detail flyout. */
export const buildSessionSpansQuery = (
  source: string,
  traceIds: string[],
  limit = SESSION_SPANS_LIMIT
): string => `${source} | where traceId in (${inList(traceIds)}) | head ${limit}`;

/** Extract the `source = ...` command from a PPL query string. */
export const getSourceCommand = (query: string): string => {
  const firstPipe = query.indexOf('|');
  return (firstPipe === -1 ? query : query.slice(0, firstPipe)).trim();
};

const toMs = (ts: string): number => {
  const m = moment.utc(ts);
  return m.isValid() ? m.valueOf() : NaN;
};

export const parseSessionStats = (records: Array<Record<string, any>>): SessionStats[] =>
  records
    .map((r) => ({
      sessionId: String(r[AGENT_TRACES_SESSION_ID_FIELD] ?? ''),
      startTime: String(r.start_time ?? ''),
      endTime: String(r.end_time ?? ''),
      totalTraces: Number(r.total_traces ?? 0),
    }))
    .filter((s) => s.sessionId !== '');

/** Read a span attribute that may be stored as a flat dotted key or a nested object. */
export const getSpanAttribute = (doc: Record<string, any> | undefined, key: string): unknown => {
  if (!doc) return undefined;
  const attrs = doc.attributes;
  if (attrs && typeof attrs === 'object') {
    if (key in attrs) return attrs[key];
    let cur: any = attrs;
    for (const part of key.split('.')) {
      if (cur === null || cur === undefined || typeof cur !== 'object') return undefined;
      cur = cur[part];
    }
    if (cur !== undefined) return cur;
  }
  return doc[`attributes.${key}`];
};

const rowTokens = (row: BaseRow): number | null =>
  typeof row.totalTokens === 'number' ? row.totalTokens : null;

/**
 * Assemble session rows from the stats query, the trace to session map, and root span rows.
 * First/last message come from the earliest/latest trace that has text; tokens are the sum of
 * per-trace root-span totals (matching the Traces tab).
 */
export const assembleSessionRows = (
  stats: SessionStats[],
  traceToSession: Map<string, string>,
  rootRows: BaseRow[]
): SessionRow[] => {
  const rootsBySession = new Map<string, BaseRow[]>();
  for (const row of rootRows) {
    const sessionId = traceToSession.get(row.traceId);
    if (!sessionId) continue;
    const list = rootsBySession.get(sessionId) ?? [];
    list.push(row);
    rootsBySession.set(sessionId, list);
  }

  return stats.map((s) => {
    const roots = (rootsBySession.get(s.sessionId) ?? []).sort(
      (a, b) => toMs(rawStart(a)) - toMs(rawStart(b))
    );
    const withInput = roots.filter((r) => previewInputMessages(r.input) !== '');
    const withOutput = roots.filter((r) => previewOutputMessages(r.output) !== '');
    const tokenValues = roots.map(rowTokens).filter((t): t is number => t !== null);
    const userRoot = roots.find((r) => getSpanAttribute(r.rawDocument, 'user.id') != null);
    const start = toMs(s.startTime);
    const end = toMs(s.endTime);

    return {
      sessionId: s.sessionId,
      startTime: s.startTime,
      endTime: s.endTime,
      durationMs: Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, end - start) : 0,
      totalTraces: s.totalTraces,
      totalTokens: tokenValues.length ? tokenValues.reduce((a, b) => a + b, 0) : null,
      firstMessage: withInput.length ? previewInputMessages(withInput[0].input) : '',
      lastMessage: withOutput.length
        ? previewOutputMessages(withOutput[withOutput.length - 1].output)
        : '',
      userId: userRoot ? String(getSpanAttribute(userRoot.rawDocument, 'user.id')) : null,
      traceIds: roots.map((r) => r.traceId),
    };
  });
};

/** Raw (unformatted) start time from a row's source document. */
export const rawStart = (row: BaseRow): string =>
  String((row.rawDocument as Record<string, any> | undefined)?.startTime ?? '');

/** Session duration in the mock's `2h:48m` style; short sessions use `42m:05s` or `3.2s`. */
export const formatSessionDuration = (ms: number): string => {
  if (!ms || ms <= 0) return '—';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h:${String(minutes).padStart(2, '0')}m`;
  if (minutes > 0) return `${minutes}m:${String(seconds).padStart(2, '0')}s`;
  return `${(ms / 1000).toFixed(1)}s`;
};

/** Shorten a long id as `abcd1234...wxyz` for headers. */
export const shortenId = (id: string, head = 8, tail = 4): string => {
  if (id.length <= head + tail + 3) return id;
  // slice(-0) would return the whole string, so handle tail === 0 explicitly
  return `${id.slice(0, head)}...${tail > 0 ? id.slice(-tail) : ''}`;
};
