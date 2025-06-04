/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisualizationType } from './utils/use_visualization_types';

export interface ChartTypeMapping {
  type: string; // 'line', 'bar', 'scatter', etc.
  priority: number; // Higher number = higher priority
  name: string;
}

export interface VisColumn {
  id: number;
  name: string;
  schema: VisFieldType;
  column: string;
}

export type VisFieldType = 'numerical' | 'categorical' | 'date' | 'unknown';

export interface VisualizationRule {
  name: string;
  matches: (
    numericalColumns: VisColumn[],
    categoricalColumns: VisColumn[],
    dateColumns: VisColumn[]
  ) => boolean;
  createConfig: () => VisualizationType;
}

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
