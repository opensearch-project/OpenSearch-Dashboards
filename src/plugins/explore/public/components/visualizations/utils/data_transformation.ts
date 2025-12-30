/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AggregationType, TimeUnit } from '../types';
import { inferTimeIntervals } from '../bar/bar_chart_utils';
import { EChartsSpecState } from './echarts_spec';
import { parseUTCDate } from './utils';

const aggregateValues = (aggregationType: AggregationType, values?: number[]) => {
  if (!values || values.length === 0) return null;

  switch (aggregationType) {
    case AggregationType.SUM:
      return values.reduce((a, b) => a + b, 0);
    case AggregationType.MEAN:
      return values.reduce((a, b) => a + b, 0) / values.length;
    case AggregationType.MAX:
      return Math.max(...values);
    case AggregationType.MIN:
      return Math.min(...values);
    case AggregationType.COUNT:
      return values.length;
    case AggregationType.NONE:
    default:
      return values[0];
  }
};

type TransformFn = (data: Array<Record<string, any>>) => Array<Record<string, any>>;

/**
 * Convert array of objects to 2D array format
 *
 * @param data - Array of objects with consistent keys
 * @param headers - Optional array of field names to specify column order and selection
 * @returns 2D array with header row as first element
 *
 * @example
 * Input: [{name: 'foo', age: 10, height: 100}, {name: 'bar', age: 15, height: 130}]
 * Output (no headers): [['name', 'age', 'height'], ['foo', 10, 100], ['bar', 15, 130]]
 * Output (with headers): [['name', 'age'], ['foo', 10], ['bar', 15]]
 */
export const convertTo2DArray = (headers?: string[]) => (
  data: Array<Record<string, any>>
): Array<string[] | any[]> => {
  if (data.length === 0) return [];

  // Use provided headers or extract from first object
  const columnHeaders = headers || Object.keys(data[0]);

  // Create data rows
  const rows = data.map((obj) => columnHeaders.map((key) => obj[key]));

  return [columnHeaders, ...rows];
};

export const sortByTime = (dateField?: string) => (
  data: Array<Record<string, any>>
): Array<Record<string, any>> => {
  const sortedData = dateField
    ? [...data].sort((a, b) => new Date(a[dateField]).getTime() - new Date(b[dateField]).getTime())
    : data;

  return sortedData;
};

export const transform = (...fns: TransformFn[]) => (state: EChartsSpecState) => {
  const { data } = state;
  const transformedData: Array<Array<Record<string, any>>> = [data];

  for (const fn of fns) {
    const transformed = fn(transformedData[transformedData.length - 1]);
    transformedData.push(transformed);
  }

  const lastValue = transformedData[transformedData?.length - 1];
  return { ...state, transformedData: lastValue };
};

export const facetTransform = (facetColumn: string, ...fns: TransformFn[]) => (
  state: EChartsSpecState
) => {
  const { data } = state;

  const grouped = data.reduce((acc, row) => {
    const facet = String(row[facetColumn]);
    acc[facet] ??= [];
    acc[facet].push(row);
    return acc;
  }, {} as Record<string, any[]>);

  const facetNumbers = Object.keys(grouped).length;

  if (facetNumbers <= 1) return transform(...fns)(state);

  const res = Object.entries(grouped).map(([_, facetData]) => {
    const facetState = { ...state, data: facetData };
    return transform(...fns)(facetState).transformedData;
  });

  return { ...state, transformedData: res };
};

/**
 * Creates an aggregation function for grouping and aggregating data
 * Returns a function that processes data and returns an array of aggregated objects
 *
 * @param options - Aggregation configuration options
 * @param options.groupBy - Field name for categories or time field (e.g., 'product', 'region', 'timestamp')
 * @param options.field - Field name for values (e.g., 'sales', 'count')
 * @param options.aggregationType - Type of aggregation to apply (SUM, MEAN, MAX, MIN, COUNT, NONE)
 * @param options.timeUnit - Optional time interval unit. When provided, treats groupBy as date field
 *
 * @returns Function that takes data array and returns array of aggregated objects
 *
 * @example
 * // Example 1: Categorical aggregation
 * // Input data:
 * [
 *   { product: 'A', sales: 100 },
 *   { product: 'A', sales: 150 },
 *   { product: 'B', sales: 200 },
 *   { product: 'B', sales: 120 }
 * ]
 *
 * // Usage:
 * const aggregateSales = aggregate({
 *   groupBy: 'product',
 *   field: 'sales',
 *   aggregationType: AggregationType.SUM
 * });
 *
 * // Output:
 * [
 *   { product: 'A', sales: 250 },
 *   { product: 'B', sales: 320 }
 * ]
 *
 * @example
 * // Example 2: Time-based aggregation
 * // Input data:
 * [
 *   { timestamp: '2024-01-01T08:00:00Z', sales: 100 },
 *   { timestamp: '2024-01-01T14:00:00Z', sales: 150 },
 *   { timestamp: '2024-01-02T09:00:00Z', sales: 200 },
 *   { timestamp: '2024-01-02T16:00:00Z', sales: 180 }
 * ]
 *
 * // Usage:
 * const aggregateSalesByDay = aggregate({
 *   groupBy: 'timestamp',
 *   field: 'sales',
 *   timeUnit: TimeUnit.DATE,
 *   aggregationType: AggregationType.SUM
 * });
 *
 * // Output (sorted by time):
 * [
 *   { timestamp: Date('2024-01-01T00:00:00.000Z'), sales: 250 },
 *   { timestamp: Date('2024-01-02T00:00:00.000Z'), sales: 380 }
 * ]
 */
export const aggregate = (options: {
  groupBy: string;
  field: string;
  aggregationType: AggregationType;
  timeUnit?: TimeUnit;
}) => (data: Array<Record<string, any>>) => {
  const { groupBy, field, aggregationType, timeUnit } = options;

  // Determine if this is time-based grouping
  const isTimeBased = timeUnit !== undefined;

  // Infer time unit if AUTO
  const effectiveTimeUnit = isTimeBased
    ? timeUnit === TimeUnit.AUTO
      ? inferTimeIntervals(data, groupBy)
      : timeUnit
    : undefined;

  // Group by category or time bucket
  const grouped = data.reduce((acc, row) => {
    let groupKey: string | number;
    let groupValue: string | Date;

    if (isTimeBased && effectiveTimeUnit) {
      // Time-based grouping
      const timestamp = parseUTCDate(row[groupBy]);

      // Skip invalid dates
      if (isNaN(timestamp.getTime())) {
        return acc;
      }

      // Round to time bucket
      const bucket = roundToTimeUnit(timestamp, effectiveTimeUnit);
      groupKey = bucket.getTime(); // Use timestamp as key for grouping
      groupValue = bucket;
    } else {
      // Categorical grouping
      groupKey = String(row[groupBy]);
      groupValue = groupKey;
    }

    const value = Number(row[field]);
    if (!isNaN(value)) {
      if (!acc[groupKey]) {
        acc[groupKey] = { groupValue, values: [] };
      }
      acc[groupKey].values.push(value);
    }

    return acc;
  }, {} as Record<string | number, { groupValue: string | Date; values: number[] }>);

  // Apply aggregation and convert to array of objects
  let result = Object.values(grouped).map(({ groupValue, values }) => {
    let aggregatedValue: number;
    if (values.length === 0) {
      aggregatedValue = 0;
    } else {
      aggregatedValue = aggregateValues(aggregationType, values) ?? 0;
    }

    return {
      [groupBy]: groupValue,
      [field]: aggregatedValue,
    };
  });

  // Sort by time if time-based
  if (isTimeBased) {
    result = result.sort((a, b) => (a[groupBy] as Date).getTime() - (b[groupBy] as Date).getTime());
  }

  return result;
};

/**
 * Flatten array-valued fields into separate rows
 * Similar to Vega's flatten transformation
 *
 * @param fields - Optional array of field names to flatten. If not provided, auto-detects all array fields
 *
 * @returns Function that takes data array and returns flattened array
 *
 * @example
 * // Example 1: Auto-detect array fields
 * // Input data:
 * [
 *   { key: 'alpha', foo: [1, 2], bar: ['A', 'B'] },
 *   { key: 'beta', foo: [3, 4, 5], bar: ['C', 'D'] }
 * ]
 *
 * // Usage:
 * flatten()  // Auto-detects 'foo' and 'bar' as array fields
 *
 * // Output:
 * [
 *   { key: 'alpha', foo: 1, bar: 'A' },
 *   { key: 'alpha', foo: 2, bar: 'B' },
 *   { key: 'beta', foo: 3, bar: 'C' },
 *   { key: 'beta', foo: 4, bar: 'D' },
 *   { key: 'beta', foo: 5, bar: null }
 * ]
 *
 * @example
 * // Example 2: Explicit field names
 * // Input data:
 * [
 *   { time: '<time1>', type1: [1, 2, 3], type2: null },
 *   { time: '<time2>', type1: null, type2: [2] }
 * ]
 *
 * // Usage:
 * flatten(['type1', 'type2'])
 *
 * // Output:
 * [
 *   { time: '<time1>', type1: 1, type2: null },
 *   { time: '<time1>', type1: 2, type2: null },
 *   { time: '<time1>', type1: 3, type2: null },
 *   { time: '<time2>', type1: null, type2: 2 }
 * ]
 *
 * @example
 * // Example 3: Mixed array and non-array values
 * // Input data (some fields are arrays, some are not):
 * [
 *   { key: 'alpha', foo: 1, bar: 'A' },
 *   { key: 'beta', foo: [3, 4, 5], bar: ['C', 'D'] }
 * ]
 *
 * // Usage:
 * flatten()  // Auto-detects 'foo' and 'bar' as array fields (from second row)
 *
 * // Output (non-array values treated as single-element arrays):
 * [
 *   { key: 'alpha', foo: 1, bar: 'A' },
 *   { key: 'beta', foo: 3, bar: 'C' },
 *   { key: 'beta', foo: 4, bar: 'D' },
 *   { key: 'beta', foo: 5, bar: null }
 * ]
 *
 * @example
 * // Example 3: Combined with pivot (no aggregation)
 * // Input data:
 * [
 *   { time: '<time1>', value: 1, type: 'type1' },
 *   { time: '<time1>', value: 2, type: 'type1' },
 *   { time: '<time2>', value: 2, type: 'type2' },
 *   { time: '<time1>', value: 3, type: 'type1' }
 * ]
 *
 * // Usage:
 * transform(
 *   pivot({
 *     groupBy: 'time',
 *     pivot: 'type',
 *     field: 'value'
 *     // No aggregationType - returns arrays
 *   }),
 *   flatten(),  // Auto-detects array fields
 *   convertTo2DArray()
 * )
 *
 * // After pivot (arrays preserved):
 * [
 *   { time: '<time1>', type1: [1, 2, 3], type2: null },
 *   { time: '<time2>', type1: null, type2: [2] }
 * ]
 *
 * // After flatten:
 * [
 *   { time: '<time1>', type1: 1, type2: null },
 *   { time: '<time1>', type1: 2, type2: null },
 *   { time: '<time1>', type1: 3, type2: null },
 *   { time: '<time2>', type1: null, type2: 2 }
 * ]
 *
 * // After convertTo2DArray:
 * [
 *   ['time', 'type1', 'type2'],
 *   ['<time1>', 1, null],
 *   ['<time1>', 2, null],
 *   ['<time1>', 3, null],
 *   ['<time2>', null, 2]
 * ]
 */
export const flatten = (fields?: string[]) => (
  data: Array<Record<string, any>>
): Array<Record<string, any>> => {
  if (data.length === 0) return [];

  // Auto-detect array fields if not specified
  // Check all rows to find fields that contain arrays in any row
  const fieldsToFlatten =
    fields ??
    Array.from(
      new Set(data.flatMap((row) => Object.keys(row).filter((key) => Array.isArray(row[key]))))
    );

  if (fieldsToFlatten.length === 0) {
    // No array fields to flatten, return data as-is
    return data;
  }

  const result: Array<Record<string, any>> = [];

  data.forEach((row) => {
    // Find the maximum length among all arrays to flatten in this row
    const maxLength = Math.max(
      ...fieldsToFlatten.map((field) => {
        const value = row[field];
        return Array.isArray(value) ? value.length : 0;
      }),
      1 // At least 1 row even if all arrays are empty/null
    );

    // Create a row for each index up to maxLength
    for (let i = 0; i < maxLength; i++) {
      const newRow: Record<string, any> = {};

      // Copy all fields from original row
      Object.keys(row).forEach((key) => {
        if (fieldsToFlatten.includes(key)) {
          // For fields to flatten, extract value at index i
          const value = row[key];
          if (Array.isArray(value)) {
            // If it's an array, extract value at index i
            newRow[key] = i < value.length ? value[i] : null;
          } else {
            // If it's not an array, treat it as a single value (only for i === 0)
            newRow[key] = i === 0 ? value : null;
          }
        } else {
          // For non-array fields, copy the value as-is
          newRow[key] = row[key];
        }
      });

      result.push(newRow);
    }
  });

  return result;
};

/**
 * Round timestamp to time unit bucket
 * @param timestamp - Date object to round
 * @param unit - TimeUnit to round to
 * @returns Date object rounded to the start of the time bucket
 */
const roundToTimeUnit = (timestamp: Date, unit: TimeUnit): Date => {
  const d = new Date(timestamp);
  switch (unit) {
    case TimeUnit.YEAR:
      return new Date(d.getFullYear(), 0, 1);
    case TimeUnit.MONTH:
      return new Date(d.getFullYear(), d.getMonth(), 1);
    case TimeUnit.DATE:
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    case TimeUnit.HOUR:
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours());
    case TimeUnit.MINUTE:
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes());
    case TimeUnit.SECOND:
      return new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        d.getHours(),
        d.getMinutes(),
        d.getSeconds()
      );
    default:
      return d;
  }
};

/**
 * Helper function to normalize empty/null/undefined values
 * @param value - Value to normalize
 * @param defaultValue - Default value to use for empty values
 * @returns Normalized string value
 */
const normalizeEmptyValue = (value: any, defaultValue: string = '-'): string => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  return String(value);
};

/**
 * Pivot data by a categorical or time-based column
 * Returns array of objects with pivoted columns
 *
 * @param options - Pivot configuration options
 * @param options.groupBy - Field name for grouping rows (e.g., 'product', 'region', 'timestamp')
 * @param options.pivot - Field name for pivot columns (e.g., 'category', 'type')
 * @param options.field - Field name for values to aggregate (e.g., 'sales', 'count')
 * @param options.aggregationType - Type of aggregation to apply (SUM, MEAN, MAX, MIN, COUNT, NONE)
 * @param options.timeUnit - Optional time interval unit. When provided, treats groupBy as date field
 *
 * @returns Function that takes data array and returns array of objects with pivoted columns
 *
 * @example
 * // Example 1: Categorical pivot
 * // Input data:
 * [
 *   { product: 'A', type: 'online', sales: 100 },
 *   { product: 'A', type: 'store', sales: 150 },
 *   { product: 'B', type: 'online', sales: 200 },
 *   { product: 'B', type: 'store', sales: 120 }
 * ]
 *
 * // Usage:
 * const pivotSales = pivot({
 *   groupBy: 'product',
 *   pivot: 'type',
 *   field: 'sales',
 *   aggregationType: AggregationType.SUM
 * });
 *
 * // Output:
 * [
 *   { product: 'A', online: 100, store: 150 },
 *   { product: 'B', online: 200, store: 120 }
 * ]
 *
 * @example
 * // Example 2: Time-based pivot
 * // Input data:
 * [
 *   { timestamp: '2024-01-01T00:00:00Z', product: 'A', sales: 100 },
 *   { timestamp: '2024-01-01T00:00:00Z', product: 'B', sales: 200 },
 *   { timestamp: '2024-01-02T00:00:00Z', product: 'A', sales: 150 },
 *   { timestamp: '2024-01-02T00:00:00Z', product: 'B', sales: 180 }
 * ]
 *
 * // Usage:
 * const pivotSalesByTime = pivot({
 *   groupBy: 'timestamp',
 *   pivot: 'product',
 *   field: 'sales',
 *   timeUnit: TimeUnit.DATE,
 *   aggregationType: AggregationType.SUM
 * });
 *
 * // Output:
 * [
 *   { timestamp: Date('2024-01-01T00:00:00.000Z'), A: 100, B: 200 },
 *   { timestamp: Date('2024-01-02T00:00:00.000Z'), A: 150, B: 180 }
 * ]
 *
 * @example
 * // Example 3: Handling empty/null/undefined pivot values
 * // Input data with empty values:
 * [
 *   { region: 'US', category: '', sales: 100 },
 *   { region: 'EU', category: null, sales: 150 },
 *   { region: 'US', category: 'Electronics', sales: 200 }
 * ]
 *
 * // Usage:
 * const pivotByCategory = pivot({
 *   groupBy: 'region',
 *   pivot: 'category',
 *   field: 'sales',
 *   aggregationType: AggregationType.SUM
 * });
 *
 * // Output (empty/null/undefined values normalized to '-'):
 * [
 *   { region: 'US', '-': 100, Electronics: 200 },
 *   { region: 'EU', '-': 150, Electronics: null }
 * ]
 *
 * @example
 * // Example 4: Pivot without aggregation (returns arrays)
 * // Input data:
 * [
 *   { time: '<time1>', value: 1, type: 'type1' },
 *   { time: '<time1>', value: 2, type: 'type1' },
 *   { time: '<time2>', value: 2, type: 'type2' },
 *   { time: '<time1>', value: 3, type: 'type1' }
 * ]
 *
 * // Usage (no aggregationType):
 * const pivotToArrays = pivot({
 *   groupBy: 'time',
 *   pivot: 'type',
 *   field: 'value'
 *   // No aggregationType - preserves all values as arrays
 * });
 *
 * // Output (values grouped into arrays):
 * [
 *   { time: '<time1>', type1: [1, 2, 3], type2: null },
 *   { time: '<time2>', type1: null, type2: [2] }
 * ]
 *
 * // Can be combined with flatten() to expand arrays into rows:
 * // flatten() -> [
 * //   { time: '<time1>', type1: 1, type2: null },
 * //   { time: '<time1>', type1: 2, type2: null },
 * //   { time: '<time1>', type1: 3, type2: null },
 * //   { time: '<time2>', type1: null, type2: 2 }
 * // ]
 */
export const pivot = (options: {
  groupBy: string;
  pivot: string;
  field: string;
  aggregationType?: AggregationType;
  timeUnit?: TimeUnit;
}) => (data: Array<Record<string, any>>): Array<Record<string, any>> => {
  const { groupBy, pivot: pivotField, field, aggregationType, timeUnit } = options;

  // Extract unique pivot values for column headers, normalizing empty values
  const pivotValues = Array.from(
    new Set(data.map((item) => normalizeEmptyValue(item[pivotField])))
  );

  // Determine if this is time-based grouping
  const isTimeBased = timeUnit !== undefined;

  // Infer time unit if AUTO
  const effectiveTimeUnit = isTimeBased
    ? timeUnit === TimeUnit.AUTO
      ? inferTimeIntervals(data, groupBy)
      : timeUnit
    : undefined;

  // Group data by groupBy and pivot fields
  const grouped = data.reduce((acc, row) => {
    let groupKey: string | number;
    let groupValue: string | Date;

    if (isTimeBased && effectiveTimeUnit) {
      // Time-based grouping
      const timestamp = parseUTCDate(row[groupBy]);

      // Skip invalid dates
      if (isNaN(timestamp.getTime())) {
        return acc;
      }

      // Round to time bucket
      const bucket = roundToTimeUnit(timestamp, effectiveTimeUnit);
      groupKey = bucket.getTime(); // Use timestamp as key for grouping
      groupValue = bucket;
    } else {
      // Categorical grouping
      groupKey = String(row[groupBy]);
      groupValue = groupKey;
    }

    const pivotKey = normalizeEmptyValue(row[pivotField]);
    const value = Number(row[field]);

    if (isNaN(value)) return acc;

    if (!acc[groupKey]) {
      acc[groupKey] = { groupValue, pivotData: {} };
    }
    acc[groupKey].pivotData[pivotKey] ??= [];
    acc[groupKey].pivotData[pivotKey].push(value);

    return acc;
  }, {} as Record<string | number, { groupValue: string | Date; pivotData: Record<string, number[]> }>);

  // Convert to array of objects with pivoted columns

  let result = Object.values(grouped).map(({ groupValue, pivotData: pd }) => {
    const row: Record<string, any> = { [groupBy]: groupValue };

    // Add a column for each pivot value
    pivotValues.forEach((pv) => {
      if (aggregationType) {
        // Apply aggregation function to the values
        row[pv] = aggregateValues(aggregationType, pd[pv]) ?? null;
      } else {
        // No aggregation: preserve values as-is (array or null)
        const values = pd[pv] ?? null;
        // If single value array, unwrap to scalar
        row[pv] = Array.isArray(values) && values.length === 1 ? values[0] : values;
      }
    });

    return row;
  });
  // Sort by time if time-based
  if (isTimeBased) {
    result = result.sort((a, b) => (a[groupBy] as Date).getTime() - (b[groupBy] as Date).getTime());
  }

  return result;
};
