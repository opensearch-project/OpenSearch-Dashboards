/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Positions {
  RIGHT = 'right',
  LEFT = 'left',
  TOP = 'top',
  BOTTOM = 'bottom',
}
export interface ChartTypeMapping {
  type: string;
  priority: number; // Higher number means higher priority for rule matching
  name: string;
}

export interface VisualizationRule {
  id: string; // Unique rule identifier
  name: string;
  description?: string;
  matches: (
    numericalColumns: VisColumn[],
    categoricalColumns: VisColumn[],
    dateColumns: VisColumn[]
  ) => boolean;
  chartTypes: ChartTypeMapping[]; // Each rule can map to multiple chart types with priorities
  toExpression?: (
    transformedData: Array<Record<string, any>>,
    numericalColumns: VisColumn[],
    categoricalColumns: VisColumn[],
    dateColumns: VisColumn[],
    styleOptions: any,
    chartType?: string
  ) => any;
}
export interface VisColumn {
  id: number;
  name: string;
  schema: VisFieldType;
  column: string;
  validValuesCount: number;
  uniqueValuesCount: number;
}

export enum VisFieldType {
  Numerical = 'numerical',
  Categorical = 'categorical',
  Date = 'date',
  Unknown = 'unknown',
}

export enum ThresholdLineStyle {
  Full = 'full',
  Dashed = 'dashed',
  DotDashed = 'dot-dashed',
}

// Styling: Threshold line configuration
export interface ThresholdLine {
  color: string;
  show: boolean;
  style: ThresholdLineStyle;
  value: number;
  width: number;
}

// Styling: Grid configuration
export interface GridOptions {
  categoryLines: boolean;
  valueLines: boolean;
}

// Styling: Axis label configuration
export interface AxisLabels {
  show: boolean;
  filter: boolean;
  rotate: number;
  truncate: number;
}

// Styling: Axis title configuration
export interface AxisTitle {
  text?: string;
}

// Styling: Category axis configuration
export interface CategoryAxis {
  id: string;
  type: 'category';
  position: Positions.TOP | Positions.BOTTOM;
  show: boolean;
  labels: AxisLabels;
  title: AxisTitle;
}

// Styling: Value axis configuration
export interface ValueAxis {
  id: string;
  name: string;
  type: 'value';
  position: Positions.LEFT | Positions.RIGHT;
  show: boolean;
  labels: AxisLabels;
  title: AxisTitle;
}

export interface FieldSetting {
  default: VisColumn;
  options?: VisColumn[];
}

export enum AxisRole {
  X = 'x',
  Y = 'y',
}

// for heatmap the axies can serve as value axis or category axis in 2 scienrios

export interface Grid {
  showLines: boolean;
}

export interface StandardAxes {
  id: string;
  name?: string;
  field?: FieldSetting;
  type?: 'value' | 'category';
  position: Positions;
  show: boolean;
  style: Record<string, any>;
  labels: AxisLabels;
  title: AxisTitle;
  grid: Grid;
  axisRole: AxisRole;
}

export enum ScaleType {
  LINEAR = 'linear',
  LOG = 'log',
  SQRT = 'sqrt',
}

export enum PointShape {
  CIRCLE = 'circle',
  SQUARE = 'square',
  CROSS = 'cross',
  DIAMOND = 'diamond',
}

export enum ColorSchemas {
  BLUES = 'blues',
  GREENS = 'greens',
  GREYS = 'greys',
  REDS = 'reds',
  YELLOWORANGE = 'yelloworangered',
  GREENBLUE = 'greenblue',
}

export interface RangeValue {
  min?: number;
  max?: number;
}

export enum LabelAggregationType {
  SUM = 'sum',
  MEAN = 'mean',
  MAX = 'max',
  MIN = 'min',
  NONE = 'none',
}

export const VEGASCHEMA = 'https://vega.github.io/schema/vega-lite/v5.json';
