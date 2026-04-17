/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

export interface OperationDef {
  id: string;
  name: string;
  params: string[];
  paramNames?: string[];
  description: string;
}

interface OperationCategory {
  name: string;
  items: OperationDef[];
}

export const OPERATORS = ['=', '!=', '=~', '!~'];

export const AGGREGATION_IDS = new Set([
  'sum',
  'avg',
  'min',
  'max',
  'count',
  'group',
  'stddev',
  'stdvar',
]);

/** All aggregation operators that support by/without grouping clauses. */
export const GROUPABLE_AGGREGATION_IDS = new Set([
  ...AGGREGATION_IDS,
  'topk',
  'bottomk',
  'count_values',
  'quantile',
]);

export const OPERATION_CATEGORIES: OperationCategory[] = [
  {
    name: i18n.translate('explore.promqlBuilder.category.addFunction', {
      defaultMessage: 'Add function',
    }),
    items: [
      {
        id: 'abs',
        name: 'abs',
        params: [],
        description:
          'Returns the input vector with all sample values converted to their absolute value.',
      },
      {
        id: 'absent',
        name: 'absent',
        params: [],
        description:
          'Returns an empty vector if the vector passed to it has any elements and a 1-element vector with the value 1 if the vector passed to it has no elements.',
      },
      {
        id: 'absent_over_time',
        name: 'absent_over_time',
        params: [''],
        paramNames: ['Range'],
        description:
          'Returns an empty vector if the range vector passed to it has any elements and a 1-element vector with the value 1 if the range vector passed to it has no elements.',
      },
      {
        id: 'acos',
        name: 'acos',
        params: [],
        description: 'Calculates the arccosine of all elements in v.',
      },
      {
        id: 'acosh',
        name: 'acosh',
        params: [],
        description: 'Calculates the inverse hyperbolic cosine of all elements in v.',
      },
      {
        id: 'asin',
        name: 'asin',
        params: [],
        description: 'Calculates the arcsine of all elements in v.',
      },
      {
        id: 'asinh',
        name: 'asinh',
        params: [],
        description: 'Calculates the inverse hyperbolic sine of all elements in v.',
      },
      {
        id: 'atan',
        name: 'atan',
        params: [],
        description: 'Calculates the arctangent of all elements in v.',
      },
      {
        id: 'atanh',
        name: 'atanh',
        params: [],
        description: 'Calculates the inverse hyperbolic tangent of all elements in v.',
      },
      {
        id: 'avg_over_time',
        name: 'avg_over_time',
        params: [''],
        paramNames: ['Range'],
        description: 'The average value of all points in the specified interval.',
      },
      {
        id: 'ceil',
        name: 'ceil',
        params: [],
        description: 'Rounds the sample values of all elements in v up to the nearest integer.',
      },
      {
        id: 'changes',
        name: 'changes',
        params: [''],
        paramNames: ['Range'],
        description:
          'Returns the number of times the value of a time series has changed within the provided time range as an instant vector.',
      },
      {
        id: 'clamp',
        name: 'clamp',
        params: ['1', '100'],
        paramNames: ['Min', 'Max'],
        description:
          'Clamps the sample values of all elements in v to have a lower limit of min and an upper limit of max.',
      },
      {
        id: 'clamp_max',
        name: 'clamp_max',
        params: ['100'],
        paramNames: ['Max'],
        description: 'Clamps the sample values of all elements in v to have an upper limit of max.',
      },
      {
        id: 'clamp_min',
        name: 'clamp_min',
        params: ['0'],
        paramNames: ['Min'],
        description: 'Clamps the sample values of all elements in v to have a lower limit of min.',
      },
      {
        id: 'cos',
        name: 'cos',
        params: [],
        description: 'Calculates the cosine of all elements in v.',
      },
      {
        id: 'cosh',
        name: 'cosh',
        params: [],
        description: 'Calculates the hyperbolic cosine of all elements in v.',
      },
      {
        id: 'count_over_time',
        name: 'count_over_time',
        params: [''],
        paramNames: ['Range'],
        description: 'The count of all values in the specified interval.',
      },
      {
        id: 'day_of_month',
        name: 'day_of_month',
        params: [],
        description:
          'Returns the day of the month for each of the given times in UTC. Returned values are from 1 to 31.',
      },
      {
        id: 'day_of_week',
        name: 'day_of_week',
        params: [],
        description:
          'Returns the day of the week for each of the given times in UTC. Returned values are from 0 to 6, where 0 means Sunday.',
      },
      {
        id: 'day_of_year',
        name: 'day_of_year',
        params: [],
        description:
          'Returns the day of the year for each of the given times in UTC. Returned values are from 1 to 365 for non-leap years, and 1 to 366 in leap years.',
      },
      {
        id: 'days_in_month',
        name: 'days_in_month',
        params: [],
        description:
          'Returns number of days in the month for each of the given times in UTC. Returned values are from 28 to 31.',
      },
      {
        id: 'deg',
        name: 'deg',
        params: [],
        description: 'Converts radians to degrees for all elements in v.',
      },
      {
        id: 'delta',
        name: 'delta',
        params: [''],
        paramNames: ['Range'],
        description:
          'Calculates the difference between the first and last value of each time series element in a range vector v, returning an instant vector with the given deltas and equivalent labels.',
      },
      {
        id: 'deriv',
        name: 'deriv',
        params: [''],
        paramNames: ['Range'],
        description:
          'Calculates the per-second derivative of the time series in a range vector v, using simple linear regression.',
      },
      {
        id: 'exp',
        name: 'exp',
        params: [],
        description: 'Calculates the exponential function for all elements in v.',
      },
      {
        id: 'floor',
        name: 'floor',
        params: [],
        description: 'Rounds the sample values of all elements in v down to the nearest integer.',
      },
      {
        id: 'histogram_avg',
        name: 'histogram_avg',
        params: [],
        description:
          'Returns the arithmetic mean of observed values stored in each native histogram sample in v. Float samples are ignored.',
      },
      {
        id: 'histogram_count',
        name: 'histogram_count',
        params: [],
        description:
          'Returns the count of observations stored in each native histogram sample in v. Float samples are ignored.',
      },
      {
        id: 'histogram_fraction',
        name: 'histogram_fraction',
        params: ['0', '0.2'],
        paramNames: ['Lower', 'Upper'],
        description:
          'Returns the estimated fraction of observations between lower and upper for each classic or native histogram in b.',
      },
      {
        id: 'histogram_quantile',
        name: 'histogram_quantile',
        params: ['0.95'],
        paramNames: ['Quantile'],
        description: 'Calculates the φ-quantile (0 ≤ φ ≤ 1) from the buckets b of a histogram.',
      },
      {
        id: 'histogram_stddev',
        name: 'histogram_stddev',
        params: [],
        description:
          'Returns the estimated standard deviation of observations for each native histogram sample in v. Float samples are ignored.',
      },
      {
        id: 'histogram_stdvar',
        name: 'histogram_stdvar',
        params: [],
        description:
          'Returns the estimated standard variance of observations for each native histogram sample in v. Float samples are ignored.',
      },
      {
        id: 'histogram_sum',
        name: 'histogram_sum',
        params: [],
        description:
          'Returns the sum of observations stored in each native histogram sample in v. Float samples are ignored.',
      },
      {
        id: 'holt_winters',
        name: 'holt_winters',
        params: ['', '0.5', '0.5'],
        paramNames: ['Range', 'Smoothing factor', 'Trend factor'],
        description:
          'Produces a smoothed value for time series based on the range in v. Both sf and tf must be between 0 and 1.',
      },
      {
        id: 'hour',
        name: 'hour',
        params: [],
        description:
          'Returns the hour of the day for each of the given times in UTC. Returned values are from 0 to 23.',
      },
      {
        id: 'idelta',
        name: 'idelta',
        params: [''],
        paramNames: ['Range'],
        description:
          'Calculates the difference between the last two samples in the range vector v.',
      },
      {
        id: 'increase',
        name: 'increase',
        params: [''],
        paramNames: ['Range'],
        description: 'Calculates the increase in the time series in the range vector.',
      },
      {
        id: 'irate',
        name: 'irate',
        params: [''],
        paramNames: ['Range'],
        description:
          'Calculates the per-second instant rate of increase of the time series in the range vector. This is based on the last two data points.',
      },
      {
        id: 'label_join',
        name: 'label_join',
        params: ['', '', '', ''],
        paramNames: ['Destination label', 'Separator', 'Source label 1', 'Source label 2'],
        description:
          'Joins all the values of all the src_labels using separator and returns the timeseries with the label dst_label containing the joined value.',
      },
      {
        id: 'label_replace',
        name: 'label_replace',
        params: ['', '', '', ''],
        paramNames: ['Destination label', 'Replacement', 'Source label', 'Regex'],
        description:
          'Matches the regular expression regex against the label src_label. If it matches, the timeseries is returned with the label dst_label replaced by the expansion of replacement.',
      },
      {
        id: 'last_over_time',
        name: 'last_over_time',
        params: [''],
        paramNames: ['Range'],
        description: 'The most recent point value in the specified interval.',
      },
      {
        id: 'ln',
        name: 'ln',
        params: [],
        description: 'Calculates the natural logarithm for all elements in v.',
      },
      {
        id: 'log10',
        name: 'log10',
        params: [],
        description: 'Calculates the decimal logarithm for all elements in v.',
      },
      {
        id: 'log2',
        name: 'log2',
        params: [],
        description: 'Calculates the binary logarithm for all elements in v.',
      },
      {
        id: 'max_over_time',
        name: 'max_over_time',
        params: [''],
        paramNames: ['Range'],
        description: 'The maximum value of all points in the specified interval.',
      },
      {
        id: 'min_over_time',
        name: 'min_over_time',
        params: [''],
        paramNames: ['Range'],
        description: 'The minimum value of all points in the specified interval.',
      },
      {
        id: 'minute',
        name: 'minute',
        params: [],
        description:
          'Returns the minute of the hour for each of the given times in UTC. Returned values are from 0 to 59.',
      },
      {
        id: 'month',
        name: 'month',
        params: [],
        description:
          'Returns the month of the year for each of the given times in UTC. Returned values are from 1 to 12.',
      },
      { id: 'pi', name: 'pi', params: [], description: 'Returns the mathematical constant π.' },
      {
        id: 'predict_linear',
        name: 'predict_linear',
        params: ['', '3600'],
        paramNames: ['Range', 'Seconds'],
        description:
          'Predicts the value of time series t seconds from now, based on the range vector v, using simple linear regression.',
      },
      {
        id: 'present_over_time',
        name: 'present_over_time',
        params: [''],
        paramNames: ['Range'],
        description: 'The value 1 for any series in the specified interval.',
      },
      {
        id: 'quantile_over_time',
        name: 'quantile_over_time',
        params: ['0.95', ''],
        paramNames: ['Quantile', 'Range'],
        description: 'The φ-quantile (0 ≤ φ ≤ 1) of the values in the specified interval.',
      },
      {
        id: 'rad',
        name: 'rad',
        params: [],
        description: 'Converts degrees to radians for all elements in v.',
      },
      {
        id: 'rate',
        name: 'rate',
        params: [''],
        paramNames: ['Range'],
        description:
          'Calculates the per-second average rate of increase of the time series in the range vector.',
      },
      {
        id: 'resets',
        name: 'resets',
        params: [''],
        paramNames: ['Range'],
        description:
          'Returns the number of counter resets within the provided time range as an instant vector.',
      },
      {
        id: 'round',
        name: 'round',
        params: [],
        description: 'Rounds the sample values of all elements in v to the nearest integer.',
      },
      {
        id: 'scalar',
        name: 'scalar',
        params: [],
        description:
          'Given a single-element input vector, returns the sample value of that single element as a scalar.',
      },
      {
        id: 'sgn',
        name: 'sgn',
        params: [],
        description:
          'Returns a vector with all sample values converted to their sign: 1 if positive, -1 if negative, 0 if equal to zero.',
      },
      {
        id: 'sin',
        name: 'sin',
        params: [],
        description: 'Calculates the sine of all elements in v.',
      },
      {
        id: 'sinh',
        name: 'sinh',
        params: [],
        description: 'Calculates the hyperbolic sine of all elements in v.',
      },
      {
        id: 'sort',
        name: 'sort',
        params: [],
        description: 'Returns vector elements sorted by their sample values, in ascending order.',
      },
      {
        id: 'sort_desc',
        name: 'sort_desc',
        params: [],
        description: 'Returns vector elements sorted by their sample values, in descending order.',
      },
      {
        id: 'sqrt',
        name: 'sqrt',
        params: [],
        description: 'Calculates the square root of all elements in v.',
      },
      {
        id: 'stddev_over_time',
        name: 'stddev_over_time',
        params: [''],
        paramNames: ['Range'],
        description: 'The population standard deviation of the values in the specified interval.',
      },
      {
        id: 'stdvar_over_time',
        name: 'stdvar_over_time',
        params: [''],
        paramNames: ['Range'],
        description: 'The population standard variance of the values in the specified interval.',
      },
      {
        id: 'sum_over_time',
        name: 'sum_over_time',
        params: [''],
        paramNames: ['Range'],
        description: 'The sum of all values in the specified interval.',
      },
      {
        id: 'tan',
        name: 'tan',
        params: [],
        description: 'Calculates the tangent of all elements in v.',
      },
      {
        id: 'tanh',
        name: 'tanh',
        params: [],
        description: 'Calculates the hyperbolic tangent of all elements in v.',
      },
      {
        id: 'time',
        name: 'time',
        params: [],
        description: 'Returns the number of seconds since January 1, 1970 UTC.',
      },
      {
        id: 'timestamp',
        name: 'timestamp',
        params: [],
        description:
          'Returns the timestamp of each of the samples of the given vector as the number of seconds since January 1, 1970 UTC.',
      },
      {
        id: 'vector',
        name: 'vector',
        params: ['0'],
        paramNames: ['Scalar'],
        description: 'Returns the scalar s as a vector with no labels.',
      },
      {
        id: 'year',
        name: 'year',
        params: [],
        description: 'Returns the year for each of the given times in UTC.',
      },
    ],
  },
  {
    name: i18n.translate('explore.promqlBuilder.category.addAggregation', {
      defaultMessage: 'Add aggregation',
    }),
    items: [
      { id: 'sum', name: 'sum', params: [], description: 'Calculate sum over dimensions.' },
      { id: 'avg', name: 'avg', params: [], description: 'Calculate the average over dimensions.' },
      { id: 'min', name: 'min', params: [], description: 'Select minimum over dimensions.' },
      { id: 'max', name: 'max', params: [], description: 'Select maximum over dimensions.' },
      {
        id: 'count',
        name: 'count',
        params: [],
        description: 'Count number of elements in the vector.',
      },
      {
        id: 'group',
        name: 'group',
        params: [],
        description: 'All values in the resulting vector are 1.',
      },
      {
        id: 'stddev',
        name: 'stddev',
        params: [],
        description: 'Calculate population standard deviation over dimensions.',
      },
      {
        id: 'stdvar',
        name: 'stdvar',
        params: [],
        description: 'Calculate population standard variance over dimensions.',
      },
      {
        id: 'topk',
        name: 'topk',
        params: ['5'],
        paramNames: ['K'],
        description: 'Largest k elements by sample value.',
      },
      {
        id: 'bottomk',
        name: 'bottomk',
        params: ['5'],
        paramNames: ['K'],
        description: 'Smallest k elements by sample value.',
      },
      {
        id: 'count_values',
        name: 'count_values',
        params: ['value'],
        paramNames: ['Label'],
        description: 'Count number of elements with the same value.',
      },
      {
        id: 'quantile',
        name: 'quantile',
        params: ['0.95'],
        paramNames: ['Quantile'],
        description: 'Calculate φ-quantile over dimensions.',
      },
    ],
  },
  {
    name: i18n.translate('explore.promqlBuilder.category.addBinaryOperation', {
      defaultMessage: 'Add binary operation',
    }),
    items: [
      {
        id: 'add',
        name: '+',
        params: [''],
        paramNames: ['Value'],
        description: 'Add a scalar value to each sample value.',
      },
      {
        id: 'sub',
        name: '-',
        params: [''],
        paramNames: ['Value'],
        description: 'Subtract a scalar value from each sample value.',
      },
      {
        id: 'mul',
        name: '*',
        params: [''],
        paramNames: ['Value'],
        description: 'Multiply each sample value by a scalar.',
      },
      {
        id: 'div',
        name: '/',
        params: [''],
        paramNames: ['Value'],
        description: 'Divide each sample value by a scalar.',
      },
      {
        id: 'mod',
        name: '%',
        params: [''],
        paramNames: ['Value'],
        description: 'Modulo of each sample value by a scalar.',
      },
      {
        id: 'pow',
        name: '^',
        params: [''],
        paramNames: ['Value'],
        description: 'Raise each sample value to the power of a scalar.',
      },
      {
        id: 'eq',
        name: '==',
        params: [''],
        paramNames: ['Value'],
        description:
          'Returns 1 for elements where the expression is equal to the value, 0 otherwise.',
      },
      {
        id: 'neq',
        name: '!=',
        params: [''],
        paramNames: ['Value'],
        description:
          'Returns 1 for elements where the expression is not equal to the value, 0 otherwise.',
      },
      {
        id: 'gt',
        name: '>',
        params: [''],
        paramNames: ['Value'],
        description:
          'Returns 1 for elements where the expression is greater than the value, 0 otherwise.',
      },
      {
        id: 'lt',
        name: '<',
        params: [''],
        paramNames: ['Value'],
        description:
          'Returns 1 for elements where the expression is less than the value, 0 otherwise.',
      },
      {
        id: 'gte',
        name: '>=',
        params: [''],
        paramNames: ['Value'],
        description:
          'Returns 1 for elements where the expression is greater than or equal to the value, 0 otherwise.',
      },
      {
        id: 'lte',
        name: '<=',
        params: [''],
        paramNames: ['Value'],
        description:
          'Returns 1 for elements where the expression is less than or equal to the value, 0 otherwise.',
      },
    ],
  },
  {
    name: i18n.translate('explore.promqlBuilder.category.replaceWithLiteral', {
      defaultMessage: 'Replace with literal',
    }),
    items: [
      {
        id: 'literal',
        name: 'literal',
        params: ['0'],
        paramNames: ['Value'],
        description: 'Replace the query with a literal value.',
      },
    ],
  },
];

// Lookup utilities are in operation_lookup.ts
