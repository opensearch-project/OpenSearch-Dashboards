/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import { CorrelationService, LogHit, filterLogsBySpanId } from '../../../../../../explore/public';
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
  /** The traces dataset the correlations were looked up for. */
  traceDataset?: Dataset | null;
}

const EMPTY: Omit<TraceLogs, 'isLoading'> = { logDatasets: [], datasetLogs: {}, logCount: 0 };

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
    let cancelled = false;
    setState({ ...EMPTY, isLoading: true });
    correlationService
      .checkCorrelationsAndFetchLogs(traceDataset, services.data, traceId, TRACE_LOGS_LIMIT)
      .then(({ logDatasets, datasetLogs, logHitCount }) => {
        if (!cancelled) {
          setState({ logDatasets, datasetLogs, logCount: logHitCount, isLoading: false });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ ...EMPTY, isLoading: false });
      });
    return () => {
      cancelled = true;
    };
  }, [traceId, traceDataset, correlationService, services?.data]);

  return { ...state, traceDataset };
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
