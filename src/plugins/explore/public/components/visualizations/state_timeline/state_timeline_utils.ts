/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { groupBy } from 'lodash';
import { RangeValue, ValueMapping } from '../types';

const mergeRecords = (
  records: Array<Record<string, any>>,
  timestampField: string,
  nextData?: Record<string, any>
) => {
  if (!records.length) return null;
  return {
    ...records[0],
    start: records[0][timestampField],
    end: nextData ? nextData[timestampField] : records[records.length - 1][timestampField],
    mergedCount: records.length,
  };
};

/**
 * Merges consecutive data points with the same categorical value.
 */
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

  // Collect all possible values from the secondary field for reference which will be used later
  const allPossibleOptions = Object.keys(groupBy(data, (item) => item[groupField2]));

  const merged: Array<Record<string, any>> = [];

  for (const g1 of Object.values(groups)) {
    // Buffer for consecutive same-value entries
    let buffer: Array<Record<string, any>> = [];

    for (let i = 0; i < g1.length; i++) {
      const curr = g1[i];
      const prev = buffer.length ? buffer[0][groupField2] : null;

      if (curr[groupField2] === prev) {
        buffer.push(curr);
      } else {
        // Value changed - merge buffered entries and start new buffer
        const rec = mergeRecords(buffer, timestampField, curr);
        if (rec) merged.push(rec);
        if (curr[groupField2] === undefined || curr[groupField2] === null) continue;
        buffer = [curr];
      }
    }

    // Merge any remaining buffered entries
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
  range: RangeValue | undefined,
  nextData?: string
) => {
  if (!records.length) return null;
  return {
    ...records[0],
    start: records[0][timestampField],
    end: nextData ? nextData : records[records.length - 1][timestampField],
    ...(range ? { mergedLabel: `[${range?.min},${range?.max})` } : {}),
    mergedCount: records.length,
  };
};

const computeDisableThreshold = (currentTime: string, threshold: string): number | undefined => {
  const date = new Date(currentTime.replace(' ', 'T'));
  if (isNaN(date.getTime())) {
    return undefined;
  }

  const match = threshold.match(/^(\d+)([hms])$/);
  if (!match) {
    return undefined;
  }

  const value = Number(match[1]);
  const unit = match[2];
  let offset = 0;

  switch (unit) {
    case 'h':
      offset = value * 60 * 60 * 1000;
      break;
    case 'm':
      offset = value * 60 * 1000;
      break;
    case 's':
      offset = value * 1000;
      break;
  }

  return date.getTime() + offset;
};

const computeTime = (next: string, last: string, disableThreshold?: string): string => {
  const nextTime = new Date(next).getTime();
  const lastTimeWithThreshold =
    typeof disableThreshold === 'string'
      ? computeDisableThreshold(last, disableThreshold)
      : new Date(last).getTime() + Number(disableThreshold);

  if (lastTimeWithThreshold !== undefined && lastTimeWithThreshold < nextTime) {
    return new Date(lastTimeWithThreshold).toISOString();
  }

  return new Date(nextTime).toISOString();
};

/**
 * Merges consecutive data points by a field that fall within the same numerical range.
 */
export const mergeNumericalData = (
  data: Array<Record<string, any>>,
  timestampField?: string,
  groupField?: string,
  rangeField?: string,
  ranges?: ValueMapping[],
  disableThreshold?: string
) => {
  if (!timestampField || !groupField || !rangeField) return data;

  const sorted = [...data].sort(
    (a, b) => new Date(a[timestampField]).getTime() - new Date(b[timestampField]).getTime()
  );

  console.log('sorted', sorted);

  // Calculate max values for range validation
  const max = Math.max(...sorted.map((s) => Number(s[rangeField])));

  // Filter ranges to only include those within data bounds
  const validRanges = ranges?.filter((r) => {
    if (!r.range) return false;
    if (r?.range?.min === undefined || r?.range?.max === undefined) return false;
    if (r.range.max > max) return false;

    return sorted.some((s) => {
      const value = Number(s[rangeField]);
      return (
        r.range?.min !== undefined &&
        r.range?.max !== undefined &&
        value >= r.range.min &&
        value < r.range.max
      );
    });
  });

  // if validRange doesn't exist, use fallback log to compute the entire count through the time range
  if (validRanges?.length === 0) {
    return fallbackMerge(sorted, timestampField, groupField);
  }

  const groups = groupBy(sorted, (item) => item[groupField]);
  const merged: Array<Record<string, any>> = [];

  for (const g1 of Object.values(groups)) {
    let buffer: Array<Record<string, any>> = []; // Buffer for consecutive same-range entries
    let currentRange: RangeValue | undefined;

    for (let i = 0; i < g1.length; i++) {
      const curr = g1[i];

      // Find which range this data point belongs to
      const range = ranges?.find(
        (r) =>
          r?.range?.min !== undefined &&
          r?.range?.max !== undefined &&
          r?.range?.min <= Number(curr[rangeField]) &&
          r?.range?.max > Number(curr[rangeField])
      )?.range;

      if (!range) {
        if (buffer.length > 0) {
          const next = computeTime(
            curr[timestampField],
            buffer[buffer.length - 1][timestampField],
            disableThreshold
          );
          const rec = mergeNumercialRecord(buffer, timestampField, currentRange, next);
          if (rec) {
            merged.push(rec);
            buffer = [];
            currentRange = undefined;
          }
        }
        continue;
      }

      // If same range as previous or first entry, add to buffer
      if (currentRange === range || currentRange === undefined) {
        buffer.push(curr);
        currentRange = range;
      } else {
        // Range changed - merge buffered entries and start new buffer
        if (buffer.length) {
          const next = computeTime(
            curr[timestampField],
            buffer[buffer.length - 1][timestampField],
            disableThreshold
          );
          const rec = mergeNumercialRecord(buffer, timestampField, currentRange, next);
          if (rec) merged.push(rec);
        }
        buffer = [curr];
        currentRange = range;
      }
    }

    // Merge any remaining buffered entries, no need to pass nextTime
    if (buffer.length) {
      const rec = mergeNumercialRecord(buffer, timestampField, currentRange);
      if (rec) merged.push(rec);
    }
  }

  return [merged, validRanges];
};

// Fallback: when no valid ranges exist, create timeline bars showing count per group
const fallbackMerge = (
  sorted: Array<Record<string, any>>,
  timestampField: string,
  groupField: string
) => {
  const groups = groupBy(sorted, (item) => item[groupField]);

  const result: Array<Record<string, any>> = [];

  for (const g1 of Object.values(groups)) {
    result.push({
      ...g1[0],
      start: g1[0][timestampField],
      end: g1[g1.length - 1][timestampField],
      mergedCount: g1.length,
    });
  }

  return [result, []];
};
