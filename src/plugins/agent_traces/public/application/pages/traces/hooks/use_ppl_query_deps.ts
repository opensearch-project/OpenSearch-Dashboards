/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { AgentTracesServices } from '../../../../types';
import { useDatasetContext } from '../../../context/dataset_context/dataset_context';
import { defaultPrepareQueryString } from '../../../utils/state_management/actions/query_actions';
import { RootState } from '../../../utils/state_management/store';
import { TracePPLService } from '../trace_details/data_fetching/ppl_request_trace';
import { Dataset } from '../../../../../../data/common';

export interface PPLQueryDeps {
  services: AgentTracesServices;
  pplService: TracePPLService | undefined;
  datasetParam: Dataset | null;
  baseQueryString: string | null;
}

/**
 * Shared hook that provides the common PPL query dependencies
 * used by use_agent_traces, use_agent_spans, and use_trace_metrics.
 */
export const usePPLQueryDeps = (): PPLQueryDeps => {
  const { services } = useOpenSearchDashboards<AgentTracesServices>();
  const { dataset } = useDatasetContext();
  const query = useSelector((state: RootState) => state.query);

  const pplService = useMemo(
    () => (services.data ? new TracePPLService(services.data) : undefined),
    [services.data]
  );

  const datasetParam = useMemo(() => {
    if (!dataset) return null;
    return {
      id: dataset.id || '',
      title: dataset.title,
      type: dataset.type || 'INDEX_PATTERN',
      timeFieldName: dataset.timeFieldName,
      ...(dataset.dataSourceRef && {
        dataSource: {
          id: dataset.dataSourceRef.id,
          title: dataset.dataSourceRef.name || dataset.dataSourceRef.id,
          type: dataset.dataSourceRef.type || 'OpenSearch',
          version: '',
        },
      }),
    };
  }, [dataset]);

  const baseQueryString = useMemo(() => {
    try {
      return defaultPrepareQueryString(query);
    } catch {
      return null;
    }
  }, [query]);

  return { services, pplService, datasetParam, baseQueryString };
};

/**
 * Shared hook for tracking time range changes to trigger re-fetches.
 */
export const useTimeVersion = (services: AgentTracesServices): number => {
  const [timeVersion, setTimeVersion] = useState(0);
  useEffect(() => {
    const sub = services.data?.query?.timefilter?.timefilter?.getTimeUpdate$()?.subscribe(() => {
      setTimeVersion((v) => v + 1);
    });
    return () => sub?.unsubscribe();
  }, [services.data]);
  return timeVersion;
};

/**
 * Shared hook for ref-based tab visibility that avoids re-fetching on simple
 * tab switches while deferring fetch if query params change while hidden.
 * Returns a trigger to force refresh when the tab becomes active again.
 */
export const useTabVisibilityRef = (
  isTabActive: boolean
): {
  isTabActiveRef: React.MutableRefObject<boolean>;
  skippedFetchRef: React.MutableRefObject<boolean>;
  refreshOnActivate: () => number;
} => {
  const isTabActiveRef = useRef(isTabActive);
  const skippedFetchRef = useRef(false);
  const [, setActivateCounter] = useState(0);

  const refreshOnActivate = useCallback(() => {
    let counter = 0;
    setActivateCounter((c) => {
      counter = c + 1;
      return counter;
    });
    return counter;
  }, []);

  useEffect(() => {
    isTabActiveRef.current = isTabActive;
    if (isTabActive && skippedFetchRef.current) {
      skippedFetchRef.current = false;
      refreshOnActivate();
    }
  }, [isTabActive, refreshOnActivate]);

  return { isTabActiveRef, skippedFetchRef, refreshOnActivate };
};
