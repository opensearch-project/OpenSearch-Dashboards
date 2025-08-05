/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChartStyleControlMap } from '../visualizations/utils/use_visualization_types';

type AxisSupportedChartTypes = 'bar' | 'scatter' | 'heatmap';
export type AxisSupportedStyles = ChartStyleControlMap[AxisSupportedChartTypes];
export interface CompleteAxisWithStyle extends Partial<VisColumn> {
  styles: StandardAxes;
}

export enum Positions {
  RIGHT = 'right',
  LEFT = 'left',
  TOP = 'top',
  BOTTOM = 'bottom',
}
export interface ChartMetadata {
  type: string;
  name: string;
  icon: string;
}

export interface ChartTypeMapping extends ChartMetadata {
  priority: number; // Higher number means higher priority for rule matching
}

export type AxisColumnMappings = Partial<Record<AxisRole, VisColumn>>;

export interface VisualizationRule {
  id: string; // Unique rule identifier
  name: string;
  description?: string;
  matches: (
    numericalColumns: VisColumn[],
    categoricalColumns: VisColumn[],
    dateColumns: VisColumn[]
  ) => boolean;
  matchIndex: number[];
  chartTypes: ChartTypeMapping[]; // Each rule can map to multiple chart types with priorities
  // TODO: rename it, the name is inappropriate, it doesn't create expression
  toExpression?: (
    transformedData: Array<Record<string, any>>,
    numericalColumns: VisColumn[],
    categoricalColumns: VisColumn[],
    dateColumns: VisColumn[],
    styleOptions: any,
    chartType?: string,
    axisColumnMappings?: AxisColumnMappings
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

export interface ThresholdLine {
  color: string;
  show: boolean;
  style: ThresholdLineStyle;
  value: number;
  width: number;
}

export interface ThresholdLine {
  color: string;
  show: boolean;
  style: ThresholdLineStyle;
  value: number;
  width: number;
  name?: string;
  id?: string; // Unique identifier for each threshold
}

// Array of threshold lines
export type ThresholdLines = ThresholdLine[];

export interface TooltipOptions {
  mode: 'all' | 'hidden';
}

// Styling: Grid configuration
export interface GridOptions {
  xLines: boolean;
  yLines: boolean;
}

export interface TitleOptions {
  show: boolean;
  titleName: string;
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
  grid: Grid;
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
  grid: Grid;
}

export interface FieldSetting {
  default: VisColumn;
  options?: VisColumn[];
}

export enum AxisRole {
  X = 'x',
  Y = 'y',
  COLOR = 'color',
  FACET = 'facet',
  SIZE = 'size',
  Y_SECOND = 'y2',
  Value = 'value',
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
  axisRole: AxisRole;
  grid: Grid;
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
