/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactNode } from 'react';

import { LineChartStyle, LineChartStyleOptions } from '../line/line_vis_config';
import { PieChartStyle, PieChartStyleOptions } from '../pie/pie_vis_config';
import { MetricChartStyle, MetricChartStyleOptions } from '../metric/metric_vis_config';
import { HeatmapChartStyle, HeatmapChartStyleOptions } from '../heatmap/heatmap_vis_config';
import { ScatterChartStyle, ScatterChartStyleOptions } from '../scatter/scatter_vis_config';
import { AreaChartStyle, AreaChartStyleOptions } from '../area/area_vis_config';
import { AxisColumnMappings, AxisRole, VisColumn, VisFieldType } from '../types';
import { visualizationRegistry } from '../visualization_registry';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { BarChartStyle, BarChartStyleOptions } from '../bar/bar_vis_config';
import { UpdateVisualizationProps } from '../visualization_container';
import { TableChartStyle, TableChartStyleOptions } from '../table/table_vis_config';
import { GaugeChartStyle, GaugeChartStyleOptions } from '../gauge/gauge_vis_config';
import {
  StateTimeLineChartStyle,
  StateTimeLineChartStyleOptions,
} from '../state_timeline/state_timeline_config';
import { BarGaugeChartStyle, BarGaugeChartStyleOptions } from '../bar_gauge/bar_gauge_vis_config';
import { HistogramChartStyle, HistogramChartStyleOptions } from '../histogram/histogram_vis_config';
import { TimeRange } from '../../../../../data/public';

export type ChartType =
  | 'line'
  | 'pie'
  | 'metric'
  | 'heatmap'
  | 'scatter'
  | 'bar'
  | 'area'
  | 'table'
  | 'gauge'
  | 'state_timeline'
  | 'bar_gauge'
  | 'histogram';

export interface ChartStylesMapping {
  line: LineChartStyle;
  pie: PieChartStyle;
  metric: MetricChartStyle;
  heatmap: HeatmapChartStyle;
  scatter: ScatterChartStyle;
  bar: BarChartStyle;
  area: AreaChartStyle;
  table: TableChartStyle;
  gauge: GaugeChartStyle;
  state_timeline: StateTimeLineChartStyle;
  bar_gauge: BarGaugeChartStyle;
  histogram: HistogramChartStyle;
}

export type StyleOptions =
  | LineChartStyleOptions
  | PieChartStyleOptions
  | BarChartStyleOptions
  | MetricChartStyleOptions
  | HeatmapChartStyleOptions
  | ScatterChartStyleOptions
  | AreaChartStyleOptions
  | TableChartStyleOptions
  | GaugeChartStyleOptions
  | StateTimeLineChartStyleOptions
  | BarGaugeChartStyleOptions
  | HistogramChartStyleOptions;

export type ChartStyles = ChartStylesMapping[ChartType];

export interface StyleControlsProps<T extends ChartStyles> {
  styleOptions: T;
  onStyleChange: (newStyle: Partial<T>) => void;
  numericalColumns?: VisColumn[];
  categoricalColumns?: VisColumn[];
  dateColumns?: VisColumn[];
  axisColumnMappings: AxisColumnMappings;
  updateVisualization: (data: UpdateVisualizationProps) => void;
}

interface VisRenderProps<T extends ChartType> {
  transformedData: Array<Record<string, any>>;
  styleOptions: ChartStylesMapping[T];
  axisColumnMappings: AxisColumnMappings;
  timeRange?: { from: string; to: string };
  onSelectTimeRange?: (timeRange: TimeRange) => void;
}

export type AxisTypeMapping = Partial<Record<AxisRole, { type: VisFieldType }>>;

export interface VisRule<T extends ChartType> {
  priority: number;
  mappings: AxisTypeMapping[];
  render: (props: VisRenderProps<T>) => any;
}

export interface VisualizationType<T extends ChartType> {
  readonly name: string;
  readonly type: T;
  readonly icon?: string;
  readonly getRules: () => Array<VisRule<T>>;
  readonly ui: {
    style: {
      defaults: ChartStylesMapping[T];
      render: (props: StyleControlsProps<ChartStylesMapping[T]>) => JSX.Element;
    };
  };
}

/**
 * Hook to get the visualization registry from the service
 */
export const useVisualizationRegistry = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();

  // If the service is available, use it, otherwise fall back to the singleton
  return services.visualizationRegistry?.getRegistry() || visualizationRegistry;
};
