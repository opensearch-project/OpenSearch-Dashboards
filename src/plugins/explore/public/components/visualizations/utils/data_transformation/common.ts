/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Map data
 * @param mapConditionFn
 * @returns Function that map data with fields
 *
 * Usage examples:
 *
 * 1. Map columns - select specific columns from data:
 * const columnMapper = map(pick(['category1', 'category2']));
 * const result = columnMapper(data); // Only 'category1' and 'category2' columns
 *
 * 2. Map rows - keep rows that meet a condition:
 * For row mapping, combine with filter(Boolean) to remove null entries
 * const rowMapper = map((row) => row.category ==='A' ? row : null);
 * const adults = rowMapper(data).filter(Boolean); // Remove null entries
 */

export const map = (mapConditionFn: (row: Record<string, any>) => Record<string, any>) => (
  data: Array<Record<string, any>>
): Array<Record<string, any>> => {
  return data.map(mapConditionFn);
};

// Helper to create column selection
export const pick = (columns: string[]) => (row: Record<string, any>) => {
  const result: Record<string, any> = {};
  columns.forEach((col) => {
    if (col in row) result[col] = row[col];
  });
  return result;
};

/**
 * Calculate y-axis max based on data values vs highestThreshold
 */
export const calculateYAxisMax = ({
  categoryField,
  seriesField,
  highestThreshold,
  isStacked = false,
  shouldCalculate = false,
}: {
  categoryField: string;
  seriesField: string;
  highestThreshold: number;
  isStacked?: boolean;
  shouldCalculate?: boolean;
}) => (data: Array<Record<string, any>>) => {
  if (!shouldCalculate) return data;
  let maxValue = 0;

  const groupedData: Record<string, Array<Record<string, any>>> = data.reduce((groups, row) => {
    const categoryValue = String(row[categoryField]);
    if (!groups[categoryValue]) {
      groups[categoryValue] = [];
    }
    groups[categoryValue].push(row);
    return groups;
  }, {});

  Object.values(groupedData).forEach((categoryRows) => {
    if (isStacked) {
      // Stacked bar: add all series values within this category
      const categoryMaxValue = categoryRows.reduce(
        (seriesTotal: number, row: Record<string, any>) => {
          const value = typeof row[seriesField] === 'number' ? row[seriesField] : 0;
          return seriesTotal + Math.max(0, value);
        },
        0
      );

      maxValue = Math.max(maxValue, categoryMaxValue);
    } else {
      // Single bar | multi-lines: find max individual value within this category
      categoryRows.forEach((row: Record<string, any>) => {
        const value = typeof row[seriesField] === 'number' ? row[seriesField] : 0;
        maxValue = Math.max(maxValue, value);
      });
    }
  });

  // set y-axis max if threshold exceeds data
  if (maxValue <= highestThreshold) {
    // Add space to prevent bars from touching the top
    const buffer = highestThreshold * 0.02;
    maxValue = Math.ceil(highestThreshold + buffer);

    return [{ yAxisExtend: maxValue }];
  }

  return data;
};
