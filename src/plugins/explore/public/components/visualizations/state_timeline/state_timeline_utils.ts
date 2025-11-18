/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { groupBy } from 'lodash';
import { FilterOption, RangeValue, Threshold, ValueMapping } from '../types';

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

const generatedDisconnectTimestamp = (
  next: string,
  last: string,
  disconnectThreshold?: string
): string => {
  // Determines a "disconnect point" between two timestamps based on an optional threshold.
  const nextTime = new Date(next).getTime();
  const lastTimeWithThreshold = disconnectThreshold
    ? addThresholdTime(last, disconnectThreshold)
    : undefined;

  // If the adjusted last time exists and is earlier than the next time,
  // return it as the disconnect point
  if (lastTimeWithThreshold && lastTimeWithThreshold < nextTime) {
    return new Date(lastTimeWithThreshold).toISOString();
  }

  return next;
};

const formatDuration = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds) parts.push(`${seconds}s`);
  return parts.join(' ') || '0s';
};

const mergeRecords = (
  records: Array<Record<string, any>>,
  timestampField: string,
  nextData?: string
) => {
  const endTime = nextData ? nextData : records[records.length - 1][timestampField];
  const startTime = records[0][timestampField];
  const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
  return {
    ...records[0],
    start: startTime,
    end: endTime,
    mergedCount: records.length,
    duration: formatDuration(duration),
  };
};

const mergeNumercialRecord = (
  records: Record<string, any>,
  timestampField: string,
  nextData?: string,
  range?: RangeValue
) => {
  const endTime = nextData ? nextData : records[records.length - 1][timestampField];
  const startTime = records[0][timestampField];
  const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
  return {
    ...records[0],
    start: startTime,
    end: endTime,
    ...(range ? { mergedLabel: `[${range?.min},${range?.max ?? '∞'})` } : {}),
    duration: formatDuration(duration),
    mergedCount: records.length,
  };
};

export const convertThresholdsToValueMappings = (thresholds: Threshold[]): ValueMapping[] => {
  return thresholds.map((t, i) => ({
    type: 'range',
    range: {
      min: t.value,
      max: i === thresholds.length - 1 ? Infinity : thresholds[i + 1].value,
    },
    color: t.color,
  }));
};

/**
 * Merges consecutive data points with the same categorical value.
 */
export const mergeCategoricalData = (
  data: Array<Record<string, any>>,
  timestampField?: string,
  groupField1?: string,
  groupField2?: string,
  mappings?: ValueMapping[],
  disconnectThreshold?: string,
  connectThreshold?: string,
  filterOption: FilterOption = 'none'
): [Array<Record<string, any>>, ValueMapping[] | undefined] => {
  if (!timestampField || !groupField1 || !groupField2) return [data, []];

  const sorted = [...data].sort(
    (a, b) => new Date(a[timestampField]).getTime() - new Date(b[timestampField]).getTime()
  );
  // Collect all possible values from the secondary categorical field
  const allPossibleOptions = Object.keys(groupBy(sorted, (item) => item[groupField2]));

  const validValues = mappings?.filter((r) => {
    if (!r.value) return false;
    return allPossibleOptions.includes(r.value);
  });

  // if validValues doesn't exist, fallback to group values by groupField2 and present a stacked bar
  if (validValues?.length === 0 || filterOption === 'none') {
    return [fallbackForCategorical(sorted, timestampField, groupField1, groupField2), []];
  }

  const findValue = (value: string) => {
    const find = validValues?.find((v) => v.value === `${value}`)?.value;
    return find ? find : value;
  };

  const merged = mergeByGroup<string>({
    sorted,
    groupField: groupField1,
    valueField: groupField2,
    timestampField,
    disconnectThreshold,
    connectThreshold,
    findTarget: findValue,
    mergeFn: mergeRecords,
  });

  return [merged, validValues];
};

export const mergeSingleCategoricalData = (
  data: Array<Record<string, any>>,
  timestampField?: string,
  groupField1?: string,
  mappings?: ValueMapping[],
  disconnectThreshold?: string,
  connectThreshold?: string,
  filterOption: FilterOption = 'none'
): [Array<Record<string, any>>, ValueMapping[] | undefined] => {
  if (!timestampField || !groupField1) return [data, []];

  const sorted = [...data].sort(
    (a, b) => new Date(a[timestampField]).getTime() - new Date(b[timestampField]).getTime()
  );

  // Collect all possible values from the secondary field
  const allPossibleOptions = Object.keys(groupBy(sorted, (item) => item[groupField1]));

  const validValues = mappings?.filter((r) => {
    if (!r.value) return false;
    return allPossibleOptions.includes(r.value);
  });

  // if validValues doesn't exist, fallback to group values by groupField2 and present a stacked bar
  if (!validValues || validValues?.length === 0 || filterOption === 'none') {
    return [fallbackForSingleCategorical(sorted, timestampField, groupField1), []];
  }

  const findValue = (value: string) => {
    // Handle empty value
    // TODO Consider special values in value mapping
    if (value === null || value === undefined) return undefined;
    const find = validValues?.find((v) => v.value === `${value}`)?.value;
    return find ? find : value;
  };

  const merged: Array<Record<string, any>> = [];

  const buffer: Array<Record<string, any>> = [];
  let currentValue: string | undefined;

  const storeState = { buffer, currentValue };

  mergeInAGroup<string>({
    sorted,
    timestampField,
    valueField: groupField1,
    disconnectThreshold,
    connectThreshold,
    merged,
    storeState,
    findTarget: findValue,
    mergeFn: mergeRecords,
  });

  // Merge any remaining buffered entries, no need to pass nextTime
  if (storeState.buffer.length > 0) {
    const rec = mergeRecords(buffer, timestampField, undefined);
    merged.push(rec);
  }

  return [merged, validValues];
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
  disconnectThreshold?: string,
  connectThreshold?: string,
  filterOption: FilterOption = 'none'
): [Array<Record<string, any>>, ValueMapping[] | undefined] => {
  if (!timestampField || !groupField || !rangeField) return [data, []];

  const sorted = [...data].sort(
    (a, b) => new Date(a[timestampField]).getTime() - new Date(b[timestampField]).getTime()
  );

  // Filter ranges to only include those within data bounds
  const validRanges = mappings?.filter((r) => {
    if (!r.range) return false;
    if (r?.range?.min === undefined) return false;

    return sorted.some((s) => {
      const value = Number(s[rangeField]);
      return (
        r.range?.min !== undefined && value >= r.range.min && value < (r.range.max ?? Infinity)
      );
    });
  });

  // if validRange doesn't exist, fallback to categorical state timeline
  if (validRanges?.length === 0 || filterOption === 'none') {
    return [fallbackForCategorical(sorted, timestampField, groupField, rangeField), []];
  }

  const findRange = (value: string) => {
    // Handle empty value
    if (value === null || value === undefined) return undefined;
    const numberValue = Number(value);
    const range = validRanges?.find(
      (r) =>
        r?.range?.min !== undefined &&
        r.range.min <= numberValue &&
        (r.range.max ?? Infinity) > numberValue
    )?.range;

    // if unmatched, return an invalid range as indentifier
    return range ? range : { min: Infinity, max: Infinity };
  };

  const merged = mergeByGroup<RangeValue>({
    sorted,
    groupField,
    valueField: rangeField,
    timestampField,
    disconnectThreshold,
    connectThreshold,
    findTarget: findRange,
    mergeFn: mergeNumercialRecord,
  });

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
    const endTime = g1[g1.length - 1][timestampField];
    const startTime = g1[0][timestampField];
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
    result.push({
      ...g1[0],
      start: startTime,
      end: endTime,
      mergedCount: g1.length,
      duration: formatDuration(duration),
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

      if (!buffer?.length && (curr[groupField2] === undefined || curr[groupField2] === null))
        continue;

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

// Fallback: when no valid values exist, group same values
const fallbackForSingleCategorical = (
  sorted: Array<Record<string, any>>,
  timestampField: string,
  groupField1: string
) => {
  const merged: Array<Record<string, any>> = [];
  let buffer: Array<Record<string, any>> = [];
  for (let i = 0; i < sorted.length; i++) {
    const curr = sorted[i];
    const prev = buffer.length ? buffer[0][groupField1] : null;

    if (curr[groupField1] === prev) {
      buffer.push(curr);
    } else {
      // Value changed - merge buffered entries and start new buffer
      if (buffer.length > 0) {
        const rec = mergeRecords(buffer, timestampField, curr[timestampField]);
        merged.push(rec);
      }
      if (curr[groupField1] === undefined || curr[groupField1] === null) {
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

  return merged;
};

type MergeFn<T extends string | RangeValue> = (
  buffer: Array<Record<string, any>>,
  timestampField: string,
  endTime?: string,
  vaule?: T
) => any;
interface MergeOptions<T extends string | RangeValue> {
  sorted: Array<Record<string, any>>;
  timestampField: string;
  groupField: string;
  valueField: string;
  disconnectThreshold?: string;
  connectThreshold?: string;
  findTarget: (value: string) => T | undefined;
  mergeFn: MergeFn<T>;
}
const mergeByGroup = <T extends string | RangeValue>({
  sorted,
  groupField,
  valueField,
  timestampField,
  disconnectThreshold,
  connectThreshold,
  findTarget,
  mergeFn,
}: MergeOptions<T>) => {
  const groups = groupBy(sorted, (item) => item[groupField]);
  const merged: Array<Record<string, any>> = [];

  for (const g1 of Object.values(groups)) {
    const buffer: Array<Record<string, any>> = [];
    let currentValue: T | undefined;

    const storeState = { buffer, currentValue };

    mergeInAGroup({
      sorted: g1,
      timestampField,
      valueField,
      disconnectThreshold,
      connectThreshold,
      merged,
      storeState,
      findTarget,
      mergeFn,
    });

    // Merge any remaining buffered entries, no need to pass nextTime
    if (storeState.buffer.length > 0) {
      const rec = mergeFn(storeState.buffer, timestampField, undefined, storeState.currentValue);
      merged.push(rec);
    }
  }

  return merged;
};

interface MergeInAGroupOptions<T extends string | RangeValue> {
  sorted: Array<Record<string, any>>;
  timestampField: string;
  valueField: string;
  disconnectThreshold?: string;
  connectThreshold?: string;
  merged: Array<Record<string, any>>;
  storeState: {
    buffer: Array<Record<string, any>>;
    currentValue: T | undefined;
  };
  findTarget: (value: string) => T | undefined;
  mergeFn: MergeFn<T>;
}

export const mergeInAGroup = <T extends string | RangeValue>({
  sorted,
  valueField,
  timestampField,
  disconnectThreshold,
  connectThreshold,
  merged,
  storeState,
  findTarget,
  mergeFn,
}: MergeInAGroupOptions<T>) => {
  const flushBuffer = (nextTimestamp: string) => {
    if (storeState.buffer.length === 0) return;
    const next = generatedDisconnectTimestamp(
      nextTimestamp,
      storeState.buffer[storeState.buffer.length - 1][timestampField],
      disconnectThreshold
    );
    const rec = mergeFn(storeState.buffer, timestampField, next, storeState.currentValue);
    merged.push(rec);
    storeState.buffer.length = 0;
    storeState.currentValue = undefined;
  };
  let firstNullValueTime: string | undefined;
  for (const curr of sorted) {
    const currentMapping = findTarget(curr[valueField]);

    if (
      (curr[valueField] === undefined || curr[valueField] === null) &&
      storeState.buffer.length > 0
    ) {
      firstNullValueTime ??= curr[timestampField];

      // if connect null values is on, push null data points into buffer
      if (connectThreshold && firstNullValueTime) {
        const thresholdTime = addThresholdTime(firstNullValueTime, connectThreshold);
        if (thresholdTime && new Date(curr[timestampField]).getTime() >= thresholdTime) {
          continue;
        }
        storeState.buffer.push(curr);
        continue;
      }
      flushBuffer(curr[timestampField]);
      continue;
    }

    // Handle first non-null value after a series of nulls when connect threshold is enabled
    // to check if last null can be connected or not
    if (firstNullValueTime && connectThreshold && storeState.buffer.length > 0) {
      const thresholdTime = addThresholdTime(firstNullValueTime, connectThreshold);
      const shouldFlush =
        thresholdTime && new Date(curr[timestampField]).getTime() >= thresholdTime;

      // If threshold exceeded(cannot connect the last null)flush the buffer and continue processing
      if (shouldFlush) {
        const lastTime = storeState.buffer[storeState.buffer.length - 1][timestampField];
        flushBuffer(lastTime);
      }

      // Reset null tracking variables
      firstNullValueTime = undefined;
    }

    // Handle invalid mappings
    if (currentMapping === undefined || currentMapping === null) {
      flushBuffer(curr[timestampField]);
      continue;
    }
    // Add to buffer or flush and start new
    if (storeState.currentValue === currentMapping || storeState.currentValue === undefined) {
      storeState.buffer.push(curr);
      storeState.currentValue = currentMapping;
    } else {
      flushBuffer(curr[timestampField]);
      storeState.buffer.push(curr);
      storeState.currentValue = currentMapping;
    }
  }
};
