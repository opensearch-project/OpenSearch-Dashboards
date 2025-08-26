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
  defaultPrepareQueryString,
} from '../../application/utils/state_management/actions/query_actions';
import { RootState } from '../../application/utils/state_management/store';
import { selectShowHistogram } from '../../application/utils/state_management/selectors';
import { CanvasPanel } from '../panel/canvas_panel';
import { Chart } from './utils';
import { useFlavorId } from '../../helpers/use_flavor_id';
import { tracesHistogramResultsProcessor } from '../../application/utils/state_management/actions/processors/trace_chart_data_processor';
import { ExploreTracesChart } from './explore_traces_chart';
import {
  ProcessedSearchResults,
  TracesChartProcessedResults,
} from '../../application/utils/interfaces';

export const DiscoverChartContainer = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { uiSettings, data } = services;
  const flavorId = useFlavorId();

  const { interval } = useSelector((state: RootState) => state.legacy);
  const query = useSelector((state: RootState) => state.query);
  const results = useSelector((state: RootState) => state.results);
  const showHistogram = useSelector(selectShowHistogram);

  // Use default cache key computation for histogram data
  const cacheKey = useMemo(() => {
    return defaultPrepareQueryString(query);
  }, [query]);

  const rawResults = cacheKey ? results[cacheKey] : null;

  // Get dataset from centralized context
  const { dataset } = useDatasetContext();

  const isTimeBased = useMemo(() => {
    return dataset ? dataset.isTimeBased() : false;
  }, [dataset]);

  // Process raw results to get chart data
  const processedResults = useMemo<
    ProcessedSearchResults | TracesChartProcessedResults | null
  >(() => {
    if (!rawResults || !dataset) {
      return null;
    }

    if (flavorId === ExploreFlavor.Traces) {
      return tracesHistogramResultsProcessor(rawResults, dataset, data, interval);
    }

    return histogramResultsProcessor(rawResults, dataset, data, interval);
  }, [rawResults, dataset, flavorId, data, interval]);

  if (!isTimeBased) {
    return null;
  }

  // Return null if no processed results or no chart data
  if (!processedResults || !processedResults.hits.total) {
    return null;
  }

  if (
    (processedResults as TracesChartProcessedResults).requestChartData == null &&
    (processedResults as ProcessedSearchResults).chartData == null
  ) {
    return null;
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
