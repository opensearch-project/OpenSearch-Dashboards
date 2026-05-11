/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SplitGroup {
  key: string;
  data: Array<Record<string, any>>;
}

/**
 * Groups transformed data by the split field column.
 * - Rows with null, undefined, or empty string values are placed in a "-" group.
 * - Orders groups alphabetically by key (with "-" sorted naturally).
 */
export function groupDataBySplitField(
  data: Array<Record<string, any>>,
  splitFieldColumn: string
): SplitGroup[] {
  const EMPTY_GROUP_KEY = '-';
  const groupMap = new Map<string, Array<Record<string, any>>>();

  for (const row of data) {
    const value = row[splitFieldColumn];
    const key =
      value === null || value === undefined || value === '' ? EMPTY_GROUP_KEY : String(value);
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key)!.push(row);
  }

  const sortedKeys = Array.from(groupMap.keys()).sort();

  return sortedKeys.map((key) => ({
    key,
    data: groupMap.get(key)!,
  }));
}
