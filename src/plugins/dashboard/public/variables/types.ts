/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Variable types supported by Dashboard
 */
export enum VariableType {
  Query = 'query',
  Custom = 'custom',
}

/**
 * Common variable metadata shared across all types.
 */
export interface VariableMeta {
  /** Unique identifier */
  id: string;
  /** Variable name (used in queries as $name) */
  name: string;
  /** Display label */
  label?: string;
  /** Variable type */
  type: VariableType;
  /** Currently selected value(s) */
  current?: string[];
  /** Allow multiple selections */
  multi?: boolean;
  /** Include "All" option */
  includeAll?: boolean;
  /** Hide variable from UI */
  hide?: boolean;
  /** Description */
  description?: string;
  /** Sort order for options */
  sort?: VariableSortOrder;
}

/**
 * Sort order for variable options
 */
export enum VariableSortOrder {
  Disabled = 'disabled',
  AlphabeticalAsc = 'alphabetical-asc',
  AlphabeticalDesc = 'alphabetical-desc',
  NumericalAsc = 'numerical-asc',
  NumericalDesc = 'numerical-desc',
}

/**
 * Query parameters for fetching variable options
 */
export interface VariableQueryParams {
  query: string;
  language: string;
  dataset?: {
    id: string;
    title: string;
    type: string;
    timeFieldName?: string;
  };
}

/**
 * Custom type variable - manually defined options
 */
export interface CustomVariable extends VariableMeta {
  type: VariableType.Custom;
  customOptions: string[];
}

/**
 * Query type variable — options fetched from a query
 */
export interface QueryVariable extends VariableMeta, VariableQueryParams {
  type: VariableType.Query;
  /** Regex filter — only options matching this pattern are shown */
  regex?: string;
  /** Whether to refresh options based on time range changes (default: false) */
  useTimeFilter?: boolean;
}

/**
 * Union of all persisted variable types.
 */
export type Variable = CustomVariable | QueryVariable;

/**
 * Option value type for query variables
 * Maps to data types returned in query response schema
 */
export type VariableOptionType = 'string' | 'number' | 'boolean';

/**
 * Runtime state for a variable.
 * Managed in-memory by VariableService.
 */
export interface VariableState {
  options: string[];
  optionType?: VariableOptionType; // Type of options for query variables (from response schema)
  loading?: boolean;
  error?: string;
}

/**
 * A variable combined with its runtime state, used by UI components.
 */
export type VariableWithState = Variable & VariableState;
