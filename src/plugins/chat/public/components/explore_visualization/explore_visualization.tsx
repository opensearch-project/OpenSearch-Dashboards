/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import {
  EuiPanel,
  EuiEmptyPrompt,
  EuiText,
  EuiSpacer,
  EuiLoadingChart,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { CoreStart } from 'opensearch-dashboards/public';
import { GraphVisualization } from '../graph_visualization';
import { getReactExpressionRenderer } from '../../services/expressions_services';
import { AddToDashboardButton } from './add_to_dashboard_button';

export interface ExploreVisualizationProps {
  data: any;
  height?: number;
  showExpandButton?: boolean;
  onExpand?: () => void;
}

interface TransformedData {
  timestamps: number[];
  series: Array<{
    name: string;
    data: number[];
    color?: string;
  }>;
}

/**
 * ExploreVisualization component that uses the expression renderer
 * to render visualizations without depending on the explore plugin
 */
export const ExploreVisualization: React.FC<ExploreVisualizationProps> = ({
  data,
  height = 300,
  showExpandButton = true,
  onExpand,
}) => {
  // eslint-disable-next-line no-console
  console.log('🎨 EXPLORE VISUALIZATION PROPS:', {
    dataType: typeof data,
    dataKeys: data ? Object.keys(data) : null,
    height,
    showExpandButton,
  });

  // Transform the data for the visualization
  const transformedData = useMemo(() => {
    if (!data || !data.data) {
      return null;
    }

    try {
      // eslint-disable-next-line no-console
      console.log('🎨 TRANSFORMING DATA FOR VISUALIZATION:', data);

      // Check if data is Prometheus format
      const isPrometheusData = data.data && Array.isArray(data.data.result);

      if (isPrometheusData) {
        // Transform Prometheus data
        const result: TransformedData = {
          timestamps: [],
          series: [],
        };

        // Process each series in the Prometheus data
        data.data.result.forEach((series: any, seriesIndex: number) => {
          const metricName = getMetricName(series.metric);
          const seriesData: number[] = [];
          const timestamps: number[] = [];

          // Process each data point in the series
          series.values.forEach((value: [number, string]) => {
            const timestamp = value[0] * 1000; // Convert to milliseconds
            const numericValue = parseFloat(value[1]);

            timestamps.push(timestamp);
            seriesData.push(numericValue);
          });

          // Add the series data
          result.series.push({
            name: metricName,
            data: seriesData,
            color: getSeriesColor(seriesIndex),
          });

          // If this is the first series, use its timestamps
          if (seriesIndex === 0) {
            result.timestamps = timestamps;
          }
        });

        // eslint-disable-next-line no-console
        console.log('🎨 TRANSFORMED DATA:', result);

        return result;
      } else if (Array.isArray(data.data)) {
        // Handle simple array format
        const timestamps: number[] = [];
        const values: number[] = [];

        data.data.forEach((point: any) => {
          const timestamp =
            typeof point.timestamp === 'number'
              ? point.timestamp
              : new Date(point.timestamp).getTime();

          timestamps.push(timestamp);
          values.push(point.value);
        });

        const result: TransformedData = {
          timestamps,
          series: [
            {
              name: 'Value',
              data: values,
              color: getSeriesColor(0),
            },
          ],
        };

        // eslint-disable-next-line no-console
        console.log('🎨 TRANSFORMED DATA:', result);

        return result;
      }

      return null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('🎨 ERROR TRANSFORMING DATA:', error);
      return null;
    }
  }, [data]);

  // Create the Vega spec for the line chart
  const vegaSpec = useMemo(() => {
    if (!transformedData) {
      return null;
    }

    try {
      // Create a data array with the timestamps and values
      const chartData: Array<Record<string, any>> = [];

      transformedData.timestamps.forEach((timestamp, i) => {
        const dataPoint: Record<string, any> = {
          timestamp: new Date(timestamp),
        };

        // Add each series value for this timestamp
        transformedData.series.forEach((series) => {
          dataPoint[series.name] = series.data[i];
        });

        chartData.push(dataPoint);
      });

      // Create the Vega spec
      const spec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        title: data.title || 'Time Series Chart',
        data: { values: chartData },
        autosize: {
          type: 'fit',
          contains: 'padding',
          resize: true,
        },
        mark: {
          type: 'line',
          point: false,
        },
        encoding: {
          x: {
            field: 'timestamp',
            type: 'temporal',
            title: data.xAxisLabel || 'Time',
            axis: {
              labelAngle: -45,
              format: '%H:%M:%S',
            },
          },
          y: {
            field: transformedData.series.length === 1 ? transformedData.series[0].name : undefined,
            type: 'quantitative',
            title: data.yAxisLabel || 'Value',
          },
          color:
            transformedData.series.length > 1
              ? {
                  field: 'series',
                  type: 'nominal',
                  title: 'Series',
                }
              : undefined,
        },
        config: {
          background: 'transparent',
        },
      };

      // If we have multiple series, we need to transform the data
      if (transformedData.series.length > 1) {
        // Create a different spec for multiple series
        const multiSeriesData: Array<Record<string, any>> = [];

        transformedData.timestamps.forEach((timestamp, i) => {
          transformedData.series.forEach((series) => {
            multiSeriesData.push({
              timestamp: new Date(timestamp),
              value: series.data[i],
              series: series.name,
            });
          });
        });

        spec.data.values = multiSeriesData;
        spec.encoding.y = {
          field: 'value',
          type: 'quantitative',
          title: data.yAxisLabel || 'Value',
        };
      }

      // eslint-disable-next-line no-console
      console.log('🎨 VEGA SPEC:', spec);

      return spec;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('🎨 ERROR CREATING VEGA SPEC:', error);
      return null;
    }
  }, [transformedData, data]);

  // Create the expression for the visualization
  const expression = useMemo(() => {
    if (!vegaSpec) {
      return '';
    }

    try {
      // Create a simple expression string directly
      // This avoids the dependency on the expressions module
      return `opensearchDashboards | vega spec='${JSON.stringify(vegaSpec).replace(/'/g, "\\'")}'`;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('🎨 ERROR CREATING EXPRESSION:', error);
      return '';
    }
  }, [vegaSpec]);

  // If no data, show empty state
  if (!data) {
    return (
      <EuiPanel paddingSize="m" style={{ height }}>
        <EuiEmptyPrompt
          iconType="visLine"
          title={<h4>No data available</h4>}
          body={<p>There is no data to display in the chart.</p>}
        />
      </EuiPanel>
    );
  }

  // If no transformed data or expression, show error state
  if (!transformedData || !expression) {
    return (
      <EuiPanel paddingSize="m" style={{ height }}>
        <EuiEmptyPrompt
          iconType="alert"
          color="danger"
          title={<h4>Error processing data</h4>}
          body={<p>There was an error processing the data for visualization.</p>}
        />
      </EuiPanel>
    );
  }

  // Get the expression renderer from the service
  const ExpressionRenderer = getReactExpressionRenderer();

  // If expression renderer is not available, fall back to GraphVisualization
  if (!ExpressionRenderer) {
    // eslint-disable-next-line no-console
    console.warn('Expression renderer not available, falling back to GraphVisualization');
    return <GraphVisualization data={data} height={height} />;
  }

  return (
    <EuiPanel
      paddingSize="s"
      style={{
        height,
        minHeight: '550px',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Chart title and actions */}
      <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
        <EuiFlexItem>
          {data.title && (
            <EuiText size="s">
              <strong>{data.title}</strong>
            </EuiText>
          )}
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <AddToDashboardButton visualizationData={data} />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="s" />

      {/* Render the visualization */}
      <div
        style={{
          height: 'calc(100% - 40px)',
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden',
        }}
      >
        <ExpressionRenderer
          expression={expression}
          renderError={(message, error) => (
            <EuiEmptyPrompt
              iconType="alert"
              color="danger"
              title={<h4>Rendering error</h4>}
              body={<p>{message || (error && error.message) || 'Unknown error'}</p>}
            />
          )}
        />
      </div>
    </EuiPanel>
  );
};

/**
 * Helper function to get a readable name from Prometheus metric labels
 */
function getMetricName(metric: Record<string, string>): string {
  if (!metric) {
    return 'Value';
  }

  // Common label priorities for naming
  const priorityLabels = ['__name__', 'job', 'instance', 'service', 'app', 'name'];

  for (const label of priorityLabels) {
    if (metric[label]) {
      return metric[label];
    }
  }

  // If no priority labels found, use the first available label
  const firstKey = Object.keys(metric)[0];
  return metric[firstKey] || 'Value';
}

/**
 * Helper function to get a color for a series based on its index
 */
function getSeriesColor(index: number): string {
  const colors = [
    '#1F77B4', // Blue
    '#FF7F0E', // Orange
    '#2CA02C', // Green
    '#D62728', // Red
    '#9467BD', // Purple
    '#8C564B', // Brown
    '#E377C2', // Pink
    '#7F7F7F', // Gray
    '#BCBD22', // Yellow-green
    '#17BECF', // Cyan
  ];

  return colors[index % colors.length];
}
