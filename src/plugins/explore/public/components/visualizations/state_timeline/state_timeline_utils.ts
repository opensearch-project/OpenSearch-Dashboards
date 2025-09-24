/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { groupBy } from 'lodash';
import { RangeValue, ValueMapping } from '../types';

const addThresholdTime = (currentTime: string, threshold: string): number | undefined => {
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

const disconnectValues = (next: string, last: string, disableThreshold?: string): string => {
  // Determines a "disconnect point" between two timestamps based on an optional threshold.
  const nextTime = new Date(next).getTime();
  const lastTimeWithThreshold = disableThreshold
    ? addThresholdTime(last, disableThreshold)
    : new Date(last).getTime();

  // If the adjusted last time exists and is earlier than the next time,
  // return it as the disconnect point
  if (lastTimeWithThreshold !== undefined && lastTimeWithThreshold < nextTime) {
    return new Date(lastTimeWithThreshold).toISOString();
  }

  return next;
};

const connectNullValue = (curr: string, end: string, connectThreshold: string) => {
  // try to "extend" lastNotNull's timestamp forward,
  // if the gap between lastNotNull and curr fits within connectThreshold, use currentTime, or use firstNullTime

  const lastNotNullTimeAddThreshold = addThresholdTime(end, connectThreshold);

  if (lastNotNullTimeAddThreshold && new Date(curr).getTime() < lastNotNullTimeAddThreshold) {
    return curr;
  }

  return end;
};

const mergeRecords = (
  records: Array<Record<string, any>>,
  timestampField: string,
  nextData?: string
) => {
  return {
    ...records[0],
    start: records[0][timestampField],
    end: nextData ? nextData : records[records.length - 1][timestampField],
    last: records[records.length - 1][timestampField],
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
  groupField2?: string,
  mappings?: ValueMapping[],
  disableThreshold?: string,
  connectThreshold?: string
): [Array<Record<string, any>>, ValueMapping[] | undefined] => {
  if (!timestampField || !groupField1 || !groupField2) return [data, []];

  const sorted = [...data].sort(
    (a, b) => new Date(a[timestampField]).getTime() - new Date(b[timestampField]).getTime()
  );

  // Collect all possible values from the secondary field
  const allPossibleOptions = Object.keys(groupBy(sorted, (item) => item[groupField2]));

  const validValues = mappings?.filter((r) => {
    if (!r.value) return false;
    return allPossibleOptions.includes(r.value);
  });

  // if validValues doesn't exist, fallback to group values by groupField2 and present a stacked bar
  if (validValues?.length === 0) {
    return [fallbackForCategorical(sorted, timestampField, groupField1, groupField2), []];
  }

  const groups = groupBy(sorted, (item) => item[groupField1]);

  const merged: Array<Record<string, any>> = [];

  const findValue = (value: string) => validValues?.find((v) => v.value === value)?.value;

  for (const g1 of Object.values(groups)) {
    // Buffer for consecutive same-value entries in a group
    let buffer: Array<Record<string, any>> = [];
    let currentValue: string | undefined;
    let firstInvalidValueTime;

    for (let i = 0; i < g1.length; i++) {
      const curr = g1[i];
      // const prev = buffer.length ? buffer[0][groupField2] : null;

      const targetValue = findValue(curr[groupField2]);

      // If the current data point does not belong to any defined value mappings
      if (!targetValue && buffer.length > 0) {
        // record the first InvalidValueTime
        firstInvalidValueTime ??= curr[timestampField];

        const newTime = disconnectValues(
          curr[timestampField],
          buffer[buffer.length - 1][timestampField],
          disableThreshold
        );
        const rec = mergeRecords(buffer, timestampField, newTime);
        merged.push(rec);
        buffer = [];
        currentValue = undefined;

        continue;
      }

      // first valid record after a lists of invalid records
      if (!currentValue && merged.length > 0 && firstInvalidValueTime && connectThreshold) {
        const lastNotNull = merged[merged.length - 1];

        // only connect entries that has same value
        if (lastNotNull[groupField2] === curr[groupField2]) {
          const newTime = connectNullValue(curr[timestampField], lastNotNull.end, connectThreshold);

          merged[merged.length - 1] = {
            ...lastNotNull,
            end: newTime,
          };
        }

        firstInvalidValueTime = undefined;
      }

      // If current value as previous or first entry, add to buffer
      if (currentValue === targetValue || currentValue === undefined) {
        buffer.push(curr);
        currentValue = targetValue;
      } else {
        // Value changed - merge buffered entries and start new buffer
        if (buffer.length > 0) {
          // use disthreshold to get the endTime
          const newTime = disconnectValues(
            curr[timestampField],
            buffer[buffer.length - 1][timestampField],
            disableThreshold
          );

          const rec = mergeRecords(buffer, timestampField, newTime);
          merged.push(rec);
        }
        currentValue = targetValue;
        buffer = [curr];
      }
    }
    // Merge any remaining buffered entries
    if (buffer.length > 0) {
      const rec = mergeRecords(buffer, timestampField);
      merged.push(rec);
    }
  }
  return [merged, validValues];
};

const mergeNumercialRecord = (
  records: Array<Record<string, any>>,
  timestampField: string,
  range: RangeValue | undefined,
  nextData?: string
) => {
  return {
    ...records[0],
    start: records[0][timestampField],
    end: nextData ? nextData : records[records.length - 1][timestampField],
    last: records[records.length - 1][timestampField],
    ...(range ? { mergedLabel: `[${range?.min},${range?.max})` } : {}),
    mergedCount: records.length,
  };
};

/**
 * Merges consecutive data points by a field that fall within the same numerical range.
 */
export const mergeNumericalData = (
  data: Array<Record<string, any>>,
  timestampField?: string,
  groupField?: string,
  rangeField?: string,
  mappings?: ValueMapping[],
  disableThreshold?: string,
  connectThreshold?: string
): [Array<Record<string, any>>, ValueMapping[] | undefined] => {
  if (!timestampField || !groupField || !rangeField) return [data, []];

  const sorted = [...data].sort(
    (a, b) => new Date(a[timestampField]).getTime() - new Date(b[timestampField]).getTime()
  );

  // Filter ranges to only include those within data bounds
  const validRanges = mappings?.filter((r) => {
    if (!r.range) return false;
    if (r?.range?.min === undefined || r?.range?.max === undefined) return false;
    // if (r.range.max > max) return false;

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

  // if validRange doesn't exist, fallback to compute the entire count through the time range
  if (validRanges?.length === 0) {
    return [fallbackMerge(sorted, timestampField, groupField), []];
  }

  const groups = groupBy(sorted, (item) => item[groupField]);
  const merged: Array<Record<string, any>> = [];

  const findRange = (value: number) =>
    validRanges?.find(
      (r) =>
        r?.range?.min !== undefined &&
        r?.range?.max !== undefined &&
        r.range.min <= value &&
        r.range.max > value
    )?.range;

  for (const g1 of Object.values(groups)) {
    let buffer: Array<Record<string, any>> = [];
    let currentRange: RangeValue | undefined;
    let firstInvalidValueTime;

    for (let i = 0; i < g1.length; i++) {
      const curr = g1[i];

      const range = findRange(Number(curr[rangeField]));

      // If the current data point does not belong to any defined ranges
      if (!range && buffer.length > 0) {
        firstInvalidValueTime ??= curr[timestampField];

        const next = disconnectValues(
          curr[timestampField],
          buffer[buffer.length - 1][timestampField],
          disableThreshold
        );
        const rec = mergeNumercialRecord(buffer, timestampField, currentRange, next);
        merged.push(rec);
        buffer = [];
        currentRange = undefined;

        continue;
      }

      // first valid record after a lists of invalid records
      if (!currentRange && merged.length > 0 && firstInvalidValueTime && connectThreshold) {
        const lastNotNull = merged[merged.length - 1];

        if (lastNotNull.mergedLabel === `[${range?.min},${range?.max})`) {
          const newTime = connectNullValue(curr[timestampField], lastNotNull.end, connectThreshold);

          merged[merged.length - 1] = {
            ...lastNotNull,
            end: newTime,
          };
        }

        firstInvalidValueTime = undefined;
      }

      // If same range as previous or first entry, add to buffer
      if (currentRange === range || currentRange === undefined) {
        buffer.push(curr);
        currentRange = range;
      } else {
        // Range changed - merge buffered entries and start new buffer
        if (buffer.length > 0) {
          const next = disconnectValues(
            curr[timestampField],
            buffer[buffer.length - 1][timestampField],
            disableThreshold
          );
          const rec = mergeNumercialRecord(buffer, timestampField, currentRange, next);
          merged.push(rec);
        }

        buffer = [curr];
        currentRange = range;
      }
    }

    // Merge any remaining buffered entries, no need to pass nextTime
    if (buffer.length > 0) {
      const rec = mergeNumercialRecord(buffer, timestampField, currentRange);
      merged.push(rec);
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

  return result;
};

// Fallback: when no valid values exist, group same values
const fallbackForCategorical = (
  sorted: Array<Record<string, any>>,
  timestampField: string,
  groupField1: string,
  groupField2: string
) => {
  const groups = groupBy(sorted, (item) => item[groupField1]);

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
        if (buffer.length > 0) {
          const rec = mergeRecords(buffer, timestampField, curr[timestampField]);
          merged.push(rec);
        }
        if (curr[groupField2] === undefined || curr[groupField2] === null) {
          buffer = [];
          continue;
        }
        buffer = [curr];
      }
    }

    // Merge any remaining buffered entries
    if (buffer.length) {
      const rec = mergeRecords(buffer, timestampField);
      if (rec) merged.push(rec);
    }
  }

  return merged;
};
