/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './trace_chart_container.scss';
import React, { useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { EuiFlexGroup, EuiFlexItem, EuiTitle, EuiSpacer } from '@elastic/eui';
import { ExploreServices } from '../../../types';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { useDatasetContext } from '../../../application/context/dataset_context/dataset_context';
import {
  defaultPrepareQueryString,
  executeQueries,
} from '../../../application/utils/state_management/actions/query_actions';
import {
  clearResults,
  clearQueryStatusMap,
  setDateRange,
} from '../../../application/utils/state_management/slices';
import { RootState } from '../../../application/utils/state_management/store';
import { CanvasPanel } from '../../panel/canvas_panel';
import { TracesChart } from './traces_chart';
import { tracesHistogramResultsProcessor } from '../../../application/utils/trace_chart_data_processor';

export const TraceChartContainer = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { data } = services;
  const dispatch = useDispatch();

  const { interval } = useSelector((state: RootState) => state.legacy);
  const query = useSelector((state: RootState) => state.query);
  const results = useSelector((state: RootState) => state.results);

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

  // Process raw results to get trace-specific chart data
  const processedResults = useMemo(() => {
    if (!rawResults || !dataset) {
      return null;
    }

    // Use traces-specific histogram processor
    const processed = tracesHistogramResultsProcessor(rawResults, dataset, data, interval);
    return processed;
  }, [rawResults, dataset, data, interval]);

  // Create timefilter update handler for brush selection
  const timefilterUpdateHandler = useCallback(
    (brushArea: any) => {
      if (!brushArea.x) {
        return;
      }
      const [from, to] = brushArea.x;

      dispatch(
        setDateRange({
          from: new Date(from).toISOString(),
          to: new Date(to).toISOString(),
        })
      );
      dispatch(clearResults());
      dispatch(clearQueryStatusMap());
      dispatch(executeQueries({ services }));
    },
    [services, dispatch]
  );

  // Convert ChartData to ChartDataPoint format for TracesChart
  const chartData = useMemo(() => {
    if (!processedResults) {
      return {
        errorData: [],
        latencyData: [],
        throughputData: [],
      };
    }

    const convertChartData = (rawChartData: any): Array<{ x: number; y: number }> => {
      if (!rawChartData || !rawChartData.values) {
        return [];
      }
      return rawChartData.values.map((point: any) => ({
        x: point.x,
        y: point.y,
      }));
    };

    return {
      errorData: convertChartData(processedResults.errorChart),
      latencyData: convertChartData(processedResults.latencyChart),
      throughputData: convertChartData(processedResults.chartData), // requestChart is stored as chartData
    };
  }, [processedResults]);

  if (!isTimeBased) {
    return null;
  }

  // Return null if no processed results or no hits
  if (!processedResults || !processedResults.hits.total) {
    return null;
  }

  return (
    <CanvasPanel className="exploreTraceCharts">
      <EuiFlexGroup direction="row" gutterSize="m">
        {/* Request Count Chart */}
        <EuiFlexItem>
          <div className="exploreTraceChart exploreTraceChart--request">
            <EuiTitle size="xs">
              <h4>Request</h4>
            </EuiTitle>
            <EuiSpacer size="s" />
            <TracesChart
              data={chartData.throughputData}
              title="Request Count"
              color="#1f77b4"
              height={150}
              chartType="bar"
              services={services}
              yAxisLabel="Requests"
              onBrushEnd={timefilterUpdateHandler}
            />
          </div>
        </EuiFlexItem>

        {/* Error Count Chart */}
        <EuiFlexItem>
          <div className="exploreTraceChart exploreTraceChart--error">
            <EuiTitle size="xs">
              <h4>Errors</h4>
            </EuiTitle>
            <EuiSpacer size="s" />
            <TracesChart
              data={chartData.errorData}
              title="Error Count"
              color="#d62728"
              height={150}
              chartType="bar"
              services={services}
              yAxisLabel="Errors"
              onBrushEnd={timefilterUpdateHandler}
            />
          </div>
        </EuiFlexItem>

        {/* Latency Chart */}
        <EuiFlexItem>
          <div className="exploreTraceChart exploreTraceChart--latency">
            <EuiTitle size="xs">
              <h4>Latency</h4>
            </EuiTitle>
            <EuiSpacer size="s" />
            <TracesChart
              data={chartData.latencyData}
              title="Average Latency"
              color="#2ca02c"
              height={150}
              chartType="line"
              services={services}
              yAxisLabel="Latency (ms)"
              onBrushEnd={timefilterUpdateHandler}
            />
          </div>
        </EuiFlexItem>
      </EuiFlexGroup>
    </CanvasPanel>
  );
};
