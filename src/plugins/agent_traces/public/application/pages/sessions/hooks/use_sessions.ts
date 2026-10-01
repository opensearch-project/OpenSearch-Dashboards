/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../utils/state_management/store';
import { addPPLSourceClause } from '../../../utils/languages/ppl';
import { usePPLQueryDeps, useTimeVersion } from '../../traces/hooks/use_ppl_query_deps';
import { SessionRow } from '../session_utils';
import {
  fetchSessionFacets,
  fetchSessions as fetchSessionRows,
  sessionFilterFor,
} from '../fetch_sessions';
import { sessionFacetBuckets$ } from '../session_facets';

export interface UseSessionsResult {
  sessions: SessionRow[];
  loading: boolean;
  error: string | null;
  elapsedMs: number | null;
  refresh: () => void;
  /** Commands in the user's query that the Sessions view does not apply (stats, head, ...). */
  ignoredCommands: string[];
  /** Whether the user's query filters spans (so an empty list means "no match"). */
  hasFilter: boolean;
  /** Sessions matching the query and time range; the list shows at most SESSIONS_PAGE_LIMIT. */
  totalSessions: number | null;
  /** Per-session details come from a subset of traces (see FetchSessionsResult.partial). */
  partial: boolean;
}

/** Sessions list for the current query and time range (see `fetchSessions`). */
export const useSessions = (formatTs: (ts: string) => string): UseSessionsResult => {
  const { services, pplService, datasetParam, baseQueryString } = usePPLQueryDeps();
  const query = useSelector((state: RootState) => state.query);
  // The base query has `stats ...` already stripped (for the data tabs); the notice reads
  // the user's full query so it can name stats and anything after it too.
  const fullQueryString = useMemo(() => {
    try {
      return addPPLSourceClause(query).query;
    } catch {
      return null;
    }
  }, [query]);
  const fetchVersion = useSelector((state: RootState) => state.queryEditor.fetchVersion);
  const timeVersion = useTimeVersion(services);

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [ignoredCommands, setIgnoredCommands] = useState<string[]>([]);
  const [hasFilter, setHasFilter] = useState(false);
  const [totalSessions, setTotalSessions] = useState<number | null>(null);
  const [partial, setPartial] = useState(false);
  const requestIdRef = useRef(0);

  const fetchSessions = useCallback(async () => {
    if (!pplService || !datasetParam || !baseQueryString) return;
    const requestId = ++requestIdRef.current;
    const started = Date.now();
    setLoading(true);
    setError(null);

    try {
      const { whereQuery, hasFilter: filtered } = sessionFilterFor(baseQueryString);
      setIgnoredCommands(sessionFilterFor(fullQueryString ?? baseQueryString).ignoredCommands);
      setHasFilter(filtered);

      // Fields panel facets, counted per session (runs alongside the list queries).
      sessionFacetBuckets$.next(null);
      void fetchSessionFacets(pplService, datasetParam, whereQuery).then((buckets) => {
        if (requestId === requestIdRef.current) sessionFacetBuckets$.next(buckets);
      });

      const result = await fetchSessionRows(pplService, datasetParam, baseQueryString, formatTs);
      if (requestId !== requestIdRef.current) return; // a newer request superseded this one
      setSessions(result.sessions);
      setTotalSessions(result.totalSessions);
      setPartial(result.partial);
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
  }, [pplService, datasetParam, baseQueryString, fullQueryString, formatTs]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions, refreshCounter, timeVersion, fetchVersion]);

  // Drop session facets when the tab unmounts so they never outlive the Sessions view.
  useEffect(() => () => sessionFacetBuckets$.next(null), []);

  const refresh = useCallback(() => setRefreshCounter((c) => c + 1), []);

  return {
    sessions,
    loading,
    error,
    elapsedMs,
    refresh,
    ignoredCommands,
    hasFilter,
    totalSessions,
    partial,
  };
};
