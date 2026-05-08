/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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
