/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { normalizeEmptyValue } from './data_transformation';

export function getSplitKeysBySplitField(
  data: Array<Record<string, any>>,
  splitFieldColumn: string
): string[] {
  return Array.from(new Set(data.map((row) => normalizeEmptyValue(row[splitFieldColumn])))).sort();
}

export function filterDataBySplitField(
  data: Array<Record<string, any>>,
  splitFieldColumn: string,
  splitKey: string
): Array<Record<string, any>> {
  return data.filter((row) => normalizeEmptyValue(row[splitFieldColumn]) === splitKey);
}
