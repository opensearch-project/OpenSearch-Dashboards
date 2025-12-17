/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AggregationType } from '../types';

/**
 * Helper function to aggregate data for ECharts
 * Returns 2D array with header row for use with ECharts dataset
 *
 * @param data - Raw data array
 * @param groupBy - Field name for categories (e.g., 'product', 'region')
 * @param field - Field name for values (e.g., 'sales', 'count')
 * @param aggregationType - Type of aggregation to apply (SUM, MEAN, MAX, MIN, COUNT, NONE)
 *
 * @returns 2D array with header row
 *
 * @example
 * Input data:
 * [
 *   { product: 'A', sales: 100 },
 *   { product: 'A', sales: 150 },
 *   { product: 'B', sales: 200 }
 * ]
 *
 * Output (with SUM aggregation):
 * [
 *   ['product', 'sales'],  // Header row
 *   ['A', 250],            // Aggregated: 100 + 150
 *   ['B', 200]
 * ]
 */
export const aggregate = (
  data: Array<Record<string, any>>,
  groupBy: string,
  field: string,
  aggregationType: AggregationType
): Array<[string, string] | [string, number]> => {
  // Group by category
  const grouped = data.reduce((acc, row) => {
    const category = String(row[groupBy] ?? '');
    if (!acc[category]) {
      acc[category] = [];
    }
    const value = Number(row[field]);
    if (!isNaN(value)) {
      acc[category].push(value);
    }
    return acc;
  }, {} as Record<string, number[]>);

  // Apply aggregation
  const result: Array<[string, number]> = Object.entries(grouped).map(([category, values]) => {
    let aggregatedValue: number;
    if (values.length === 0) {
      aggregatedValue = 0;
    } else {
      switch (aggregationType) {
        case AggregationType.SUM:
          aggregatedValue = values.reduce((sum: number, v: number) => sum + v, 0);
          break;
        case AggregationType.MEAN:
          aggregatedValue = values.reduce((sum: number, v: number) => sum + v, 0) / values.length;
          break;
        case AggregationType.MAX:
          aggregatedValue = Math.max(...values);
          break;
        case AggregationType.MIN:
          aggregatedValue = Math.min(...values);
          break;
        case AggregationType.COUNT:
          aggregatedValue = values.length;
          break;
        case AggregationType.NONE:
        default:
          aggregatedValue = values[0];
      }
    }

    return [category, aggregatedValue];
  });

  // Return 2D array with header row
  return [[groupBy, field], ...result];
};
