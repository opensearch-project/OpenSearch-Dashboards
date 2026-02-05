/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPanel, EuiText, EuiSpacer, EuiCode, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { useAssistantAction } from '../../../context_provider/public';
import { GraphVisualization } from '../components/graph_visualization';

// Support both simple and Prometheus-style data formats
interface SimpleDataPoint {
  timestamp: string | number;
  value: number;
  [key: string]: any;
}

interface PrometheusData {
  resultType?: string;
  result: Array<{
    metric: Record<string, string>;
    values: Array<[number, string]>;
  }>;
}

interface GraphTimeseriesDataArgs {
  data: PrometheusData | SimpleDataPoint[];
  title?: string;
  query?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  description?: string;
  metadata?: {
    timestamp?: number;
    source?: string;
    start_time?: string;
    end_time?: string;
    step?: string;
  };
}

export function useGraphTimeseriesDataAction(enabled: boolean = true) {
  useAssistantAction<GraphTimeseriesDataArgs>({
    name: 'graph_timeseries_data',
    description: 'Create a timeseries graph visualization from provided data',
    parameters: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          description: 'Timeseries data in Prometheus format or simple array format',
        },
        query: {
          type: 'string',
          description: 'Optional query used to generate this data',
        },
        title: {
          type: 'string',
          description: 'Optional title for the graph',
        },
        xAxisLabel: {
          type: 'string',
          description: 'Optional label for the X-axis',
        },
        yAxisLabel: {
          type: 'string',
          description: 'Optional label for the Y-axis',
        },
        description: {
          type: 'string',
          description: 'Optional description of what the graph shows',
        },
        metadata: {
          type: 'object',
          description: 'Optional metadata about the data source and generation',
          properties: {
            timestamp: {
              type: 'number',
              description: 'Unix timestamp when data was generated',
            },
            source: {
              type: 'string',
              description: 'Data source name',
            },
            start_time: {
              type: 'string',
              description: 'Start time of the data range',
            },
            end_time: {
              type: 'string',
              description: 'End time of the data range',
            },
            step: {
              type: 'string',
              description: 'Step interval for the data',
            },
          },
        },
      },
      required: ['data'],
    },
    handler: async (args) => {
      try {
        // Check if data is Prometheus format
        const isPrometheusData = (data: any): data is PrometheusData => {
          return data && Array.isArray(data.result);
        };

        let dataPointCount = 0;

        if (isPrometheusData(args.data)) {
          // Validate Prometheus-style data
          if (!args.data.result || args.data.result.length === 0) {
            throw new Error('Prometheus data must have a non-empty result array');
          }

          // Count total data points across all series
          dataPointCount = args.data.result.reduce((total, series) => {
            return total + (series.values?.length || 0);
          }, 0);

          if (dataPointCount === 0) {
            throw new Error('No data points found in Prometheus result');
          }
        } else if (Array.isArray(args.data)) {
          // Validate simple array format
          if (args.data.length === 0) {
            throw new Error('Data must be a non-empty array');
          }

          // Validate each data point
          for (const point of args.data) {
            if (!point.hasOwnProperty('timestamp') || !point.hasOwnProperty('value')) {
              throw new Error('Each data point must have timestamp and value properties');
            }
            if (typeof point.value !== 'number') {
              throw new Error('Value must be a number');
            }
          }

          dataPointCount = args.data.length;
        } else {
          throw new Error(
            'Data must be either an array of data points or Prometheus-style data with result array'
          );
        }

        const result = {
          success: true,
          dataPoints: dataPointCount,
          title: args.title || 'Timeseries Graph',
          message: `Successfully created timeseries graph with ${dataPointCount} data points`,
          graphData: args, // Pass the full args to the render function
        };

        return result;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          dataPoints: 0,
        };
      }
    },
    render: ({ status, args, result }) => {
      if (!args) {
        return null;
      }

      const getStatusColor = () => {
        if (status === 'failed' || (result && !result.success)) return 'danger';
        if (status === 'complete' && result?.success) return 'success';
        return 'subdued';
      };

      const getStatusIcon = () => {
        if (status === 'failed' || (result && !result.success)) return '✗';
        if (status === 'executing') return '⟳';
        return '📊';
      };

      return (
        <EuiPanel paddingSize="s" color={getStatusColor()}>
          <EuiFlexGroup alignItems="center" gutterSize="s">
            <EuiFlexItem grow={false}>
              <EuiText size="s">
                <strong>{getStatusIcon()}</strong>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiText size="s">
                {status === 'executing' && 'Creating timeseries graph...'}
                {status === 'complete' && result?.message}
                {status === 'failed' && (result?.error || 'Failed to create graph')}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>

          {args.title && (
            <>
              <EuiSpacer size="xs" />
              <EuiText size="s">
                <strong>Title:</strong> {args.title}
              </EuiText>
            </>
          )}

          {args.query && (
            <>
              <EuiSpacer size="xs" />
              <EuiText size="xs">
                <strong>Query:</strong>
              </EuiText>
              {/* @ts-expect-error TS2322 TODO(ts-error): fixme */}
              <EuiCode language="promql" fontSize="xs" paddingSize="xs">
                {args.query}
              </EuiCode>
            </>
          )}

          {args.description && (
            <>
              <EuiSpacer size="xs" />
              <EuiText size="xs" color="subdued">
                {args.description}
              </EuiText>
            </>
          )}

          <EuiSpacer size="xs" />
          <EuiText size="xs">
            <EuiCode transparentBackground>
              Data points: {result?.dataPoints || 0}
              {args.xAxisLabel && ` | X-axis: ${args.xAxisLabel}`}
              {args.yAxisLabel && ` | Y-axis: ${args.yAxisLabel}`}
            </EuiCode>
          </EuiText>

          {/* Render the actual graph visualization */}
          {status === 'complete' && result?.success && result?.graphData && (
            <>
              <EuiSpacer size="s" />
              <GraphVisualization data={result.graphData} />
            </>
          )}
        </EuiPanel>
      );
    },
    enabled,
  });
}
