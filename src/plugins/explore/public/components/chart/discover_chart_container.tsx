/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './discover_chart_container.scss';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ExploreFlavor } from '../../../common';
import { ExploreServices } from '../../types';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { ExploreLogsChart } from './explore_logs_chart';
import { useDatasetContext } from '../../application/context/dataset_context/dataset_context';
import {
  histogramResultsProcessor,
  prepareHistogramCacheKey,
  prepareTraceCacheKeys,
} from '../../application/utils/state_management/actions/query_actions';
import { RootState } from '../../application/utils/state_management/store';
import { selectShowHistogram } from '../../application/utils/state_management/selectors';
import { CanvasPanel } from '../panel/canvas_panel';
import { Chart } from './utils';
import { useFlavorId } from '../../helpers/use_flavor_id';
import { processTraceAggregationResults } from '../../application/utils/state_management/actions/processors/trace_aggregation_processor';
import { ExploreTracesChart } from './explore_traces_chart';
import {
  ProcessedSearchResults,
  TracesChartProcessedResults,
} from '../../application/utils/interfaces';
import { createHistogramConfigWithInterval } from '../../application/utils/state_management/actions/utils';
import { TRACES_CHART_BAR_TARGET } from '../../application/utils/state_management/constants';

export const DiscoverChartContainer = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { uiSettings, data } = services;
  const flavorId = useFlavorId();

  const { interval } = useSelector((state: RootState) => state.legacy);
  const query = useSelector((state: RootState) => state.query);
  const results = useSelector((state: RootState) => state.results);
  const breakdownField = useSelector((state: RootState) => state.queryEditor.breakdownField);
  const queryStatusMap = useSelector((state: RootState) => state.queryEditor.queryStatusMap);
  const dateRange = useSelector((state: RootState) => state.queryEditor.dateRange);
  const showHistogram = useSelector(selectShowHistogram);

  // Get dataset early since it's needed for cache key calculations
  const { dataset } = useDatasetContext();

  const breakdownCacheKey = useMemo(() => {
    return breakdownField ? prepareHistogramCacheKey(query, true) : undefined;
  }, [query, breakdownField]);

  const standardCacheKey = useMemo(() => {
    return prepareHistogramCacheKey(query, false);
  }, [query]);

  const hasBreakdownError = useMemo(() => {
    if (!breakdownCacheKey) return false;
    const breakdownStatus = queryStatusMap[breakdownCacheKey];
    const standardStatus = queryStatusMap[standardCacheKey];

    return breakdownStatus?.error && !standardStatus?.error;
  }, [breakdownCacheKey, standardCacheKey, queryStatusMap]);

  const cacheKey = useMemo(() => {
    if (hasBreakdownError || !breakdownCacheKey) {
      return standardCacheKey;
    }
    return breakdownCacheKey;
  }, [hasBreakdownError, breakdownCacheKey, standardCacheKey]);

  const rawResults = cacheKey ? results[cacheKey] : null;

  const actualInterval = useMemo(() => {
    if (flavorId === ExploreFlavor.Traces && dataset && services?.data && interval) {
      // Create a minimal getState function for createHistogramConfigWithInterval
      const getState = () =>
        ({
          legacy: { interval },
          queryEditor: { breakdownField },
        } as RootState);

      const histogramConfig = createHistogramConfigWithInterval(
        dataset,
        interval,
        services,
        getState,
        TRACES_CHART_BAR_TARGET
      );
      return histogramConfig?.finalInterval || interval || 'auto';
    }
    return interval || 'auto';
  }, [flavorId, dataset, services, interval, breakdownField]);

  const { requestCacheKey, errorCacheKey, latencyCacheKey } = useMemo(() => {
    if (flavorId !== ExploreFlavor.Traces || !dataset || !services?.data) {
      return { requestCacheKey: null, errorCacheKey: null, latencyCacheKey: null };
    }
    // Cache keys use base query only (like Logs) - interval changes overwrite results
    return prepareTraceCacheKeys(query);
  }, [flavorId, query, dataset, services]);

  const requestResults = requestCacheKey ? results[requestCacheKey] : null;
  const errorResults = errorCacheKey ? results[errorCacheKey] : null;
  const latencyResults = latencyCacheKey ? results[latencyCacheKey] : null;

  // Get error states for each trace query
  const requestError = requestCacheKey ? queryStatusMap[requestCacheKey]?.error : null;
  const errorQueryError = errorCacheKey ? queryStatusMap[errorCacheKey]?.error : null;
  const latencyError = latencyCacheKey ? queryStatusMap[latencyCacheKey]?.error : null;

  const isTimeBased = useMemo(() => {
    return dataset ? dataset.isTimeBased() : false;
  }, [dataset]);

  const processedResults = useMemo<
    ProcessedSearchResults | TracesChartProcessedResults | null
  >(() => {
    if (flavorId === ExploreFlavor.Traces) {
      if (!requestResults || !dataset) {
        return null;
      }
      return processTraceAggregationResults(
        requestResults,
        errorResults,
        latencyResults,
        dataset,
        actualInterval,
        dataset.timeFieldName || 'endTime',
        data,
        interval,
        uiSettings
      );
    }

    if (!rawResults || !dataset) {
      return null;
    }
    return histogramResultsProcessor(rawResults, dataset, data, interval, uiSettings);
  }, [
    rawResults,
    requestResults,
    errorResults,
    latencyResults,
    dataset,
    flavorId,
    data,
    actualInterval,
    interval,
    uiSettings,
  ]);

  if (!isTimeBased) {
    return null;
  }

  if (!processedResults) {
    return null;
  }

  if (flavorId === ExploreFlavor.Traces) {
    if (!(processedResults as TracesChartProcessedResults).requestChartData) {
      return null;
    }
  } else {
    if (!processedResults.hits.total || !(processedResults as ProcessedSearchResults).chartData) {
      return null;
    }
  }

  return (
    <CanvasPanel className="explore-chart-panel">
      <div className="dscCanvas__chart">
        {flavorId === ExploreFlavor.Logs && (
          <ExploreLogsChart
            bucketInterval={processedResults.bucketInterval}
            chartData={(processedResults as ProcessedSearchResults).chartData as Chart}
            config={uiSettings}
            data={data}
            services={services}
            showHistogram={showHistogram}
          />
        )}
        {flavorId === ExploreFlavor.Traces && (
          <ExploreTracesChart
            bucketInterval={processedResults.bucketInterval}
            requestChartData={
              (processedResults as TracesChartProcessedResults).requestChartData as Chart
            }
            errorChartData={
              (processedResults as TracesChartProcessedResults).errorChartData as Chart
            }
            latencyChartData={
              (processedResults as TracesChartProcessedResults).latencyChartData as Chart
            }
            requestError={requestError}
            errorQueryError={errorQueryError}
            latencyError={latencyError}
            timeFieldName={dataset?.timeFieldName || 'endTime'}
            config={uiSettings}
            data={data}
            services={services}
            showHistogram={showHistogram}
          />
        )}
      </div>
    </CanvasPanel>
  );
};
