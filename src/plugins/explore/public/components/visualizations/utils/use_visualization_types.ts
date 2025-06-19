/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LineChartStyleControls } from '../line/line_vis_config';
import { PieChartStyleControls } from '../pie/pie_vis_config';
import { MetricChartStyleControls } from '../metric/metric_vis_config';
import { HeatmapChartStyleControls } from '../heatmap/heatmap_vis_config';
import { ScatterChartStyleControls } from '../scatter/scatter_vis_config';
import { IFieldType } from '../../../application/legacy/discover/opensearch_dashboards_services';
import { OpenSearchSearchHit } from '../../../types/doc_views_types';

import { OPENSEARCH_FIELD_TYPES, OSD_FIELD_TYPES } from '../../../../../data/common';
import { ChartTypeMapping, VisColumn, VisFieldType } from '../types';
import { visualizationRegistry } from '../visualization_registry';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { BarChartStyleControls } from '../bar/bar_vis_config';

export type ChartType = 'line' | 'pie' | 'metric' | 'heatmap' | 'scatter' | 'bar';

export interface ChartStyleControlMap {
  line: LineChartStyleControls;
  pie: PieChartStyleControls;
  metric: MetricChartStyleControls;
  heatmap: HeatmapChartStyleControls;
  scatter: ScatterChartStyleControls;
  bar: BarChartStyleControls;
}

export type AllChartStyleControls =
  | LineChartStyleControls
  | PieChartStyleControls
  | BarChartStyleControls
  | MetricChartStyleControls
  | HeatmapChartStyleControls
  | ScatterChartStyleControls;

export interface StyleControlsProps<T extends AllChartStyleControls> {
  styleOptions: T;
  onStyleChange: (newStyle: Partial<T>) => void;
  numericalColumns?: VisColumn[];
  categoricalColumns?: VisColumn[];
  dateColumns?: VisColumn[];
}

export interface VisualizationType<T extends ChartType> {
  readonly name: string;
  readonly type: T;
  readonly ui: {
    style: {
      defaults: ChartStyleControlMap[T];
      render: (props: StyleControlsProps<ChartStyleControlMap[T]>) => JSX.Element;
    };
  };
}

// Map both OSD_FIELD_TYPES and OPENSEARCH_FIELD_TYPES to VisFieldType
// We also need to handle the case where a new field is created with a opensearch type
const FIELD_TYPE_MAP: Partial<Record<string, VisFieldType>> = {
  // Map OSD_FIELD_TYPES to VisFieldType
  [OSD_FIELD_TYPES.BOOLEAN]: VisFieldType.Categorical,
  [OSD_FIELD_TYPES.DATE]: VisFieldType.Date,
  [OSD_FIELD_TYPES.NUMBER]: VisFieldType.Numerical,
  [OSD_FIELD_TYPES.STRING]: VisFieldType.Categorical,
  [OSD_FIELD_TYPES.OBJECT]: VisFieldType.Unknown,
  [OSD_FIELD_TYPES.NESTED]: VisFieldType.Unknown,
  [OSD_FIELD_TYPES.HISTOGRAM]: VisFieldType.Numerical,
  [OSD_FIELD_TYPES.UNKNOWN]: VisFieldType.Unknown,

  // Map the rest of OPENSEARCH_FIELD_TYPES to VisFieldType
  [OPENSEARCH_FIELD_TYPES.DATE_NANOS]: VisFieldType.Date,
  [OPENSEARCH_FIELD_TYPES.FLOAT]: VisFieldType.Numerical,
  [OPENSEARCH_FIELD_TYPES.HALF_FLOAT]: VisFieldType.Numerical,
  [OPENSEARCH_FIELD_TYPES.SCALED_FLOAT]: VisFieldType.Numerical,
  [OPENSEARCH_FIELD_TYPES.DOUBLE]: VisFieldType.Numerical,
  [OPENSEARCH_FIELD_TYPES.INTEGER]: VisFieldType.Numerical,
  [OPENSEARCH_FIELD_TYPES.INT]: VisFieldType.Numerical,
  [OPENSEARCH_FIELD_TYPES.LONG]: VisFieldType.Numerical,
  [OPENSEARCH_FIELD_TYPES.SHORT]: VisFieldType.Numerical,
  [OPENSEARCH_FIELD_TYPES.UNSIGNED_LONG]: VisFieldType.Numerical,
  [OPENSEARCH_FIELD_TYPES.TEXT]: VisFieldType.Categorical,
  [OPENSEARCH_FIELD_TYPES.KEYWORD]: VisFieldType.Categorical,
  [OPENSEARCH_FIELD_TYPES.WILDCARD]: VisFieldType.Categorical,
};

export interface VisualizationTypeResult<T extends ChartType> {
  visualizationType?: VisualizationType<T>;
  numericalColumns?: VisColumn[];
  categoricalColumns?: VisColumn[];
  dateColumns?: VisColumn[];
  ruleId?: string;
  availableChartTypes?: ChartTypeMapping[];
  transformedData?: Array<Record<string, any>>;
  toExpression?: (
    transformedData: Array<Record<string, any>>,
    numericalColumns: VisColumn[],
    categoricalColumns: VisColumn[],
    dateColumns: VisColumn[],
    styleOptions: any,
    chartType?: string
  ) => any;
}

const getFieldTypeFromSchema = (schema?: string): VisFieldType =>
  FIELD_TYPE_MAP[schema || ''] || VisFieldType.Unknown;

// Implement this function to return the visualization type based on the query based on the returned data
export const getVisualizationType = <T = unknown>(
  rows?: Array<OpenSearchSearchHit<T>>,
  fieldSchema?: Array<Partial<IFieldType>>,
  registry = visualizationRegistry
) => {
  if (!fieldSchema || !rows) {
    return;
  }

  const columns: VisColumn[] = fieldSchema.map((field, index) => {
    return {
      id: index,
      schema: getFieldTypeFromSchema(field.type),
      name: field.name || '',
      column: `field-${index}`,
      validValuesCount: 0,
      uniqueValuesCount: 0,
    };
  });
  const transformedData = rows.map((row: OpenSearchSearchHit) => {
    const transformedRow: Record<string, any> = {};
    for (const column of columns) {
      // Type assertion for _source since it's marked as unknown
      const source = row._source as Record<string, any>;
      transformedRow[column.column] = source[column.name];
    }
    return transformedRow;
  });

  // count validValues and uniqueValues
  const fieldStats = columns.map((column) => {
    const values = transformedData.map((row) => row[column.column]);
    const validValues = values.filter((v) => v !== null && v !== undefined);
    const uniqueValues = new Set(validValues);
    return {
      ...column,
      validValuesCount: validValues.length ?? 0,
      uniqueValuesCount: uniqueValues.size ?? 0,
    };
  });

  return {
    ...registry.getVisualizationType(fieldStats),
    transformedData,
  };
};

/**
 * Hook to get the visualization registry from the service
 */
export const useVisualizationRegistry = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();

  // If the service is available, use it, otherwise fall back to the singleton
  return services.visualizationRegistry?.getRegistry() || visualizationRegistry;
};
