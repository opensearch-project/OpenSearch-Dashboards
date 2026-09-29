/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { AGENT_TRACES_SESSION_ID_FIELD } from '../../../../../common';
import { RootState } from '../../../utils/state_management/store';
import { usePPLQueryDeps, useTimeVersion } from '../../traces/hooks/use_ppl_query_deps';
import { splitPplWhereAndTail } from '../../traces/table_shared';
import { transformPPLDataToTraceHits } from '../../traces/trace_details/traces/ppl_to_trace_hits';
import { hitsToAgentSpans, spanToRow } from '../../traces/hooks/tree_utils';
import {
  SessionRow,
  assembleSessionRows,
  buildRootSpansQuery,
  buildMatchingSessionIdsQuery,
  buildSessionStatsQuery,
  buildTraceSessionMapQuery,
  getSourceCommand,
  parseSessionStats,
  pplResponseToRecords,
} from '../session_utils';

export interface UseSessionsResult {
  sessions: SessionRow[];
  loading: boolean;
  error: string | null;
  elapsedMs: number | null;
  refresh: () => void;
}

/**
 * Fetch the sessions list for the current query and time range.
 *
 * 1. Session ids matching the user's query (the filter selects sessions).
 * 2. Unfiltered stats for those sessions (trace count, start/end).
 * 3. Trace map: which traces belong to each session (any span may carry the id).
 * 4. Root spans of those traces: first/last message, tokens, user id.
 */
export const useSessions = (formatTs: (ts: string) => string): UseSessionsResult => {
  const { services, pplService, datasetParam, baseQueryString } = usePPLQueryDeps();
  const fetchVersion = useSelector((state: RootState) => state.queryEditor.fetchVersion);
  const timeVersion = useTimeVersion(services);

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const requestIdRef = useRef(0);

  const fetchSessions = useCallback(async () => {
    if (!pplService || !datasetParam || !baseQueryString) return;
    const requestId = ++requestIdRef.current;
    const started = Date.now();
    setLoading(true);
    setError(null);

    try {
      const { whereQuery } = splitPplWhereAndTail(baseQueryString);
      const source = getSourceCommand(whereQuery);

      // 1. Sessions matching the user's query; 2. their full stats (not narrowed by the filter).
      const idsResponse = await pplService.executeQuery(
        datasetParam,
        buildMatchingSessionIdsQuery(whereQuery)
      );
      const sessionIds = pplResponseToRecords(idsResponse)
        .map((r) => r[AGENT_TRACES_SESSION_ID_FIELD])
        .filter((id): id is string => typeof id === 'string' && id !== '');

      let stats: ReturnType<typeof parseSessionStats> = [];
      if (sessionIds.length > 0) {
        const statsResponse = await pplService.executeQuery(
          datasetParam,
          buildSessionStatsQuery(source, sessionIds)
        );
        stats = parseSessionStats(pplResponseToRecords(statsResponse));
      }

      let rows: SessionRow[] = [];
      if (stats.length > 0) {
        const mapResponse = await pplService.executeQuery(
          datasetParam,
          buildTraceSessionMapQuery(
            source,
            stats.map((s) => s.sessionId)
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
          const rootsResponse = await pplService.executeQuery(
            datasetParam,
            buildRootSpansQuery(source, traceIds)
          );
          rootRows = hitsToAgentSpans(transformPPLDataToTraceHits(rootsResponse)).map((span, i) =>
            spanToRow(span, i, formatTs)
          );
        }
        rows = assembleSessionRows(stats, traceToSession, rootRows);
      }

      if (requestId !== requestIdRef.current) return; // a newer request superseded this one
      setSessions(rows);
      setElapsedMs(Date.now() - started);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      // eslint-disable-next-line no-console
      console.error('Failed to fetch sessions:', err);
      setError((err as Error).message || 'Failed to fetch sessions');
      setSessions([]);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [pplService, datasetParam, baseQueryString, formatTs]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions, refreshCounter, timeVersion, fetchVersion]);

  const refresh = useCallback(() => setRefreshCounter((c) => c + 1), []);

  return { sessions, loading, error, elapsedMs, refresh };
};
