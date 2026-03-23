/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Supported visualization types for panels.
 */
export type VisualizationType =
  | 'line'
  | 'bar'
  | 'pie'
  | 'heatmap'
  | 'table'
  | 'metric'
  | 'markdown'
  | 'area'
  | 'gauge';

/**
 * Supported query languages.
 */
export type QueryLanguage = 'PPL' | 'DQL' | 'SQL' | 'Lucene';

/**
 * Grid position for a panel within the dashboard layout.
 */
export interface GridPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * A query definition with language and query string.
 */
export interface QueryDefinition {
  language: QueryLanguage;
  query: string;
}

/**
 * A data source reference for the dashboard.
 */
export interface DataSourceDefinition {
  name: string;
  type: string;
  default?: boolean;
}

/**
 * A template variable definition.
 */
export interface VariableDefinition {
  name: string;
  type: 'query' | 'custom' | 'constant' | 'interval';
  label?: string;
  description?: string;
  query?: string;
  options?: string[];
  defaultValue?: string;
  multi?: boolean;
}

/**
 * A panel within a dashboard.
 */
export interface PanelDefinition {
  name: string;
  type: string;
  visualization: VisualizationType;
  gridPosition: GridPosition;
  query?: QueryDefinition;
  options: Record<string, unknown>;
}

/**
 * The full dashboard resource definition.
 */
export interface DashboardDefinition {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    labels: Record<string, string>;
    annotations: Record<string, string>;
  };
  spec: {
    title: string;
    description: string;
    timeRange?: {
      from: string;
      to: string;
    };
    refreshInterval?: string;
    panels: PanelDefinition[];
    dataSources: DataSourceDefinition[];
    variables: VariableDefinition[];
  };
}

/**
 * A validation error with a path and message.
 */
export interface ValidationError {
  path: string;
  message: string;
}

/**
 * The compiled build output.
 */
export interface BuildOutput {
  definition: DashboardDefinition;
  errors: ValidationError[];
  isValid: boolean;
}
