/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback, ErrorInfo } from 'react';
import {
  EuiPanel,
  EuiText,
  EuiSpacer,
  EuiEmptyPrompt,
  EuiLoadingChart,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCallOut,
  EuiButton,
} from '@elastic/eui';
import { Chart, LineSeries, Axis, Settings, Position, ScaleType } from '@elastic/charts';

// Import utility functions and sub-components
import { GraphVisualizationProps, ChartError } from './graph_visualization/types';
import { transformGraphData, getDataStatistics } from './graph_visualization/data_transformer';
import {
  useChartsTheme,
  useChartsBaseTheme,
  getGraphVisualizationTheme,
} from './graph_visualization/theme_utils';
import {
  createTooltipSettings,
  optimizeSettingsForDataSize,
  PERFORMANCE_SETTINGS,
  DEFAULT_CHART_SETTINGS,
} from './graph_visualization/chart_config';
import { ChartControls } from './graph_visualization/chart_controls';
import { ExpandedView } from './graph_visualization/expanded_view';

/**
 * Error boundary component for graceful error handling
 */
class GraphVisualizationErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error, errorInfo: ErrorInfo) => void },
  { hasError: boolean; error?: Error }
> {
  private _isMounted = false;

  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // GraphVisualization Error caught
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    if (this._isMounted) {
      this.setState({ hasError: false, error: undefined });
    }
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Unknown error occurred';
      const isDataError =
        errorMessage.toLowerCase().includes('data') ||
        errorMessage.toLowerCase().includes('format') ||
        errorMessage.toLowerCase().includes('parse');

      return (
        <EuiEmptyPrompt
          iconType="alert"
          color="danger"
          title={<h3>Chart rendering failed</h3>}
          body={
            <div>
              <p>
                {isDataError
                  ? 'There was an issue with the chart data format. Please check that the data is properly formatted.'
                  : 'An error occurred while rendering the chart. This may be due to browser compatibility or data complexity.'}
              </p>
              {errorMessage && (
                <EuiCallOut title="Error details" color="danger" iconType="alert" size="s">
                  <p style={{ fontSize: '12px', fontFamily: 'monospace' }}>{errorMessage}</p>
                </EuiCallOut>
              )}
            </div>
          }
          actions={
            <EuiButton color="primary" fill onClick={this.handleRetry}>
              Try again
            </EuiButton>
          }
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Error display component for data and transformation errors
 */
const ErrorDisplay: React.FC<{ error: ChartError; onRetry?: () => void }> = ({
  error,
  onRetry,
}) => {
  const getErrorIcon = () => {
    switch (error.type) {
      case 'empty_data':
        return 'empty';
      case 'data_format':
        return 'alert';
      case 'transformation_error':
        return 'warning';
      default:
        return 'alert';
    }
  };

  const getErrorTitle = () => {
    switch (error.type) {
      case 'empty_data':
        return 'No data to display';
      case 'data_format':
        return 'Invalid data format';
      case 'transformation_error':
        return 'Data processing error';
      default:
        return 'Chart error';
    }
  };

  return (
    <EuiEmptyPrompt
      iconType={getErrorIcon()}
      color="subdued"
      title={<h4>{getErrorTitle()}</h4>}
      body={<p>{error.message}</p>}
      actions={
        onRetry ? (
          <EuiButton size="s" onClick={onRetry}>
            Retry
          </EuiButton>
        ) : undefined
      }
    />
  );
};

/**
 * Loading component for chart initialization
 */
const LoadingDisplay: React.FC = () => (
  <EuiFlexGroup justifyContent="center" alignItems="center" style={{ minHeight: '200px' }}>
    <EuiFlexItem grow={false}>
      <EuiLoadingChart size="l" />
    </EuiFlexItem>
    <EuiFlexItem grow={false}>
      <EuiText size="s" color="subdued">
        Loading chart...
      </EuiText>
    </EuiFlexItem>
  </EuiFlexGroup>
);

/**
 * Main GraphVisualization component
 */
export const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  data,
  height = 300,
  showExpandButton = true,
  onExpand,
}) => {
  // State management
  const [isExpanded, setIsExpanded] = useState(false);
  const [seriesVisibility, setSeriesVisibility] = useState<Record<string, boolean>>({});
  // @ts-expect-error TS6133 TODO(ts-error): fixme
  const [retryCount, setRetryCount] = useState(0);

  // Theme hooks
  const chartsTheme = useChartsTheme();
  const chartsBaseTheme = useChartsBaseTheme();
  const graphTheme = getGraphVisualizationTheme();

  // Transform and validate data
  const transformationResult = useMemo(() => {
    try {
      const result = transformGraphData(data);
      return result;
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'transformation_error' as const,
          message: 'Unexpected error during data transformation',
          details: { error: error instanceof Error ? error.message : String(error) },
        },
      };
    }
  }, [data]);

  const isLoading = !transformationResult;

  // Initialize series visibility when data changes
  const chartData = useMemo(() => {
    if (!transformationResult.success || !transformationResult.data) {
      return null;
    }

    const transformedData = transformationResult.data;

    // Initialize visibility state for new series
    const newVisibility: Record<string, boolean> = {};
    transformedData.series.forEach((series) => {
      newVisibility[series.id] = seriesVisibility[series.id] ?? true;
    });

    if (JSON.stringify(newVisibility) !== JSON.stringify(seriesVisibility)) {
      setSeriesVisibility(newVisibility);
    }

    // Apply visibility to series data
    const visibleSeries = transformedData.series.map((series) => ({
      ...series,
      visible: newVisibility[series.id] ?? true,
    }));

    return {
      ...transformedData,
      series: visibleSeries,
    };
  }, [transformationResult, seriesVisibility]);

  // Get data statistics for performance optimization
  const dataStats = useMemo(() => {
    if (!chartData) return null;
    return getDataStatistics(chartData.series);
  }, [chartData]);

  // Optimize chart settings based on data size
  const optimizedSettings = useMemo(() => {
    if (!dataStats) return DEFAULT_CHART_SETTINGS;

    const baseSettings = {
      ...DEFAULT_CHART_SETTINGS,
      showLegend: (chartData?.series?.length ?? 0) > 1,
    };

    return optimizeSettingsForDataSize(dataStats.totalDataPoints, baseSettings);
  }, [dataStats, chartData]);

  // Event handlers
  const handleSeriesToggle = useCallback((seriesId: string) => {
    setSeriesVisibility((prev) => ({
      ...prev,
      [seriesId]: !prev[seriesId],
    }));
  }, []);

  const handleExpand = useCallback(() => {
    if (onExpand) {
      onExpand();
    }
    setIsExpanded(true);
  }, [onExpand]);

  const handleExpandedClose = useCallback(() => {
    setIsExpanded(false);
  }, []);

  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
  }, []);

  const handleRenderError = useCallback((error: Error, errorInfo: ErrorInfo) => {
    // Error is already caught by GraphVisualizationErrorBoundary and will be displayed in UI
    // This callback can be used for additional error reporting if needed
  }, []);

  // Tooltip settings
  const tooltipSettings = useMemo(() => {
    return createTooltipSettings({
      showTimestamp: true,
      timestampFormat: 'YYYY-MM-DD HH:mm:ss',
      showSeriesName: (chartData?.series?.length ?? 0) > 1,
      valueFormatter: (value: number) => {
        if (Math.abs(value) >= 1000000) {
          return `${(value / 1000000).toFixed(2)}M`;
        } else if (Math.abs(value) >= 1000) {
          return `${(value / 1000).toFixed(2)}K`;
        } else if (Math.abs(value) < 1 && value !== 0) {
          return value.toFixed(4);
        } else {
          return value.toFixed(2);
        }
      },
    });
  }, [chartData]);

  // Render loading state
  if (isLoading) {
    return (
      <EuiPanel paddingSize="m" style={{ height }}>
        <LoadingDisplay />
      </EuiPanel>
    );
  }

  // Render error state
  if (!transformationResult.success) {
    return (
      <EuiPanel paddingSize="m" style={{ height }}>
        <ErrorDisplay error={transformationResult.error!} onRetry={handleRetry} />
      </EuiPanel>
    );
  }

  if (!chartData || chartData.series.length === 0) {
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

  // Check if all series are hidden
  const visibleSeriesCount = chartData.series.filter((s) => s.visible).length;

  if (visibleSeriesCount === 0) {
    return (
      <EuiPanel paddingSize="m" style={{ height }}>
        <EuiEmptyPrompt
          iconType="eyeClosed"
          title={<h4>All series hidden</h4>}
          body={<p>All data series are currently hidden. Use the legend controls to show data.</p>}
        />
      </EuiPanel>
    );
  }

  // Performance warning for large datasets
  const showPerformanceWarning =
    dataStats && dataStats.totalDataPoints > PERFORMANCE_SETTINGS.MAX_DATA_POINTS;

  return (
    <GraphVisualizationErrorBoundary onError={handleRenderError}>
      <EuiPanel
        paddingSize="s"
        style={{ height, minHeight: '550px', width: '100%', boxSizing: 'border-box' }}
      >
        {/* Chart title and controls */}
        <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" gutterSize="s">
          <EuiFlexItem>
            {chartData.title && (
              <EuiText size="s">
                <strong>{chartData.title}</strong>
              </EuiText>
            )}
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <ChartControls
              onExpand={handleExpand}
              showExpandButton={showExpandButton}
              series={chartData.series}
              onSeriesToggle={handleSeriesToggle}
            />
          </EuiFlexItem>
        </EuiFlexGroup>

        {/* Performance warning */}
        {showPerformanceWarning && (
          <>
            <EuiSpacer size="xs" />
            <EuiCallOut title="Large dataset detected" color="warning" iconType="alert" size="s">
              <p>
                This chart contains {dataStats?.totalDataPoints} data points. Performance
                optimizations have been applied.
              </p>
            </EuiCallOut>
          </>
        )}

        <EuiSpacer size="s" />

        {/* Main chart */}
        <div style={{ height: '500px', width: '100%', minWidth: '300px', maxWidth: '100%' }}>
          {/* @ts-expect-error TS2322 TODO(ts-error): fixme */}
          <Chart size={{ width: '100%', height: '500px' }}>
            <Settings
              showLegend={optimizedSettings.showLegend}
              tooltip={tooltipSettings}
              theme={[chartsTheme, graphTheme]}
              baseTheme={chartsBaseTheme}
            />

            <Axis
              id="bottom"
              position={Position.Bottom}
              title={chartData.xAxisLabel}
              showOverlappingTicks={false}
              gridLine={{ visible: false }}
              ticks={5}
              tickFormat={(value) => {
                const date = new Date(value);
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              }}
              style={{
                tickLabel: {
                  fontSize: 11,
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                },
              }}
            />

            {(() => {
              // Calculate Y-axis domain from actual data
              const allYValues = chartData.series
                .filter((s) => s.visible)
                .flatMap((s) => s.data.map((d) => d.y))
                .filter((y) => y !== null && y !== undefined && !isNaN(y));

              const minY = Math.min(...allYValues);
              const maxY = Math.max(...allYValues);
              const padding = (maxY - minY) * 0.1;
              const yDomain = {
                min: Math.max(0, minY - padding),
                max: maxY + padding,
              };

              return (
                <Axis
                  id="left"
                  title={chartData.yAxisLabel}
                  position={Position.Left}
                  domain={yDomain}
                  gridLine={{
                    visible: true,
                    stroke: '#E5E5E5',
                    strokeWidth: 1,
                    opacity: 0.5,
                  }}
                  tickFormat={(value) => {
                    if (typeof value === 'number') {
                      // Format small numbers with more precision
                      if (Math.abs(value) < 0.01) {
                        return value.toFixed(4);
                      } else if (Math.abs(value) < 1) {
                        return value.toFixed(3);
                      } else if (Math.abs(value) >= 1000000) {
                        return `${(value / 1000000).toFixed(1)}M`;
                      } else if (Math.abs(value) >= 1000) {
                        return `${(value / 1000).toFixed(1)}K`;
                      } else {
                        return value.toFixed(2);
                      }
                    }
                    return String(value);
                  }}
                />
              );
            })()}

            {chartData.series
              .filter((series) => series.visible)
              .map((series) => {
                // Convert Date objects to timestamps for Elastic Charts
                const seriesData = series.data.map((point) => ({
                  x: point.x instanceof Date ? point.x.getTime() : point.x,
                  y: point.y,
                }));

                return (
                  <LineSeries
                    key={series.id}
                    id={series.id}
                    name={series.name}
                    xScaleType={ScaleType.Time}
                    yScaleType={ScaleType.Linear}
                    xAccessor="x"
                    yAccessors={['y']}
                    data={seriesData}
                    color={series.color}
                    lineSeriesStyle={{
                      line: {
                        strokeWidth: 2,
                      },
                      point: {
                        radius: 3,
                        strokeWidth: 1,
                        visible: false,
                      },
                    }}
                  />
                );
              })}
          </Chart>
        </div>

        {/* Expanded view modal */}
        <ExpandedView
          isOpen={isExpanded}
          onClose={handleExpandedClose}
          chartData={chartData}
          title={data.title}
        />
      </EuiPanel>
    </GraphVisualizationErrorBoundary>
  );
};
