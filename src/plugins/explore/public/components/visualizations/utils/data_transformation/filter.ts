/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * filter data
 * @param filterConditionFn
 * @returns Function that filter data with fields
 *
 * Usage examples:
 *
 * 1. Filter columns - select specific columns from data:
 * const columnFilter = filter(selectColumns(['category1', 'category2']));
 * const result = columnFilter(data); // Only 'category1' and 'category2' columns
 *
 * 2. Filter rows - keep rows that meet a condition:
 * For row filtering, combine with filter(Boolean) to remove null entries
 * const rowFilter = filter((row) => row.category ==='A' ? row : null);
 * const adults = rowFilter(data).filter(Boolean); // Remove null entries
 */

export const filter = (filterConditionFn: (row: Record<string, any>) => Record<string, any>) => (
  data: Array<Record<string, any>>
): Array<Record<string, any>> => {
  return data.map(filterConditionFn);
};

// Helper to create column filter
export const selectColumns = (columns: string[]) => (row: Record<string, any>) => {
  const result: Record<string, any> = {};
  columns.forEach((col) => {
    if (col in row) result[col] = row[col];
  });
  return result;
};
