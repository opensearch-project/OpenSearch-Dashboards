/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import {
  CorrelationService,
  LogHit,
  fetchTraceLogsByTraceId,
  filterLogsBySpanId,
  transformLogsResponseToHits,
} from '../../../../../../explore/public';
import { Dataset } from '../../../../../../data/common';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { AgentTracesServices } from '../../../../types';
import { useDatasetContext } from '../../../context/dataset_context/dataset_context';

/**
 * Logs fetched per correlated logs dataset. Higher than Explore traces' 10: an agent trace
 * spans several services and logs each step, so 10 cuts most traces short.
 */
export const TRACE_LOGS_LIMIT = 100;

export interface TraceLogs {
  /** Logs datasets correlated with the traces dataset (trace-to-logs correlations). */
  logDatasets: Dataset[];
  /** Logs of the trace, by logs dataset id. */
  datasetLogs: Record<string, LogHit[]>;
  /** Logs found across all logs datasets. */
  logCount: number;
  isLoading: boolean;
  /** Failed lookups or logs queries; logs from the other datasets still show. */
  errors: string[];
  /** Logs datasets that returned the full TRACE_LOGS_LIMIT, so the trace may have more. */
  cappedDatasetIds: string[];
  /** The traces dataset the correlations were looked up for. */
  traceDataset?: Dataset | null;
}

type TraceLogsResult = Omit<TraceLogs, 'isLoading' | 'traceDataset'>;

const EMPTY: TraceLogsResult = {
  logDatasets: [],
  datasetLogs: {},
  logCount: 0,
  errors: [],
  cappedDatasetIds: [],
};

/**
 * Results by traces dataset and trace id, so remounting the flyout (Back/Forward, reopening a
 * trace) does not fetch the same logs again. Short-lived: new logs show up after a minute.
 */
const CACHE_TTL_MS = 60_000;
const CACHE_MAX = 50;
const cache = new Map<string, { at: number; result: TraceLogsResult }>();
const cacheGet = (key: string) => {
  const hit = cache.get(key);
  if (!hit || Date.now() - hit.at > CACHE_TTL_MS) return undefined;
  return hit.result;
};
const cacheSet = (key: string, result: TraceLogsResult) => {
  cache.delete(key);
  cache.set(key, { at: Date.now(), result });
  while (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value as string);
};
/** For tests. */
export const clearTraceLogsCache = () => cache.clear();

/**
 * Logs correlated with a trace, through the same correlations saved objects Explore traces
 * uses (trace dataset -> logs datasets, matched on trace id). Nothing is fetched when the
 * traces dataset has no logs correlation.
 */
export const useTraceLogs = (traceId: string | undefined): TraceLogs => {
  const { services } = useOpenSearchDashboards<AgentTracesServices>();
  const { dataset } = useDatasetContext();
  const [state, setState] = useState<TraceLogs>({ ...EMPTY, isLoading: false });

  // Correlations reference the traces dataset by id; logs are matched on trace id.
  const traceDataset = useMemo<Dataset | null>(
    () =>
      dataset?.id
        ? {
            id: dataset.id,
            title: dataset.title,
            type: dataset.type || 'INDEX_PATTERN',
            timeFieldName: dataset.timeFieldName,
          }
        : null,
    [dataset]
  );

  const correlationService = useMemo(
    () =>
      services?.savedObjects?.client && services.uiSettings
        ? new CorrelationService(services.savedObjects.client, services.uiSettings, services.data)
        : undefined,
    [services]
  );

  useEffect(() => {
    if (!traceId || !traceDataset || !correlationService || !services?.data) {
      setState({ ...EMPTY, isLoading: false });
      return;
    }
    const key = `${traceDataset.id}:${traceId}`;
    const cached = cacheGet(key);
    if (cached) {
      setState({ ...cached, isLoading: false });
      return;
    }
    let cancelled = false;
    setState({ ...EMPTY, isLoading: true });
    correlationService
      .checkCorrelationsAndFetchLogs(traceDataset, services.data, traceId, TRACE_LOGS_LIMIT)
      .then(({ logDatasets, datasetLogs, logHitCount, errors }) => {
        const result: TraceLogsResult = {
          logDatasets,
          datasetLogs,
          logCount: logHitCount,
          errors: errors ?? [],
          cappedDatasetIds: logDatasets
            .filter((d) => (datasetLogs[d.id]?.length ?? 0) >= TRACE_LOGS_LIMIT)
            .map((d) => d.id),
        };
        if (result.errors.length === 0) cacheSet(key, result);
        if (!cancelled) setState({ ...result, isLoading: false });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            ...EMPTY,
            errors: [error instanceof Error ? error.message : String(error)],
            isLoading: false,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [traceId, traceDataset, correlationService, services?.data]);

  return { ...state, traceDataset };
};

/**
 * A span's logs. Filtered from the trace's logs, except for datasets that hit the limit: there
 * the span's logs may be missing from the trace's first TRACE_LOGS_LIMIT, so they are queried
 * by trace and span id.
 */
export const useSpanLogs = (traceLogs: TraceLogs, traceId: string, spanId: string | undefined) => {
  const { services } = useOpenSearchDashboards<AgentTracesServices>();
  const [spanLogs, setSpanLogs] = useState<{
    key: string;
    datasetLogs: Record<string, LogHit[]>;
  } | null>(null);
  const capped = traceLogs.cappedDatasetIds;
  const key = `${traceId}:${spanId}:${capped.join(',')}`;

  useEffect(() => {
    if (!spanId || capped.length === 0 || !services?.data) return;
    let cancelled = false;
    Promise.all(
      traceLogs.logDatasets
        .filter((d) => capped.includes(d.id))
        .map(async (dataset) => {
          try {
            const response = await fetchTraceLogsByTraceId(services.data, {
              traceId,
              spanId,
              dataset,
              limit: TRACE_LOGS_LIMIT,
            });
            return [dataset.id, transformLogsResponseToHits(response)] as const;
          } catch {
            return [dataset.id, [] as LogHit[]] as const;
          }
        })
    ).then((entries) => {
      if (!cancelled) setSpanLogs({ key, datasetLogs: Object.fromEntries(entries) });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, services?.data]);

  return useMemo(() => {
    const datasetLogs: Record<string, LogHit[]> = {};
    for (const dataset of traceLogs.logDatasets) {
      datasetLogs[dataset.id] =
        capped.includes(dataset.id) && spanLogs?.key === key
          ? (spanLogs.datasetLogs[dataset.id] ?? [])
          : filterLogsBySpanId(traceLogs.datasetLogs[dataset.id] ?? [], spanId ?? '', dataset);
    }
    return datasetLogs;
  }, [traceLogs, capped, spanLogs, key, spanId]);
};

/** Number of a span's logs among the trace's logs. */
export const countSpanLogs = (
  logs: Pick<TraceLogs, 'logDatasets' | 'datasetLogs'>,
  spanId: string | undefined
): number => {
  if (!spanId) return 0;
  return logs.logDatasets.reduce(
    (sum, dataset) =>
      sum + filterLogsBySpanId(logs.datasetLogs[dataset.id] ?? [], spanId, dataset).length,
    0
  );
};
