/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { normalizeEmptyValue } from './data_transformation';

export interface SplitGroup {
  key: string;
  data: Array<Record<string, any>>;
}

/**
 * Groups transformed data by the split field column.
 * Orders groups alphabetically by key.
 */
export function groupDataBySplitField(
  data: Array<Record<string, any>>,
  splitFieldColumn: string
): SplitGroup[] {
  const groupMap = new Map<string, Array<Record<string, any>>>();

  for (const row of data) {
    const key = normalizeEmptyValue(row[splitFieldColumn]);
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
