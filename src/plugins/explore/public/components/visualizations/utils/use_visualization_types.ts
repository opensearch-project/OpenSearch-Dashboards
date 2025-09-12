/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LineChartStyleControls } from '../line/line_vis_config';
import { PieChartStyleControls } from '../pie/pie_vis_config';
import { MetricChartStyleControls } from '../metric/metric_vis_config';
import { HeatmapChartStyleControls } from '../heatmap/heatmap_vis_config';
import { ScatterChartStyleControls } from '../scatter/scatter_vis_config';
import { AreaChartStyleControls } from '../area/area_vis_config';
import { AxisColumnMappings, AxisRole, ChartTypeMapping, VisColumn, VisFieldType } from '../types';
import { visualizationRegistry } from '../visualization_registry';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { BarChartStyleControls } from '../bar/bar_vis_config';
import { UpdateVisualizationProps } from '../visualization_container';
import { TableChartStyleControls } from '../table/table_vis_config';
import { GaugeChartStyleControls } from '../gauge/gauge_vis_config';

export type ChartType =
  | 'line'
  | 'pie'
  | 'metric'
  | 'heatmap'
  | 'scatter'
  | 'bar'
  | 'area'
  | 'table'
  | 'gauge';

export interface ChartStyleControlMap {
  line: LineChartStyleControls;
  pie: PieChartStyleControls;
  metric: MetricChartStyleControls;
  heatmap: HeatmapChartStyleControls;
  scatter: ScatterChartStyleControls;
  bar: BarChartStyleControls;
  area: AreaChartStyleControls;
  table: TableChartStyleControls;
  gauge: GaugeChartStyleControls;
}

export type StyleOptions = ChartStyleControlMap[ChartType];

type AllChartStyleControls =
  | LineChartStyleControls
  | PieChartStyleControls
  | BarChartStyleControls
  | MetricChartStyleControls
  | HeatmapChartStyleControls
  | ScatterChartStyleControls
  | AreaChartStyleControls
  | TableChartStyleControls
  | GaugeChartStyleControls;

export interface StyleControlsProps<T extends AllChartStyleControls> {
  styleOptions: T;
  onStyleChange: (newStyle: Partial<T>) => void;
  numericalColumns?: VisColumn[];
  categoricalColumns?: VisColumn[];
  dateColumns?: VisColumn[];
  availableChartTypes?: ChartTypeMapping[];
  selectedChartType?: string;
  axisColumnMappings: AxisColumnMappings;
  updateVisualization: (data: UpdateVisualizationProps) => void;
}

type ChartTypePossibleMapping = Partial<Record<AxisRole, { type: VisFieldType; index: number }>>;

export interface VisualizationType<T extends ChartType> {
  readonly name: string;
  readonly type: T;
  readonly ui: {
    style: {
      defaults: ChartStyleControlMap[T];
      render: (props: StyleControlsProps<ChartStyleControlMap[T]>) => JSX.Element;
    };
    availableMappings: ChartTypePossibleMapping[];
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
