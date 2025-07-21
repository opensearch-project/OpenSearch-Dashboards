/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './discover_chart_container.scss';
import React, { useMemo, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  EuiPanel,
  EuiTitle,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonIcon,
  EuiSelect,
  EuiText,
} from '@elastic/eui';
import { ExploreServices } from '../../types';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { useDatasetContext } from '../../application/context/dataset_context/dataset_context';
import {
  defaultPrepareQueryString,
  executeQueries,
} from '../../application/utils/state_management/actions/query_actions';
import { clearResults, clearQueryStatusMap } from '../../application/utils/state_management/slices';
import { RootState } from '../../application/utils/state_management/store';
import { CanvasPanel } from '../panel/canvas_panel';
import { TracesChart } from './traces_chart';
import { isErrorSpan } from './traces_error_detector';

export const TracesMetricsPanel = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [intervalOption, setIntervalOption] = useState('auto');
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

  // Process raw results to get traces-specific chart data
  const processedData = useMemo(() => {
    if (!rawResults || !dataset || !dataset.timeFieldName) {
      return null;
    }

    const hits = rawResults.hits?.hits || [];
    if (hits.length === 0) {
      return null;
    }

    // Parse interval to milliseconds
    const intervalMs = parseIntervalToMs(intervalOption === 'auto' ? interval : intervalOption);
    if (!intervalMs) {
      return null;
    }

    // Data structures for all three metrics
    const requestBuckets = new Map<number, number>(); // Count all spans, not unique traces
    const errorBuckets = new Map<number, number>();
    const latencyBuckets = new Map<number, { sum: number; count: number }>();
    let minTime = Infinity;
    let maxTime = -Infinity;

    let totalHits = 0;
    let totalErrors = 0;

    for (const hit of hits) {
      totalHits++;
      const timeValue = hit._source?.[dataset.timeFieldName];
      if (!timeValue) continue;

      // Apply the same timezone fix as the logs table for consistent display
      const timeString = typeof timeValue === 'string' ? timeValue : String(timeValue);
      const correctedTimestamp =
        timeString.includes('Z') ||
        timeString.includes('+') ||
        (timeString.includes('-') && timeString.lastIndexOf('-') > 10)
          ? new Date(timeString).getTime()
          : new Date(timeString + 'Z').getTime();

      const timestamp = correctedTimestamp;
      if (isNaN(timestamp)) continue;

      // Update min/max times
      minTime = Math.min(minTime, timestamp);
      maxTime = Math.max(maxTime, timestamp);

      // Calculate bucket key (rounded down to interval)
      const bucketKey = Math.floor(timestamp / intervalMs) * intervalMs;

      // Count all spans as requests (not unique traces)
      requestBuckets.set(bucketKey, (requestBuckets.get(bucketKey) || 0) + 1);

      // Check for errors using the same logic as StatusCodeFormatter
      const source = hit._source || {};

      if (isErrorSpan(source)) {
        totalErrors++;
        errorBuckets.set(bucketKey, (errorBuckets.get(bucketKey) || 0) + 1);
      }

      // Calculate latency (duration) - check multiple duration fields
      const duration =
        source.durationInNanos ||
        source.duration ||
        source['duration.nanos'] ||
        source.durationNanos ||
        source['attributes.duration'] ||
        source.endTimeUnixNano - source.startTimeUnixNano; // Calculate from start/end times

      if (duration && !isNaN(parseFloat(duration.toString()))) {
        let durationMs = parseFloat(duration.toString());

        // Convert nanoseconds to milliseconds if the value seems to be in nanoseconds
        if (durationMs > 1000000) {
          durationMs = durationMs / 1000000;
        }

        if (!latencyBuckets.has(bucketKey)) {
          latencyBuckets.set(bucketKey, { sum: 0, count: 0 });
        }
        const bucket = latencyBuckets.get(bucketKey)!;
        bucket.sum += durationMs;
        bucket.count += 1;
      }
    }

    if (requestBuckets.size === 0 && errorBuckets.size === 0 && latencyBuckets.size === 0) {
      return null;
    }

    // Fill in missing buckets between min and max time
    const startBucket = Math.floor(minTime / intervalMs) * intervalMs;
    const endBucket = Math.floor(maxTime / intervalMs) * intervalMs;

    const requestData: Array<{ x: number; y: number }> = [];
    const errorData: Array<{ x: number; y: number }> = [];
    const latencyData: Array<{ x: number; y: number }> = [];

    for (let bucketKey = startBucket; bucketKey <= endBucket; bucketKey += intervalMs) {
      // Request count (all spans)
      requestData.push({ x: bucketKey, y: requestBuckets.get(bucketKey) || 0 });

      // Error count
      errorData.push({ x: bucketKey, y: errorBuckets.get(bucketKey) || 0 });

      // Average latency
      const latencyBucket = latencyBuckets.get(bucketKey);
      const avgLatency = latencyBucket ? latencyBucket.sum / latencyBucket.count : 0;
      latencyData.push({ x: bucketKey, y: avgLatency });
    }

    return {
      requestData,
      errorData,
      latencyData,
      timeRange: { min: minTime, max: maxTime },
    };
  }, [rawResults, dataset, interval, intervalOption]);

  // Calculate metrics for display
  const metrics = useMemo(() => {
    if (!processedData) {
      return { totalRequests: 0, requestsPerSecond: 0, totalErrors: 0, errorPercentage: 0 };
    }

    // Calculate total requests
    const totalRequests = processedData.requestData.reduce((sum, point) => sum + point.y, 0);

    // Calculate total errors
    const totalErrors = processedData.errorData.reduce((sum, point) => sum + point.y, 0);

    // Calculate error percentage
    const errorPercentage =
      totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(1) : '0';

    // Calculate requests per second
    const durationSeconds = (processedData.timeRange.max - processedData.timeRange.min) / 1000;
    const requestsPerSecond =
      durationSeconds > 0 ? parseFloat((totalRequests / durationSeconds).toFixed(1)) : 0;

    return {
      totalRequests,
      requestsPerSecond,
      totalErrors,
      errorPercentage,
    };
  }, [processedData]);

  // Create timefilter update handler for brush selection
  const timefilterUpdateHandler = useCallback(
    (brushArea: any) => {
      if (!brushArea.x) {
        return;
      }
      const [from, to] = brushArea.x;

      // Helper function to handle timezone for brush selection using the same logic as logs
      const formatTimestamp = (timestamp: any) => {
        // Convert timestamp to ISO string first
        const isoString = new Date(timestamp).toISOString();

        // Apply the same timezone fix as the logs table
        const correctedTimestamp =
          isoString.includes('Z') ||
          isoString.includes('+') ||
          (isoString.includes('-') && isoString.lastIndexOf('-') > 10)
            ? new Date(isoString).getTime()
            : new Date(isoString + 'Z').getTime();

        // Convert back to ISO string for timefilter
        return new Date(correctedTimestamp).toISOString();
      };

      services.data.query.timefilter.timefilter.setTime({
        from: formatTimestamp(from),
        to: formatTimestamp(to),
        mode: 'absolute',
      });
      dispatch(clearResults());
      dispatch(clearQueryStatusMap());
      dispatch(executeQueries({ services }));
    },
    [services, dispatch]
  );

  const intervalOptions = [
    { value: 'auto', text: 'Auto' },
    { value: '1m', text: '1 minute' },
    { value: '5m', text: '5 minutes' },
    { value: '15m', text: '15 minutes' },
    { value: '30m', text: '30 minutes' },
    { value: '1h', text: '1 hour' },
    { value: '3h', text: '3 hours' },
    { value: '12h', text: '12 hours' },
    { value: '1d', text: '1 day' },
  ];

  if (!isTimeBased) {
    return null;
  }

  // Return null if no processed results
  if (!processedData) {
    return null;
  }

  if (!rawResults?.hits?.total) {
    return null;
  }

  return (
    <CanvasPanel className="explore-chart-panel">
      <EuiPanel paddingSize="m">
        {/* Header with collapse button, title, and interval selector */}
        <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiButtonIcon
              iconType={isCollapsed ? 'arrowRight' : 'arrowDown'}
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
              size="s"
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiTitle size="s">
              <h4>Request, Errors, and Latency</h4>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem />
          <EuiFlexItem grow={false}>
            <EuiSelect
              options={intervalOptions}
              value={intervalOption}
              onChange={(e) => setIntervalOption(e.target.value)}
              compressed
              prepend="Interval"
            />
          </EuiFlexItem>
        </EuiFlexGroup>

        {/* Collapsible content */}
        {!isCollapsed && (
          <>
            <EuiSpacer size="m" />
            <EuiFlexGroup direction="row" gutterSize="m">
              {/* Request Count Chart */}
              <EuiFlexItem>
                <EuiPanel paddingSize="s" hasShadow={false} hasBorder={false}>
                  <EuiText size="s">
                    <strong>
                      Request {metrics.totalRequests} total ({metrics.requestsPerSecond} req/s)
                    </strong>
                  </EuiText>
                  <EuiSpacer size="s" />
                  <TracesChart
                    data={processedData.requestData}
                    title="Request Count"
                    color="#1f77b4"
                    height={150}
                    chartType="bar"
                    services={services}
                    yAxisLabel="Requests"
                    onBrushEnd={timefilterUpdateHandler}
                  />
                </EuiPanel>
              </EuiFlexItem>

              {/* Error Count Chart */}
              <EuiFlexItem>
                <EuiPanel paddingSize="s" hasShadow={false} hasBorder={false}>
                  <EuiText size="s">
                    <strong>
                      Errors {metrics.totalErrors} total ({metrics.errorPercentage}%)
                    </strong>
                  </EuiText>
                  <EuiSpacer size="s" />
                  <TracesChart
                    data={processedData.errorData}
                    title="Error Count"
                    color="#d62728"
                    height={150}
                    chartType="bar"
                    services={services}
                    yAxisLabel="Errors"
                    onBrushEnd={timefilterUpdateHandler}
                  />
                </EuiPanel>
              </EuiFlexItem>

              {/* Latency Chart */}
              <EuiFlexItem>
                <EuiPanel paddingSize="s" hasShadow={false} hasBorder={false}>
                  <EuiText size="s">
                    <strong>Latency</strong>
                  </EuiText>
                  <EuiSpacer size="s" />
                  <TracesChart
                    data={processedData.latencyData}
                    title="Average Latency"
                    color="#2ca02c"
                    height={150}
                    chartType="line"
                    services={services}
                    yAxisLabel="Latency (ms)"
                    onBrushEnd={timefilterUpdateHandler}
                  />
                </EuiPanel>
              </EuiFlexItem>
            </EuiFlexGroup>
          </>
        )}
      </EuiPanel>
    </CanvasPanel>
  );
};

/**
 * Parse interval string to milliseconds
 * Supports formats like: '1m', '5m', '1h', '1d', 'auto'
 */
function parseIntervalToMs(interval: string): number | null {
  if (interval === 'auto') {
    // Default to 1 minute for auto
    return 60 * 1000;
  }

  const match = interval.match(/^(\d+)([smhd])$/);
  if (!match) {
    return null;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}
