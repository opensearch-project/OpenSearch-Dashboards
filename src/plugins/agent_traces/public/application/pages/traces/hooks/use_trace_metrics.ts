/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { useSelector } from 'react-redux';
import { PPLService } from '../trace_details/data_fetching/ppl_request_helpers';
import { Dataset } from '../../../../../../data/common';
import { usePPLQueryDeps, useTimeVersion } from './use_ppl_query_deps';
import { RootState } from '../../../utils/state_management/store';
import { extractSpanFilterQuery } from '../table_shared';
import { AGENT_TRACES_SESSION_ID_FIELD } from '../../../../../common';
import { aiRootCondition, ensureAiRootFieldChecked } from '../../../utils/ai_root';
import { getSourceCommand } from '../../sessions/session_utils';
import { shadowedAiRootsExclusion } from './shadowed_ai_roots';

export interface TraceMetrics {
  /** Distinct traces with an AI root. */
  totalTraces: number;
  totalSpans: number;
  /** Distinct traces with an AI root that match the query. */
  filteredTraces: number;
  /** AI-root spans (rows of the Traces table); more than traces when agents run in parallel. */
  totalAgentRuns: number;
  filteredAgentRuns: number;
  /** The duplicate-run lookup hit its limit: tokens, latency and runs may count a few twice. */
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

const IS_GENAI_SPAN = `isnotnull(\`attributes.gen_ai.operation.name\`)`;
const IS_ERROR = `\`status.code\` = 2`;

/**
 * The metrics' PPL queries. The AI-root condition goes only in `where` clauses, which OpenSearch
 * runs as a query: inside `case()` it becomes a script, and a long exclusion exceeds the script
 * size limit. Trace counts use `distinct_count` (an OpenSearch cardinality aggregation: exact up
 * to a few thousand traces, within about 0.1% above); counting per trace with
 * `stats ... by traceId` is exact but 5 to 20 times slower, past the request timeout on the
 * legacy engine for a week of busy data.
 */
export const buildMetricsQueries = (
  sourceOnlyQuery: string,
  whereQuery: string,
  rootCase: string,
  filteredRootCase: string = rootCase
) => ({
  // Source-only: Total Spans and their errors are unaffected by the user's filter.
  spans: `${sourceOnlyQuery} | where ${IS_GENAI_SPAN} | stats count() as total_spans, sum(case(${IS_ERROR}, 1 else 0)) as error_spans`,
  // Source-only: Total Traces and agent runs (parallel agents are one trace, several runs).
  roots: `${sourceOnlyQuery} | where ${rootCase} | stats distinct_count(traceId) as total_traces, count() as total_runs`,
  // Source-only: traces with an errored agent run.
  errorRoots: `${sourceOnlyQuery} | where (${rootCase}) AND ${IS_ERROR} | stats distinct_count(traceId) as error_traces`,
  // With the user's filter: tokens, latency, and the traces and agent runs the table lists.
  rootStats: `${whereQuery} | where ${filteredRootCase} | stats percentile(durationInNanos, 50) as p50_latency, percentile(durationInNanos, 99) as p99_latency, sum(\`attributes.gen_ai.usage.input_tokens\`) as input_tokens, sum(\`attributes.gen_ai.usage.output_tokens\`) as output_tokens, distinct_count(traceId) as filtered_traces, count() as filtered_runs`,
  // With the user's filter: spans, for the Spans tab's info bar.
  filteredSpans: `${whereQuery} | where ${IS_GENAI_SPAN} | stats count() as filtered_spans`,
  sessions: `${sourceOnlyQuery} | where isnotnull(\`${AGENT_TRACES_SESSION_ID_FIELD}\`) | stats distinct_count(\`${AGENT_TRACES_SESSION_ID_FIELD}\`) as total_sessions`,
});

const doFetchMetrics = async (
  pplService: PPLService,
  datasetParam: Dataset,
  sourceOnlyQuery: string,
  filteredQuery: string
): Promise<TraceMetrics> => {
  const source = getSourceCommand(sourceOnlyQuery);
  await ensureAiRootFieldChecked(pplService, datasetParam, source);
  // AI roots: a GenAI trace root, or a span marked as the agent root (usually the outermost GenAI
  // span under a non-GenAI root; an SDK may mark a non-GenAI span, so the filter keeps those too),
  // minus shadowed ones so each agent run is counted once.
  // Row-level filters only (where, eval, ...): a filter placed after eval still applies.
  const { filterQuery: whereQuery } = extractSpanFilterQuery(filteredQuery);
  const filtered = whereQuery.trim() !== sourceOnlyQuery.trim();
  // Totals are deduplicated over all runs; filtered counts over the runs the filter matches,
  // which is exact for a filtered view even when the totals' lookup is capped.
  const [exclusion, filteredExclusion] = await Promise.all([
    shadowedAiRootsExclusion(pplService, datasetParam, source, sourceOnlyQuery),
    filtered ? shadowedAiRootsExclusion(pplService, datasetParam, source, whereQuery) : null,
  ]);
  const aiRoots = `(${aiRootCondition(datasetParam.id)})`;
  const queries = buildMetricsQueries(
    sourceOnlyQuery,
    whereQuery,
    `${aiRoots}${exclusion.clause}`,
    `${aiRoots}${(filteredExclusion ?? exclusion).clause}`
  );
  const run = async (query: string) =>
    parseStatsResponse(await pplService.executeQuery(datasetParam, query));

  // Run all queries in parallel
  // Note: User non-where commands (head, sort, etc.) are intentionally excluded from stats queries.
  // When a user types `| head 10`, it limits the data display but should not affect aggregate counts
  // or statistics. The UI hides the "of X total" text when head is detected (see queryEndsWithHead).
  const [spanStats, rootStats, errorStats, filteredStats, filteredCounts, sessionStats] =
    await Promise.all([
      run(queries.spans),
      run(queries.roots),
      run(queries.errorRoots),
      run(queries.rootStats),
      run(queries.filteredSpans),
      // Isolated: indices without the session field would otherwise fail the whole batch.
      run(queries.sessions).catch(() => ({}) as ReturnType<typeof parseStatsResponse>),
    ]);

  return {
    totalTraces: rootStats.total_traces ?? 0,
    totalSpans: spanStats.total_spans ?? 0,
    filteredTraces: filteredStats.filtered_traces ?? 0,
    totalAgentRuns: rootStats.total_runs ?? 0,
    filteredAgentRuns: filteredStats.filtered_runs ?? 0,
    // Agent runs, tokens and latency may count a few runs twice when either lookup was capped.
    countsMayIncludeDuplicates: exclusion.capped || !!filteredExclusion?.capped,
    filteredSpans: filteredCounts.filtered_spans ?? 0,
    totalTokens: (filteredStats.input_tokens ?? 0) + (filteredStats.output_tokens ?? 0),
    latencyP50Nanos: filteredStats.p50_latency ?? 0,
    latencyP99Nanos: filteredStats.p99_latency ?? 0,
    errorTraces: errorStats.error_traces ?? 0,
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

  const timefilter = services.data?.query?.timefilter?.timefilter;
  // The latest request: an older one that finishes later must not overwrite its metrics.
  const latestRequest = useRef(0);
  const pplService = useMemo(
    () => (services.data ? new PPLService(services.data) : undefined),
    [services.data]
  );

  const fetchMetrics = useCallback(async () => {
    if (!pplService || !datasetParam || !tracesLoaded || !baseQueryString || !sourceOnlyQueryString)
      return;

    const request = ++latestRequest.current;
    const isLatest = () => request === latestRequest.current;
    setLoading(true);
    setError(null);

    try {
      // Includes the time range: a request for another range must not reuse one in flight.
      const timeRange = JSON.stringify(timefilter?.getTime());
      const cacheKey = `${sourceOnlyQueryString}|${baseQueryString}|${timeRange}`;
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

      if (isLatest()) setMetrics(result);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch trace metrics:', err);
      if (isLatest()) setError((err as Error).message || 'Failed to fetch metrics');
    } finally {
      if (isLatest()) setLoading(false);
    }
  }, [pplService, timefilter, datasetParam, baseQueryString, sourceOnlyQueryString, tracesLoaded]);

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
