/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Simple data point format for basic time series data
 */
export interface SimpleDataPoint {
  timestamp: string | number;
  value: number;
  [key: string]: any;
}

/**
 * Prometheus-style data format with metric labels and values arrays
 */
export interface PrometheusData {
  resultType?: string;
  result: Array<{
    metric: Record<string, string>;
    values: Array<[number, string]>;
  }>;
}

/**
 * Normalized series data structure for internal chart processing
 */
export interface NormalizedSeries {
  id: string;
  name: string;
  data: Array<{
    x: Date;
    y: number;
  }>;
  color?: string;
  visible: boolean;
}

/**
 * Processed chart data ready for rendering
 */
export interface ChartData {
  series: NormalizedSeries[];
  xAxisLabel: string;
  yAxisLabel: string;
  title: string;
}

/**
 * Main component props interface
 */
export interface GraphVisualizationProps {
  data: GraphTimeseriesDataArgs;
  height?: number;
  showExpandButton?: boolean;
  onExpand?: () => void;
}

/**
 * Complete data structure passed to the GraphVisualization component
 */
export interface GraphTimeseriesDataArgs {
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

/**
 * Error types for chart rendering and data processing
 */
export interface ChartError {
  type: 'data_format' | 'empty_data' | 'render_error' | 'transformation_error';
  message: string;
  details?: any;
}

/**
 * Props for error display component
 */
export interface ErrorDisplayProps {
  error: ChartError;
  onRetry?: () => void;
}

/**
 * Props for chart controls component
 */
export interface ChartControlsProps {
  onExpand?: () => void;
  showExpandButton?: boolean;
  series?: NormalizedSeries[];
  onSeriesToggle?: (seriesId: string) => void;
}

/**
 * Props for expanded view component
 */
export interface ExpandedViewProps {
  isVisible: boolean;
  onClose: () => void;
  chartData: ChartData;
  title?: string;
}

/**
 * Data transformation result
 */
export interface TransformationResult {
  success: boolean;
  data?: ChartData;
  error?: ChartError;
}

/**
 * Chart theme configuration
 */
export interface ChartThemeConfig {
  backgroundColor: string;
  textColor: string;
  gridColor: string;
  axisColor: string;
  seriesColors: string[];
}

/**
 * Chart interaction event data
 */
export interface ChartInteractionEvent {
  type: 'hover' | 'click' | 'zoom' | 'pan';
  data?: {
    seriesId?: string;
    dataIndex?: number;
    value?: number;
    timestamp?: Date;
  };
}

/**
 * Chart configuration options
 */
export interface ChartConfigOptions {
  showTooltip?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
  showLegend?: boolean;
  showGrid?: boolean;
  responsive?: boolean;
  animationDuration?: number;
}
