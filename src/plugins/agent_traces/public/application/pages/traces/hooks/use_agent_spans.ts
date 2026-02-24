/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState, useRef, useEffect } from 'react';
import moment from 'moment';
import { useSelector } from 'react-redux';
import { RootState } from '../../../utils/state_management/store';
import { transformPPLDataToTraceHits } from '../trace_details/traces/ppl_to_trace_hits';
import { useIsTabActive } from '../../../../components/tabs/tabs';
import { usePPLQueryDeps, useTimeVersion } from './use_ppl_query_deps';
import { BaseRow, spanToRow, buildFullSpanTree, hitsToAgentSpans } from './tree_utils';

export interface SpanRow extends BaseRow {
  children?: SpanRow[];
}

export interface SpanLoadingState {
  loading: boolean;
  error: string | null;
}

export interface UseAgentSpansResult {
  spans: SpanRow[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  expandSpan: (traceId: string) => Promise<void>;
  spanSpansCache: Map<string, SpanRow[]>;
  spanLoadingState: Map<string, SpanLoadingState>;
}

const formatTimestamp = (timestamp: string): string => {
  if (!timestamp) return '—';
  const m = moment(timestamp);
  if (!m.isValid()) return '—';
  return m.format('MM/DD/YYYY, h:mm:ss.SSS A');
};

export const useAgentSpans = (
  pageIndex: number = 0,
  pageSize: number = 50
): UseAgentSpansResult => {
  const { services, pplService, datasetParam, baseQueryString } = usePPLQueryDeps();
  const fetchVersion = useSelector((state: RootState) => state.queryEditor.fetchVersion);
  const isTabActive = useIsTabActive();
  const timeVersion = useTimeVersion(services);

  // Ref-based tab visibility check: avoids re-fetching on simple tab switches
  // while still deferring fetch if query params change while hidden.
  const isTabActiveRef = useRef(isTabActive);
  const skippedFetchRef = useRef(false);

  const [spans, setSpans] = useState<SpanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const [spanSpansCache, setSpanSpansCache] = useState<Map<string, SpanRow[]>>(new Map());
  const [spanLoadingState, setSpanLoadingState] = useState<Map<string, SpanLoadingState>>(
    new Map()
  );
  const inFlightRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    isTabActiveRef.current = isTabActive;
    if (isTabActive && skippedFetchRef.current) {
      skippedFetchRef.current = false;
      setRefreshCounter((c) => c + 1);
    }
  }, [isTabActive]);

  // Reset to first page when current page is beyond available results
  useEffect(() => {
    if (!loading && spans.length === 0 && pageIndex > 0) {
      setSpans([]);
    }
  }, [loading, spans.length, pageIndex]);

  useEffect(() => {
    if (!isTabActiveRef.current) {
      skippedFetchRef.current = true;
      return;
    }

    if (!pplService || !datasetParam || !baseQueryString) {
      setLoading(false);
      return;
    }

    skippedFetchRef.current = false;
    let cancelled = false;
    const fetchSpans = async () => {
      setLoading(true);
      setError(null);

      try {
        const offset = pageIndex * pageSize;
        const pplQuery = `${baseQueryString} | where isnotnull(\`attributes.gen_ai.operation.name\`) | sort - startTime | head ${pageSize} from ${offset}`;
        const response = await pplService.executeQuery(datasetParam, pplQuery);

        if (cancelled) return;

        const agentSpans = hitsToAgentSpans(transformPPLDataToTraceHits(response));
        const rows = agentSpans.map(
          (span, index) => spanToRow(span, index, formatTimestamp) as SpanRow
        );
        setSpans(rows);
      } catch (err) {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.error('Failed to fetch paginated spans:', err);
        setError((err as Error).message || 'Failed to fetch spans');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchSpans();
    return () => {
      cancelled = true;
    };
  }, [
    pplService,
    datasetParam,
    baseQueryString,
    pageIndex,
    pageSize,
    refreshCounter,
    timeVersion,
    fetchVersion,
  ]);

  const refresh = useCallback(() => {
    setSpanSpansCache(new Map());
    setSpanLoadingState(new Map());
    inFlightRef.current.clear();
    setRefreshCounter((c) => c + 1);
  }, []);

  const expandSpan = useCallback(
    async (traceId: string) => {
      if (spanSpansCache.has(traceId)) return;
      if (inFlightRef.current.has(traceId)) return;
      if (!pplService || !datasetParam) return;

      inFlightRef.current.add(traceId);
      setSpanLoadingState((prev) => {
        const next = new Map(prev);
        next.set(traceId, { loading: true, error: null });
        return next;
      });

      try {
        const response = await pplService.fetchTraceSpans({
          traceId,
          dataset: datasetParam,
          limit: 1000,
        });

        const agentSpans = hitsToAgentSpans(transformPPLDataToTraceHits(response));
        const fullTree = buildFullSpanTree<SpanRow>(agentSpans, formatTimestamp);

        setSpanSpansCache((prev) => {
          const next = new Map(prev);
          next.set(traceId, fullTree);
          return next;
        });
        setSpanLoadingState((prev) => {
          const next = new Map(prev);
          next.set(traceId, { loading: false, error: null });
          return next;
        });
      } catch (err) {
        setSpanLoadingState((prev) => {
          const next = new Map(prev);
          next.set(traceId, {
            loading: false,
            error: (err as Error).message || 'Failed to fetch span spans',
          });
          return next;
        });
      } finally {
        inFlightRef.current.delete(traceId);
      }
    },
    [pplService, datasetParam, spanSpansCache]
  );

  return {
    spans,
    loading,
    error,
    refresh,
    expandSpan,
    spanSpansCache,
    spanLoadingState,
  };
};
