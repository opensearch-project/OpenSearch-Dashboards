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
import { extractSpanFilterQuery } from '../table_shared';
import { AGENT_TRACES_SESSION_ID_FIELD } from '../../../../../common';
import {
  aiRootCondition,
  ensureAiRootFieldChecked,
  shadowedAiRootsOf,
} from '../../../utils/ai_root';
import { getSourceCommand } from '../../sessions/session_utils';
import { ensureShadowedAiRootsChecked } from './shadowed_ai_roots';

export interface TraceMetrics {
  /** Distinct traces with an AI root. */
  totalTraces: number;
  totalSpans: number;
  /** Distinct traces with an AI root that match the query. */
  filteredTraces: number;
  /** AI-root spans (rows of the Traces table); more than traces when agents run in parallel. */
  totalAgentRuns: number;
  filteredAgentRuns: number;
  /** The shadowed AI-root lookup hit its limit, so counts may include a few duplicate runs. */
  countsMayIncludeDuplicates: boolean;
  filteredSpans: number;
  totalTokens: number;
  latencyP50Nanos: number;
  latencyP99Nanos: number;
  errorTraces: number;
  errorSpans: number;
  /** Distinct gen_ai.conversation.id values; null when unavailable (e.g. field not mapped). */
  totalSessions: number | null;
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
  filteredQuery: string,
  timeKey: string
): Promise<TraceMetrics> => {
  const isGenAiSpan = `isnotnull(\`attributes.gen_ai.operation.name\`)`;
  const source = getSourceCommand(sourceOnlyQuery);
  await ensureAiRootFieldChecked(pplService, datasetParam, source);
  await ensureShadowedAiRootsChecked(pplService, datasetParam, source, timeKey);
  // AI roots: a GenAI trace root, or a span marked as the agent root (usually the outermost GenAI
  // span under a non-GenAI root; an SDK may mark a non-GenAI span, so the filter keeps those too),
  // minus the shadowed ones.
  const rootCase = `(${aiRootCondition(datasetParam.id)})`;
  // The AI-root condition goes only in `where` clauses, which OpenSearch runs as a query: inside
  // `case()` it becomes a script, and a long list of shadowed AI roots exceeds the script size limit.
  const isError = `\`status.code\` = 2`;
  // Row-level filters only (where, eval, ...): a filter placed after eval still applies.
  const { filterQuery: whereQuery } = extractSpanFilterQuery(filteredQuery);

  // Run all queries in parallel
  // Note: User non-where commands (head, sort, etc.) are intentionally excluded from stats queries.
  // When a user types `| head 10`, it limits the data display but should not affect aggregate counts
  // or statistics. The UI hides the "of X total" text when head is detected (see queryEndsWithHead).
  const [spanStats, filteredStats, filteredCounts, sessionStats, rootStats] = await Promise.all([
    // Query A — Span counts (source-only, no user filter):
    // Total Spans and their error count are unaffected by user query filters
    (async () => {
      const countsQuery = `${sourceOnlyQuery} | where ${isGenAiSpan} | stats count() as total_spans, sum(case(${isError}, 1 else 0)) as error_spans`;
      const countsResponse = await pplService.executeQuery(datasetParam, countsQuery);
      return parseStatsResponse(countsResponse);
    })(),
    // Query B — Filtered stats (with user query where clauses only):
    // Tokens, Latency, and the traces and agent runs matching the query respect user query filters
    (async () => {
      const rootFilter = `where ${rootCase}`;
      const statsQuery = `${whereQuery} | ${rootFilter} | stats percentile(durationInNanos, 50) as p50_latency, percentile(durationInNanos, 99) as p99_latency, sum(\`attributes.gen_ai.usage.input_tokens\`) as input_tokens, sum(\`attributes.gen_ai.usage.output_tokens\`) as output_tokens, distinct_count(traceId) as filtered_traces, count() as filtered_runs`;
      const statsResponse = await pplService.executeQuery(datasetParam, statsQuery);
      return parseStatsResponse(statsResponse);
    })(),
    // Query C — Filtered span count (with user query where clauses only), shown in the info bar
    (async () => {
      const query = `${whereQuery} | where ${isGenAiSpan} | stats count() as filtered_spans`;
      const response = await pplService.executeQuery(datasetParam, query);
      return parseStatsResponse(response);
    })(),
    // Query D — Total Sessions (source-only, like Total Traces). Isolated with its own
    // catch: indices without the session field would otherwise fail the whole batch.
    (async () => {
      try {
        const sessionField = `\`${AGENT_TRACES_SESSION_ID_FIELD}\``;
        const query = `${sourceOnlyQuery} | where isnotnull(${sessionField}) | stats distinct_count(${sessionField}) as total_sessions`;
        const response = await pplService.executeQuery(datasetParam, query);
        return parseStatsResponse(response);
      } catch {
        return {} as ReturnType<typeof parseStatsResponse>;
      }
    })(),
    // Query E — AI-root counts (source-only): Total Traces counts distinct traces, as parallel
    // agents are one AI root (agent run) each.
    (async () => {
      const query = `${sourceOnlyQuery} | where ${rootCase} | stats distinct_count(traceId) as total_traces, count() as total_runs, sum(case(${isError}, 1 else 0)) as error_traces`;
      const response = await pplService.executeQuery(datasetParam, query);
      return parseStatsResponse(response);
    })(),
  ]);

  return {
    totalTraces: rootStats.total_traces ?? 0,
    totalSpans: spanStats.total_spans ?? 0,
    filteredTraces: filteredStats.filtered_traces ?? 0,
    totalAgentRuns: rootStats.total_runs ?? 0,
    filteredAgentRuns: filteredStats.filtered_runs ?? 0,
    countsMayIncludeDuplicates: shadowedAiRootsOf(datasetParam.id).capped,
    filteredSpans: filteredCounts.filtered_spans ?? 0,
    totalTokens: (filteredStats.input_tokens ?? 0) + (filteredStats.output_tokens ?? 0),
    latencyP50Nanos: filteredStats.p50_latency ?? 0,
    latencyP99Nanos: filteredStats.p99_latency ?? 0,
    errorTraces: rootStats.error_traces ?? 0,
    errorSpans: spanStats.error_spans ?? 0,
    totalSessions: sessionStats.total_sessions ?? null,
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

  const pplService = useMemo(
    () => (services.data ? new PPLService(services.data) : undefined),
    [services.data]
  );

  const fetchMetrics = useCallback(async () => {
    if (!pplService || !datasetParam || !tracesLoaded || !baseQueryString || !sourceOnlyQueryString)
      return;

    setLoading(true);
    setError(null);

    try {
      const timeKey = JSON.stringify(services.data?.query?.timefilter?.timefilter?.getTime() ?? {});
      const cacheKey = `${sourceOnlyQueryString}|${baseQueryString}|${timeKey}`;
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
          baseQueryString,
          timeKey
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
  }, [
    pplService,
    services.data,
    datasetParam,
    baseQueryString,
    sourceOnlyQueryString,
    tracesLoaded,
  ]);

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
