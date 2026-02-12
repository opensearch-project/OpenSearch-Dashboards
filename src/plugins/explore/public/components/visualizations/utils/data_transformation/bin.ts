/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AggregationType } from '../../types';
import { aggregateValues } from './utils/aggregation';

interface BinConfig {
  count?: number;
  size?: number;
}

interface BinRange {
  start: number;
  end: number;
  values: number[];
}

/**
 * Rounds a number to a "nice" value for bin sizes.
 * Nice values are typically: 1, 2, 5 multiplied by powers of 10
 * Examples: 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, etc.
 *
 * @param rawStep - The raw calculated step size
 * @returns A "nice" rounded step size
 */
const getNiceNumber = (rawStep: number): number => {
  // Handle edge cases
  if (rawStep <= 0) return 1;
  if (!isFinite(rawStep)) return 1;

  // Get the order of magnitude
  const exponent = Math.floor(Math.log10(rawStep));
  const fraction = rawStep / Math.pow(10, exponent);

  // Round to nice fraction (1, 2, 5)
  let niceFraction: number;
  if (fraction <= 1) {
    niceFraction = 1;
  } else if (fraction <= 2) {
    niceFraction = 2;
  } else if (fraction <= 5) {
    niceFraction = 5;
  } else {
    niceFraction = 10;
  }

  return niceFraction * Math.pow(10, exponent);
};

/**
 * Creates a binning function that groups numerical data into bins and applies aggregation.
 * Returns a function that processes data and returns an array of binned objects.
 *
 * @param options - Binning configuration options
 * @param options.bin - Bin configuration (size or count)
 * @param options.bin.size - Fixed bin width (takes priority over count)
 * @param options.bin.count - Approximate number of bins
 * @param options.binField - Field name to bin (must contain numeric values)
 * @param options.aggregationField - Optional field to aggregate (if not provided, counts records)
 * @param options.aggregationType - Type of aggregation (defaults to COUNT if aggregationField not provided)
 *
 * @returns Function that takes data array and returns array of binned objects with start, end, and value properties
 *
 * @example
 * // Example 1: Simple histogram (count occurrences)
 * // Input data:
 * [
 *   { age: 5 },
 *   { age: 15 },
 *   { age: 17 },
 *   { age: 25 }
 * ]
 *
 * // Usage:
 * const binAge = bin({
 *   bin: { size: 10 },
 *   binField: 'age'
 * });
 *
 * // Output:
 * [
 *   { start: 0, end: 10, value: 1 },
 *   { start: 10, end: 20, value: 2 },
 *   { start: 20, end: 30, value: 1 }
 * ]
 *
 * @example
 * // Example 2: Histogram with aggregation
 * // Input data:
 * [
 *   { price: 5, sales: 100 },
 *   { price: 15, sales: 150 },
 *   { price: 17, sales: 200 },
 *   { price: 25, sales: 120 }
 * ]
 *
 * // Usage:
 * const binPriceAndSumSales = bin({
 *   bin: { count: 3 },
 *   binField: 'price',
 *   aggregationField: 'sales',
 *   aggregationType: AggregationType.SUM
 * });
 *
 * // Output:
 * [
 *   { start: 5, end: 25, value: 100 },
 *   { start: 25, end: 45, value: 470 }
 * ]
 */
export const bin = (options: {
  bin?: BinConfig;
  binField: string;
  valueField?: string;
  aggregationType?: AggregationType;
}) => (data: Array<Record<string, any>>): Array<Record<string, any>> => {
  const { bin: binConfig, binField, valueField, aggregationType } = options;

  // Handle empty data
  if (!data || data.length === 0) {
    return [];
  }

  // Extract valid numeric values from binField
  const validRecords = data.filter((row) => {
    const value = row[binField];
    return value !== null && value !== undefined && !isNaN(Number(value));
  });

  // Handle case with no valid values
  if (validRecords.length === 0) {
    return [];
  }

  // Calculate min and max
  const min = Math.min(...validRecords.map((row) => Number(row[binField])));
  const max = Math.max(...validRecords.map((row) => Number(row[binField])));

  // Handle single value case
  if (min === max) {
    let aggregatedValue: number;
    if (valueField) {
      const values = validRecords.map((row) => Number(row[valueField]));
      aggregatedValue = aggregateValues(aggregationType || AggregationType.SUM, values) ?? 0;
    } else {
      aggregatedValue = validRecords.length;
    }

    return [
      {
        start: min,
        end: max,
        value: aggregatedValue,
      },
    ];
  }

  // Calculate bin step size
  let step: number;
  if (binConfig?.size) {
    // Priority 1: Use explicit size (don't round - user wants exact size)
    step = binConfig.size;
  } else if (binConfig?.count) {
    // Priority 2: Calculate from count and round to nice number
    const rawStep = (max - min) / binConfig.count;
    step = getNiceNumber(rawStep);
  } else {
    // Priority 3: get step with default bucket count 30 and round to nice number
    const rawStep = (max - min) / 30; // fallback to 30 bins
    step = getNiceNumber(rawStep);
  }

  // Align bin start to a nice boundary (round down to nearest multiple of step)
  // Example: min=42.2, step=5 → binStart=40 (gives bins like 40-45, 45-50, etc.)
  const binStart = Math.floor(min / step) * step;

  // Generate bin ranges
  const bins: BinRange[] = [];
  let currentBinStart = binStart;

  while (currentBinStart <= max) {
    const binEnd = currentBinStart + step;
    bins.push({
      start: currentBinStart,
      end: binEnd,
      values: [],
    });
    currentBinStart = binEnd;
  }

  // Assign data points to bins
  for (const row of validRecords) {
    const binValue = Number(row[binField]);

    // Find the appropriate bin using [start, end) convention
    const binIndex = bins.findIndex((binRange) => {
      return binValue >= binRange.start && binValue < binRange.end;
    });

    if (binIndex !== -1) {
      if (valueField) {
        const aggValue = Number(row[valueField]);
        if (!isNaN(aggValue)) {
          bins[binIndex].values.push(aggValue);
        }
      } else {
        // For counting, just push a placeholder
        bins[binIndex].values.push(1);
      }
    }
  }

  // Aggregate within each bin and format output
  const result = bins
    .filter((binRange) => binRange.values.length > 0) // Only include bins with data
    .map((binRange) => {
      let aggregatedValue: number;

      if (valueField && aggregationType) {
        aggregatedValue = aggregateValues(aggregationType, binRange.values) ?? 0;
      } else {
        // Default to COUNT
        aggregatedValue = aggregateValues(AggregationType.COUNT, binRange.values) ?? 0;
      }

      return {
        start: binRange.start,
        end: binRange.end,
        value: aggregatedValue,
      };
    });

  return result;
};
