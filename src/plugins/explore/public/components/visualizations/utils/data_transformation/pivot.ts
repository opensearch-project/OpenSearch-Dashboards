/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AggregationType, TimeUnit } from '../../types';
import { inferTimeIntervals } from '../../bar/bar_chart_utils';
import { parseUTCDate } from '../utils';
import { aggregateValues } from './utils/aggregation';
import { roundToTimeUnit } from './utils/time';
import { normalizeEmptyValue } from './utils/normalization';

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
      groupValue = row[groupBy];
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
