/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { groupBy } from 'lodash';
import { RangeValue, ValueMapping } from '../types';

const mergeRecords = (records: Array<Record<string, any>>, timestampField: string) => {
  if (!records.length) return null;
  return {
    ...records[0],
    start: records[0][timestampField],
    end: records[records.length - 1][timestampField],
    mergedCount: records.length,
  };
};

export const mergeData = (
  data: Array<Record<string, any>>,
  timestampField?: string,
  groupField1?: string,
  groupField2?: string
) => {
  if (!timestampField || !groupField1 || !groupField2) return data;
  const sorted = [...data].sort(
    (a, b) => new Date(a[timestampField]).getTime() - new Date(b[timestampField]).getTime()
  );

  const groups = groupBy(sorted, (item) => item[groupField1]);

  const allPossibleOptions = Object.keys(groupBy(data, (item) => item[groupField2]));

  const merged: Array<Record<string, any>> = [];

  for (const g1 of Object.values(groups)) {
    let buffer: Array<Record<string, any>> = [];
    for (let i = 0; i < g1.length; i++) {
      const curr = g1[i];
      const prev = buffer.length ? buffer[0][groupField2] : null;
      if (curr[groupField2] === prev) {
        buffer.push(curr);
      } else {
        const rec = mergeRecords(buffer, timestampField);
        if (rec) merged.push(rec);
        buffer = [curr];
      }
    }
    if (buffer.length) {
      const rec = mergeRecords(buffer, timestampField);
      if (rec) merged.push(rec);
    }
  }

  return [merged, allPossibleOptions];
};

const mergeNumercialRecord = (
  records: Array<Record<string, any>>,
  timestampField: string,
  range: RangeValue | undefined
) => {
  if (!records.length) return null;
  return {
    ...records[0],
    start: records[0][timestampField],
    end: records[records.length - 1][timestampField],
    ...(range ? { mergedLabel: `located in [${range.min},${range.max}]` } : {}),
    mergedCount: records.length,
  };
};

export const mergeNumericalData = (
  data: Array<Record<string, any>>,
  timestampField?: string,
  groupField?: string,
  rangeField?: string,
  ranges?: ValueMapping[]
) => {
  if (!timestampField || !groupField || !rangeField) return data;
  const sorted = [...data].sort(
    (a, b) => new Date(a[timestampField]).getTime() - new Date(b[timestampField]).getTime()
  );
  console.log(
    'sorted',
    sorted.filter((s) => s[groupField] === '404')
  );

  const min = Math.min(...sorted.map((s) => Number(s[rangeField])));
  const max = Math.max(...sorted.map((s) => Number(s[rangeField])));

  const validRanges = ranges?.filter(
    (r) =>
      r?.range?.min !== undefined &&
      r?.range?.max !== undefined &&
      r.range.min >= min &&
      r.range.max <= max
  );

  const groups = groupBy(sorted, (item) => item[groupField]);
  const merged: Array<Record<string, any>> = [];

  for (const g1 of Object.values(groups)) {
    let buffer: Array<Record<string, any>> = [];
    let currentRange: RangeValue | undefined;

    for (let i = 0; i < g1.length; i++) {
      const curr = g1[i];

      const range = ranges?.find(
        (r) =>
          r?.range?.min !== undefined &&
          r?.range?.max !== undefined &&
          r?.range?.min <= Number(curr[rangeField]) &&
          r?.range?.max > Number(curr[rangeField])
      )?.range;
      if (!range) {
        if (buffer.length > 0) {
          const rec = mergeNumercialRecord(buffer, timestampField, currentRange);
          if (rec) {
            merged.push(rec);
            buffer = [];
            currentRange = undefined;
          }
        }

        // merged.push(curr);

        continue;
      }
      if (currentRange === range || currentRange === undefined) {
        buffer.push(curr);
        currentRange = range;
      } else {
        if (buffer.length) {
          const rec = mergeNumercialRecord(buffer, timestampField, currentRange);
          if (rec) merged.push(rec);
        }
        buffer = [curr];
        currentRange = range;
      }
    }
    if (buffer.length) {
      const rec = mergeNumercialRecord(buffer, timestampField, currentRange);
      if (rec) merged.push(rec);
    }
  }
  return [merged, validRanges];
};
