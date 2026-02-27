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

export interface TraceMetrics {
  totalTraces: number;
  totalSpans: number;
  totalTokens: number;
  latencyP50Nanos: number;
  latencyP99Nanos: number;
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
  baseQueryString: string
): Promise<TraceMetrics> => {
  const rootFilter = `where parentSpanId = "" AND isnotnull(\`attributes.gen_ai.operation.name\`)`;
  const rootQueryBase = `${baseQueryString} | ${rootFilter}`;

  // Run both queries in parallel
  const [traceStats, spanStats] = await Promise.all([
    // Query 1: Combined trace stats + token stats on root gen_ai traces
    (async () => {
      try {
        const combinedQuery = `${rootQueryBase} | stats count() as total_traces, percentile(durationInNanos, 50) as p50_latency, percentile(durationInNanos, 99) as p99_latency, sum(\`attributes.gen_ai.usage.input_tokens\`) as input_tokens, sum(\`attributes.gen_ai.usage.output_tokens\`) as output_tokens`;
        const combinedResponse = await pplService.executeQuery(datasetParam, combinedQuery);
        return parseStatsResponse(combinedResponse);
      } catch {
        // Token fields may not exist — retry without them
        const traceOnlyQuery = `${rootQueryBase} | stats count() as total_traces, percentile(durationInNanos, 50) as p50_latency, percentile(durationInNanos, 99) as p99_latency`;
        const traceOnlyResponse = await pplService.executeQuery(datasetParam, traceOnlyQuery);
        return parseStatsResponse(traceOnlyResponse);
      }
    })(),
    // Query 2: Count agent spans (those with gen_ai.operation.name)
    (async () => {
      const agentSpanFilter = `where isnotnull(\`attributes.gen_ai.operation.name\`)`;
      const totalSpansQuery = `${baseQueryString} | ${agentSpanFilter} | stats count() as total_spans`;
      const totalSpansResponse = await pplService.executeQuery(datasetParam, totalSpansQuery);
      return parseStatsResponse(totalSpansResponse);
    })(),
  ]);

  return {
    totalTraces: traceStats.total_traces ?? 0,
    totalSpans: spanStats.total_spans ?? 0,
    totalTokens: (traceStats.input_tokens ?? 0) + (traceStats.output_tokens ?? 0),
    latencyP50Nanos: traceStats.p50_latency ?? 0,
    latencyP99Nanos: traceStats.p99_latency ?? 0,
  };
};

export const useTraceMetrics = (tracesLoaded: boolean): UseTraceMetricsResult => {
  const { services, datasetParam, baseQueryString } = usePPLQueryDeps();
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
    if (!pplService || !datasetParam || !tracesLoaded || !baseQueryString) return;

    setLoading(true);
    setError(null);

    try {
      const cacheKey = baseQueryString;
      let result: TraceMetrics;

      if (pendingMetrics && pendingMetrics.key === cacheKey) {
        // Reuse in-flight request from another hook instance
        result = await pendingMetrics.promise;
      } else {
        // Start new request
        const promise = doFetchMetrics(pplService, datasetParam, baseQueryString);
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
  }, [pplService, datasetParam, baseQueryString, tracesLoaded]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics, refreshCounter, timeVersion, fetchVersion]);

  const refresh = useCallback(() => {
    setMetrics(null);
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
