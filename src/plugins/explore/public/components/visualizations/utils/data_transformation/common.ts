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
