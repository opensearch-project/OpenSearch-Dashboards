/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { PPLService } from '../trace_details/data_fetching/ppl_request_helpers';
import { Dataset } from '../../../../../../data/common';
import { usePPLQueryDeps, useTimeVersion } from './use_ppl_query_deps';
import { RootState } from '../../../utils/state_management/store';
import { splitPplWhereAndTail } from '../table_shared';

export interface TraceMetrics {
  totalTraces: number;
  totalSpans: number;
  filteredTraces: number;
  filteredSpans: number;
  totalTokens: number;
  latencyP50Nanos: number;
  latencyP99Nanos: number;
  errorTraces: number;
  errorSpans: number;
}

export interface UseTraceMetricsResult {
  metrics: TraceMetrics | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// Parse a PPL stats response (JDBC datarows or data_frame fields format)
const parseStatsResponse = (response: any): Record<string, any> => {
  // JDBC datarows format: { schema: [{name, type}], datarows: [[values]] }
  if (response?.datarows && response?.schema) {
    const schema = response.schema as Array<{ name: string }>;
    const row = response.datarows[0];
    if (!row) return {};
    const result: Record<string, any> = {};
    schema.forEach((col, idx) => {
      result[col.name] = row[idx];
    });
    return result;
  }

  // data_frame fields format: { body: { fields: [{name, values}], size } }
  const responseData = response?.type === 'data_frame' && response?.body ? response.body : response;
  if (responseData?.fields && responseData?.size > 0) {
    const result: Record<string, any> = {};
    responseData.fields.forEach((field: { name: string; values: any[] }) => {
      result[field.name] = field.values?.[0];
    });
    return result;
  }

  return {};
};

// Module-level deduplication: when multiple hook instances request the same metrics
// concurrently, reuse the in-flight promise instead of firing duplicate PPL queries.
let pendingMetrics: { key: string; promise: Promise<TraceMetrics> } | null = null;

const doFetchMetrics = async (
  pplService: PPLService,
  datasetParam: Dataset,
  sourceOnlyQuery: string,
  filteredQuery: string
): Promise<TraceMetrics> => {
  const genAiFilter = `where isnotnull(\`attributes.gen_ai.operation.name\`)`;
  const { whereQuery } = splitPplWhereAndTail(filteredQuery);

  // Run all queries in parallel
  // Note: User non-where commands (head, sort, etc.) are intentionally excluded from stats queries.
  // When a user types `| head 10`, it limits the data display but should not affect aggregate counts
  // or statistics. The UI hides the "of X total" text when head is detected (see queryEndsWithHead).
  const [countStats, filteredStats, filteredCounts] = await Promise.all([
    // Query A — Counts (source-only, no user filter):
    // Total Traces, Total Spans, and their error counts are unaffected by user query filters
    (async () => {
      const countsQuery = `${sourceOnlyQuery} | ${genAiFilter} | stats count() as total_spans, sum(case(parentSpanId = "", 1 else 0)) as total_traces, sum(case(\`status.code\` = 2, 1 else 0)) as error_spans, sum(case(\`status.code\` = 2 AND parentSpanId = "", 1 else 0)) as error_traces`;
      const countsResponse = await pplService.executeQuery(datasetParam, countsQuery);
      return parseStatsResponse(countsResponse);
    })(),
    // Query B — Filtered stats (with user query where clauses only):
    // Tokens and Latency respect user query where filters
    (async () => {
      const rootFilter = `where parentSpanId = "" AND isnotnull(\`attributes.gen_ai.operation.name\`)`;
      const statsQuery = `${whereQuery} | ${rootFilter} | stats percentile(durationInNanos, 50) as p50_latency, percentile(durationInNanos, 99) as p99_latency, sum(\`attributes.gen_ai.usage.input_tokens\`) as input_tokens, sum(\`attributes.gen_ai.usage.output_tokens\`) as output_tokens`;
      const statsResponse = await pplService.executeQuery(datasetParam, statsQuery);
      return parseStatsResponse(statsResponse);
    })(),
    // Query C — Filtered counts (with user query where clauses only):
    // Total traces/spans matching the user's current query, shown in the info bar
    (async () => {
      const query = `${whereQuery} | ${genAiFilter} | stats count() as filtered_spans, sum(case(parentSpanId = "", 1 else 0)) as filtered_traces`;
      const response = await pplService.executeQuery(datasetParam, query);
      return parseStatsResponse(response);
    })(),
  ]);

  return {
    totalTraces: countStats.total_traces ?? 0,
    totalSpans: countStats.total_spans ?? 0,
    filteredTraces: filteredCounts.filtered_traces ?? 0,
    filteredSpans: filteredCounts.filtered_spans ?? 0,
    totalTokens: (filteredStats.input_tokens ?? 0) + (filteredStats.output_tokens ?? 0),
    latencyP50Nanos: filteredStats.p50_latency ?? 0,
    latencyP99Nanos: filteredStats.p99_latency ?? 0,
    errorTraces: countStats.error_traces ?? 0,
    errorSpans: countStats.error_spans ?? 0,
  };
};

export const useTraceMetrics = (tracesLoaded: boolean): UseTraceMetricsResult => {
  const { services, datasetParam, baseQueryString, sourceOnlyQueryString } = usePPLQueryDeps();
  const fetchVersion = useSelector((state: RootState) => state.queryEditor.fetchVersion);
  const timeVersion = useTimeVersion(services);

  const [metrics, setMetrics] = useState<TraceMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const pplService = useMemo(() => (services.data ? new PPLService(services.data) : undefined), [
    services.data,
  ]);

  const fetchMetrics = useCallback(async () => {
    if (!pplService || !datasetParam || !tracesLoaded || !baseQueryString || !sourceOnlyQueryString)
      return;

    setLoading(true);
    setError(null);

    try {
      const cacheKey = `${sourceOnlyQueryString}|${baseQueryString}`;
      let result: TraceMetrics;

      if (pendingMetrics && pendingMetrics.key === cacheKey) {
        // Reuse in-flight request from another hook instance
        result = await pendingMetrics.promise;
      } else {
        // Start new request
        const promise = doFetchMetrics(
          pplService,
          datasetParam,
          sourceOnlyQueryString,
          baseQueryString
        );
        pendingMetrics = { key: cacheKey, promise };
        try {
          result = await promise;
        } finally {
          // Clear only if this is still the active request
          if (pendingMetrics?.promise === promise) {
            pendingMetrics = null;
          }
        }
      }

      setMetrics(result);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch trace metrics:', err);
      setError((err as Error).message || 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  }, [pplService, datasetParam, baseQueryString, sourceOnlyQueryString, tracesLoaded]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics, refreshCounter, timeVersion, fetchVersion]);

  const refresh = useCallback(() => {
    pendingMetrics = null;
    setRefreshCounter((c) => c + 1);
  }, []);

  return { metrics, loading, error, refresh };
};

/**
 * Context for sharing a single useTraceMetrics result across multiple consumers.
 * This avoids duplicate PPL queries when several components need metrics data.
 */
const defaultMetricsResult: UseTraceMetricsResult = {
  metrics: null,
  loading: false,
  error: null,
  refresh: () => {},
};

export const TraceMetricsContext = createContext<UseTraceMetricsResult>(defaultMetricsResult);

/** Consume metrics from the nearest TraceMetricsContext.Provider. */
export const useTraceMetricsContext = (): UseTraceMetricsResult => useContext(TraceMetricsContext);
