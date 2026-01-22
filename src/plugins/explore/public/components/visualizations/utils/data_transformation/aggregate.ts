/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AggregationType, TimeUnit } from '../../types';
import { inferTimeIntervals } from '../../bar/bar_chart_utils';
import { parseUTCDate } from '../utils';
import { aggregateValues } from './utils/aggregation';
import { roundToTimeUnit } from './utils/time';
import { CalculationMethod } from '../calculation';

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
  aggregationType?: AggregationType;
  timeUnit?: TimeUnit;
  // TODO: align AggregationType and CalculationMethod
  calculateType?: CalculationMethod;
}) => (data: Array<Record<string, any>>) => {
  const { groupBy, field, aggregationType, timeUnit, calculateType } = options;

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
      if (!row[groupBy]) {
        return acc; // Skip rows with missing time field
      }
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
      // NOTE: this will convert undefined to "undefined" and null to "null" intentionally
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
    // values is guaranteed to have at least one element since groups
    // are only created when valid values exist
    const aggregatedValue = aggregateValues(aggregationType, values, calculateType);

    const isValidNumber =
      aggregatedValue !== undefined &&
      typeof aggregatedValue === 'number' &&
      !isNaN(aggregatedValue);

    return {
      [groupBy]: groupValue,
      [field]: isValidNumber ? aggregatedValue : null,
    };
  });

  // Sort by time if time-based
  if (isTimeBased) {
    result = result.sort((a, b) => (a[groupBy] as Date).getTime() - (b[groupBy] as Date).getTime());
  }

  return result;
};

// TODO: can be integrated with aggregate
export const aggregateByGroups = (options: {
  groupBy: string[];
  field: string;
  aggregationType: AggregationType;
}) => (data: Array<Record<string, any>>) => {
  const { groupBy, field, aggregationType } = options;

  const grouped = data.reduce((acc, row) => {
    const groupKey = groupBy.reduce((ac, group) => `${ac}+${row[group]}`, '');
    const groupValue = groupBy.map((group) => ({
      [group]: row[group],
    }));

    const value = Number(row[field]);
    if (!isNaN(value)) {
      if (!acc[groupKey]) {
        acc[groupKey] = { groupValue, values: [] };
      }
      acc[groupKey].values.push(value);
    }

    return acc;
  }, {} as Record<string, { groupValue: Array<Record<string, any>>; values: number[] }>);

  // Apply aggregation and convert to array of objects
  const result = Object.values(grouped).map(({ groupValue, values }) => {
    // values is guaranteed to have at least one element since groups
    // are only created when valid values exist
    const aggregatedValue: number = aggregateValues(aggregationType, values) ?? 0;

    const groupKey = Object.assign({}, ...groupValue);
    return {
      ...groupKey,
      [field]: aggregatedValue,
    };
  });

  return result;
};
