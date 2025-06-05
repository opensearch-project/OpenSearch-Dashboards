/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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
}

export type VisFieldType = 'numerical' | 'categorical' | 'date' | 'unknown';

// Styling: Threshold line configuration
export interface ThresholdLine {
  color: string;
  show: boolean;
  style: 'full' | 'dashed' | 'dot-dashed';
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
  position: 'top' | 'bottom';
  show: boolean;
  labels: AxisLabels;
  title: AxisTitle;
}

// Styling: Value axis configuration
export interface ValueAxis {
  id: string;
  name: string;
  type: 'value';
  position: 'left' | 'right';
  show: boolean;
  labels: AxisLabels;
  title: AxisTitle;
}
