/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dataset } from '../../../data/common';

/**
 * Variable types supported by Dashboard
 */
export enum VariableType {
  Query = 'query',
  Custom = 'custom',
  Text = 'text',
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
  /** Allow adding custom values */
  allowCustomValue?: boolean;
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

/** Parameters for free-text query definition */
export interface QueryResultBaseParams {
  query: string;
  language: string;
  dataset?: Dataset;
}

/**
 * What a query variable's options are fetched from. Discriminated by `sourceKind`.
 */
export type VariableQueryParams =
  | (QueryResultBaseParams & {
      /** Free-text query expression run through the search strategy. */
      sourceKind: 'queryResult';
      /** Field used as the option value. Defaults to the first returned field when unset. */
      valueField?: string;
      /** Optional field used as the option display label. */
      labelField?: string;
    })
  | {
      /** Structured Prometheus resource lookup. */
      sourceKind: 'prometheusResource';
      language: 'PROMQL';
      dataset?: Dataset;
      promQLResourceQuery: PromQLResourceQuery;
    };

/** `Omit` that distributes over a union instead of collapsing it to common keys. */
export type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;

export interface NormalizedVariableOption {
  value: string;
  label?: string;
}
export type VariableOption = string | NormalizedVariableOption;

/**
 * Custom type variable - manually defined options
 */
export interface CustomVariable extends VariableMeta {
  type: VariableType.Custom;
  customOptions: VariableOption[];
}

export interface PromQLLabelMatcher {
  label: string;
  operator: '=' | '!=' | '=~' | '!~';
  value: string;
}

/** The structured Prometheus resource lookups a query variable can perform. */
export type PromQLResourceQuery =
  | {
      kind: 'labelNames';
      /** Optional regular expression to scope the returned label names to matching metric names. */
      metricRegex?: string;
    }
  | {
      kind: 'labelValues';
      /** Label whose values should be returned. */
      label: string;
      /** Optional metric to scope the returned label values to. */
      metric?: string;
      /** Optional additional label filters */
      matchers?: PromQLLabelMatcher[];
    }
  | {
      kind: 'metrics';
      /** Optional regular expression to filter metric names. */
      metricRegex?: string;
    }
  | {
      kind: 'series';
      /** Series selector/matcher. */
      matcher: string;
    };

/** Query type variable — options fetched from a query. */
export type QueryVariable = VariableMeta &
  VariableQueryParams & {
    type: VariableType.Query;
    /** Regex filter/extractor — matching options are shown and capture groups can extract values. */
    regex?: string;
    /** Whether to refresh options based on time range changes (default: false) */
    useTimeFilter?: boolean;
  };

export interface TextVariable extends VariableMeta {
  type: VariableType.Text;
}

/**
 * Union of all persisted variable types.
 */
export type Variable = CustomVariable | QueryVariable | TextVariable;

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
  options: NormalizedVariableOption[];
  optionType?: VariableOptionType; // Type of options for query variables (from response schema)
  loading?: boolean;
  error?: string;
}

/**
 * A variable combined with its runtime state, used by UI components.
 */
export type VariableWithState = Variable & VariableState;
