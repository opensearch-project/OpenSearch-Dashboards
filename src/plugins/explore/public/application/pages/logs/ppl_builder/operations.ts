/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { AggFn } from './types';

export interface AggDef {
  id: AggFn;
  label: string;
  /**
   * Short explanation of the aggregation, shown under the label in the "Add
   * metric" menu (plain string, matching the scalar-function descriptions).
   */
  description: string;
  /** Whether the aggregation operates on a field (count does not). */
  needsField: boolean;
  /**
   * Whether the aggregation only makes sense over a numeric field (avg, sum,
   * variance, …). When true the field picker is restricted to numeric fields;
   * when false any aggregatable field is offered (min/max, distinct_count, …).
   * Undefined implies "any" (e.g. count needs no field).
   */
  numericOnly?: boolean;
}

/**
 * PPL `stats` aggregation catalog, populated ONLY with aggregations the builder
 * can both compile and round-trip through `parsePPL`. Each entry maps to a PPL
 * aggregation function (`compileAggregation` in build_ppl.ts turns `id` into the
 * emitted call).
 */
export const AGG_FUNCTIONS: AggDef[] = [
  {
    id: 'count',
    label: i18n.translate('explore.pplBuilder.agg.count', { defaultMessage: 'Count' }),
    description: 'Number of rows.',
    needsField: false,
  },
  {
    id: 'sum',
    label: i18n.translate('explore.pplBuilder.agg.sum', { defaultMessage: 'Sum' }),
    description: 'Sum of the field values.',
    needsField: true,
    numericOnly: true,
  },
  {
    id: 'avg',
    label: i18n.translate('explore.pplBuilder.agg.avg', { defaultMessage: 'Average' }),
    description: 'Arithmetic mean of the field values.',
    needsField: true,
    numericOnly: true,
  },
  {
    id: 'min',
    label: i18n.translate('explore.pplBuilder.agg.min', { defaultMessage: 'Min' }),
    description: 'Smallest field value.',
    needsField: true,
  },
  {
    id: 'max',
    label: i18n.translate('explore.pplBuilder.agg.max', { defaultMessage: 'Max' }),
    description: 'Largest field value.',
    needsField: true,
  },
  {
    id: 'percentile',
    label: i18n.translate('explore.pplBuilder.agg.percentile', {
      defaultMessage: 'Percentile',
    }),
    description: 'Value below which the given percentage of values fall.',
    needsField: true,
    numericOnly: true,
  },
  {
    id: 'median',
    label: i18n.translate('explore.pplBuilder.agg.median', { defaultMessage: 'Median' }),
    description: 'Middle value (50th percentile).',
    needsField: true,
    numericOnly: true,
  },
  {
    id: 'distinct_count',
    label: i18n.translate('explore.pplBuilder.agg.distinctCount', {
      defaultMessage: 'Distinct count',
    }),
    description: 'Number of unique field values.',
    needsField: true,
  },
  {
    id: 'stddev_samp',
    label: i18n.translate('explore.pplBuilder.agg.stddevSamp', {
      defaultMessage: 'Std dev (sample)',
    }),
    description: 'Sample standard deviation of the field values.',
    needsField: true,
    numericOnly: true,
  },
  {
    id: 'stddev_pop',
    label: i18n.translate('explore.pplBuilder.agg.stddevPop', {
      defaultMessage: 'Std dev (population)',
    }),
    description: 'Population standard deviation of the field values.',
    needsField: true,
    numericOnly: true,
  },
  {
    id: 'var_samp',
    label: i18n.translate('explore.pplBuilder.agg.varSamp', {
      defaultMessage: 'Variance (sample)',
    }),
    description: 'Sample variance of the field values.',
    needsField: true,
    numericOnly: true,
  },
  {
    id: 'var_pop',
    label: i18n.translate('explore.pplBuilder.agg.varPop', {
      defaultMessage: 'Variance (population)',
    }),
    description: 'Population variance of the field values.',
    needsField: true,
    numericOnly: true,
  },
];

export const AGG_FN_MAP: Record<AggFn, AggDef> = AGG_FUNCTIONS.reduce(
  (acc, def) => {
    acc[def.id] = def;
    return acc;
  },
  {} as Record<AggFn, AggDef>
);

/**
 * A scalar (row-level) function that can wrap an aggregation's field expression,
 * e.g. `avg(round(latency, 1))`. The wrapped expression is always the FIRST
 * argument; `params`/`paramNames` describe the *additional* positional args.
 * `id` is emitted verbatim as the PPL function name (compiled in build_ppl.ts,
 * round-tripped in parse_ppl.ts).
 */
export interface ScalarFnDef {
  id: string;
  name: string;
  description: string;
  /** Default values for the extra args beyond the wrapped expression. */
  params: string[];
  /** Placeholder/label per extra arg. */
  paramNames?: string[];
}

export interface ScalarFnCategory {
  name: string;
  items: ScalarFnDef[];
}

/**
 * Catalog of scalar functions grouped by category, mirroring the metric
 * explorer's `OPERATION_CATEGORIES`. Only single-expression-input functions are
 * listed (the wrapped field is the first argument); extra numeric/string args
 * are captured via `params`. Multi-field functions (e.g. `atan2(y, x)`,
 * `concat(a, b)`) are intentionally omitted because the builder wraps exactly
 * one field expression.
 *
 * Function descriptions are plain strings (not i18n), matching the metric
 * explorer's `OPERATION_CATEGORIES`; only the category and param labels are
 * translated.
 */
export const SCALAR_FN_CATEGORIES: ScalarFnCategory[] = [
  {
    name: i18n.translate('explore.pplBuilder.scalarCategory.math', { defaultMessage: 'Math' }),
    items: [
      { id: 'abs', name: 'abs', description: 'Absolute value.', params: [] },
      {
        id: 'round',
        name: 'round',
        description: 'Round to the given number of decimal places (default 0).',
        params: [''],
        paramNames: [
          i18n.translate('explore.pplBuilder.param.decimals', { defaultMessage: 'Decimals' }),
        ],
      },
      {
        id: 'ceiling',
        name: 'ceiling',
        description: 'Round up to the nearest integer.',
        params: [],
      },
      { id: 'floor', name: 'floor', description: 'Round down to the nearest integer.', params: [] },
      { id: 'sqrt', name: 'sqrt', description: 'Square root.', params: [] },
      { id: 'cbrt', name: 'cbrt', description: 'Cube root.', params: [] },
      { id: 'exp', name: 'exp', description: 'e raised to the power of the value.', params: [] },
      { id: 'ln', name: 'ln', description: 'Natural logarithm.', params: [] },
      { id: 'log2', name: 'log2', description: 'Base-2 logarithm.', params: [] },
      { id: 'log10', name: 'log10', description: 'Base-10 logarithm.', params: [] },
      { id: 'sign', name: 'sign', description: 'Sign of the value (-1, 0, or 1).', params: [] },
    ],
  },
  {
    name: i18n.translate('explore.pplBuilder.scalarCategory.string', { defaultMessage: 'String' }),
    items: [
      { id: 'lower', name: 'lower', description: 'Convert to lowercase.', params: [] },
      { id: 'upper', name: 'upper', description: 'Convert to uppercase.', params: [] },
      { id: 'length', name: 'length', description: 'Length of the string in bytes.', params: [] },
      { id: 'trim', name: 'trim', description: 'Trim leading and trailing spaces.', params: [] },
      { id: 'ltrim', name: 'ltrim', description: 'Trim leading spaces.', params: [] },
      { id: 'rtrim', name: 'rtrim', description: 'Trim trailing spaces.', params: [] },
      { id: 'reverse', name: 'reverse', description: 'Reverse the string.', params: [] },
      {
        id: 'substring',
        name: 'substring',
        description: 'Substring from a start position, optionally of a given length.',
        params: ['1', ''],
        paramNames: [
          i18n.translate('explore.pplBuilder.param.start', { defaultMessage: 'Start' }),
          i18n.translate('explore.pplBuilder.param.length', { defaultMessage: 'Length' }),
        ],
      },
    ],
  },
  {
    name: i18n.translate('explore.pplBuilder.scalarCategory.datetime', {
      defaultMessage: 'Date & time',
    }),
    items: [
      { id: 'hour', name: 'hour', description: 'Hour of the value.', params: [] },
      { id: 'minute', name: 'minute', description: 'Minute of the value.', params: [] },
      { id: 'second', name: 'second', description: 'Second of the value.', params: [] },
      {
        id: 'day_of_month',
        name: 'day_of_month',
        description: 'Day of the month (1-31).',
        params: [],
      },
      {
        id: 'day_of_week',
        name: 'day_of_week',
        description: 'Day of the week (1=Sunday).',
        params: [],
      },
      {
        id: 'day_of_year',
        name: 'day_of_year',
        description: 'Day of the year (1-366).',
        params: [],
      },
      {
        id: 'week_of_year',
        name: 'week_of_year',
        description: 'Week of the year.',
        params: [],
      },
      { id: 'month', name: 'month', description: 'Month of the year (1-12).', params: [] },
      { id: 'quarter', name: 'quarter', description: 'Quarter of the year (1-4).', params: [] },
      { id: 'year', name: 'year', description: 'Year of the value.', params: [] },
      { id: 'to_seconds', name: 'to_seconds', description: 'Seconds since year 0.', params: [] },
    ],
  },
];

export const SCALAR_FN_MAP: Record<string, ScalarFnDef> = SCALAR_FN_CATEGORIES.reduce(
  (acc, cat) => {
    cat.items.forEach((item) => {
      acc[item.id] = item;
    });
    return acc;
  },
  {} as Record<string, ScalarFnDef>
);

/** All scalar-function ids the builder recognizes (used by parse_ppl.ts). */
export const SCALAR_FN_IDS = new Set<string>(Object.keys(SCALAR_FN_MAP));
