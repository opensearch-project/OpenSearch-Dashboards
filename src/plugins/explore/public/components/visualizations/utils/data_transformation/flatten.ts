/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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
