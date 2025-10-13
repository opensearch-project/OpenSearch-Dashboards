/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { groupBy } from 'lodash';
import { RangeValue, Threshold, ValueMapping } from '../types';

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
    : undefined;

  // If the adjusted last time exists and is earlier than the next time,
  // return it as the disconnect point
  if (lastTimeWithThreshold && lastTimeWithThreshold < nextTime) {
    return new Date(lastTimeWithThreshold).toISOString();
  }

  return next;
};

const connectNullValue = (curr: string, end: string, connectThreshold: string) => {
  // try to extend lastNotNull's timestamp forward,
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
    mergedCount: records.length,
  };
};

const mergeNumercialRecord = (
  records: Record<string, any>,
  timestampField: string,
  nextData?: string,
  range?: RangeValue
) => {
  return {
    ...records[0],
    start: records[0][timestampField],
    end: nextData ? nextData : records[records.length - 1][timestampField],
    ...(range ? { mergedLabel: `[${range?.min},${range?.max})` } : {}),
    mergedCount: records.length,
  };
};

export const convertThresholdsToValueMappings = (thresholds: Threshold[]): ValueMapping[] => {
  return thresholds.slice(0, -1).map((t, i) => {
    return {
      type: 'range',
      range: {
        min: t.value,
        max: thresholds[i + 1].value,
      },
      color: t.color,
    };
  });
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
  disableThreshold?: string,
  connectThreshold?: string
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
  if (validValues?.length === 0) {
    return [fallbackForCategorical(sorted, timestampField, groupField1, groupField2), []];
  }

  const isEqual = (value: string, lastNotNull: Record<string, any>) => {
    return lastNotNull[groupField2] === value;
  };

  const findValue = (value: string) => validValues?.find((v) => v.value === `${value}`)?.value;

  const merged = mergeByGroup<string>({
    sorted,
    groupField: groupField1,
    valueField: groupField2,
    timestampField,
    disableThreshold,
    connectThreshold,
    findTarget: findValue,
    mergeFn: mergeRecords,
    isEqual,
  });

  return [merged, validValues];
};

export const mergeSingleCategoricalData = (
  data: Array<Record<string, any>>,
  timestampField?: string,
  groupField1?: string,
  mappings?: ValueMapping[],
  disableThreshold?: string,
  connectThreshold?: string
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
  if (!validValues || validValues?.length === 0) {
    return [fallbackForSingleCategorical(sorted, timestampField, groupField1), []];
  }

  const isEqual = (value: string | undefined, lastNotNull: Record<string, any>) => {
    return lastNotNull[groupField1] === value;
  };

  const findValue = (value: string) => validValues?.find((v) => v.value === value)?.value;

  const merged: Array<Record<string, any>> = [];

  const buffer: Array<Record<string, any>> = [];
  let currentValue: string | undefined;
  let firstNullValueTime;

  const storeState = { buffer, currentValue };

  mergeInAGroup<string>({
    sorted,
    timestampField,
    valueField: groupField1,
    disableThreshold,
    connectThreshold,
    merged,
    storeState,
    firstNullValueTime,
    findTarget: findValue,
    mergeFn: mergeRecords,
    isEqual,
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
    if (r?.range?.min === undefined) return false;

    return sorted.some((s) => {
      const value = Number(s[rangeField]);
      return (
        r.range?.min !== undefined && value >= r.range.min && value < (r.range.max ?? Infinity)
      );
    });
  });

  // if validRange doesn't exist, fallback to compute the entire count through the time range
  if (validRanges?.length === 0) {
    return [fallbackMerge(sorted, timestampField, groupField), []];
  }

  const findRange = (value: string) => {
    const numberValue = Number(value);
    return validRanges?.find(
      (r) =>
        r?.range?.min !== undefined &&
        r.range.min <= numberValue &&
        (r.range.max ?? Infinity) > numberValue
    )?.range;
  };

  const isEqual = (range: RangeValue, lastNotNull: Record<string, any>) => {
    return lastNotNull.mergedLabel === `[${range?.min},${range?.max})`;
  };

  const merged = mergeByGroup<RangeValue>({
    sorted,
    groupField,
    valueField: rangeField,
    timestampField,
    disableThreshold,
    connectThreshold,
    findTarget: findRange,
    mergeFn: mergeNumercialRecord,
    isEqual,
    // createMergedLabel,
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
  disableThreshold?: string;
  connectThreshold?: string;
  findTarget: (value: string) => T | undefined;
  mergeFn: MergeFn<T>;
  isEqual: (value: T, lastNotNull: Record<string, any>) => boolean;
  createMergedLabel?: (mapping: T | undefined) => string;
}
const mergeByGroup = <T extends string | RangeValue>({
  sorted,
  groupField,
  valueField,
  timestampField,
  disableThreshold,
  connectThreshold,
  findTarget,
  mergeFn,
  isEqual,
  createMergedLabel,
}: MergeOptions<T>) => {
  const groups = groupBy(sorted, (item) => item[groupField]);
  const merged: Array<Record<string, any>> = [];

  for (const g1 of Object.values(groups)) {
    const buffer: Array<Record<string, any>> = [];
    let currentValue: T | undefined;
    let firstNullValueTime;
    let firstInvalidValueTime;

    const storeState = { buffer, currentValue };

    mergeInAGroup({
      sorted: g1,
      timestampField,
      valueField,
      disableThreshold,
      connectThreshold,
      merged,
      firstNullValueTime,
      // firstInvalidValueTime,
      storeState,
      findTarget,
      mergeFn,
      isEqual,
    });

    // console.log('g1', merged);
    // Merge any remaining buffered entries, no need to pass nextTime
    if (storeState.buffer.length > 0) {
      const rec = mergeFn(buffer, timestampField, undefined, storeState.currentValue);
      merged.push(rec);
    }

    // console.log('buffer', ...storeState.buffer);
    // merged.push(...storeState.buffer);
  }

  return merged;
};

interface MergeInAGroupOptions<T extends string | RangeValue> {
  sorted: Array<Record<string, any>>;
  timestampField: string;
  valueField: string;
  disableThreshold?: string;
  connectThreshold?: string;
  merged: Array<Record<string, any>>;
  firstNullValueTime: string | undefined;
  // firstInvalidValueTime: string | undefined;
  // lastValidIndex: number | undefined;
  storeState: {
    buffer: Array<Record<string, any>>;
    currentValue: T | undefined;
  };
  findTarget: (value: string) => T | undefined;
  mergeFn: MergeFn<T>;
  isEqual: (value: T, lastNotNull: Record<string, any>) => boolean;
  createMergedLabel?: (mapping: T | undefined) => string;
}

export const mergeInAGroup = <T extends string | RangeValue>({
  sorted,
  valueField,
  timestampField,
  disableThreshold,
  connectThreshold,
  merged,
  firstNullValueTime,
  // firstInvalidValueTime,
  // lastValidIndex,
  storeState,
  findTarget,
  mergeFn,
  isEqual,
  createMergedLabel,
}: MergeInAGroupOptions<T>) => {
  // for (let i = 0; i < sorted.length; i++) {
  //   const curr = sorted[i];
  // const prev = storeState.buffer.pop();
  // const currentMapping = findTarget(curr[valueField]);
  // const prevMapping = prev ? findTarget(prev[valueField]) : undefined;

  // if (!prev) {
  //   if (createMergedLabel && currentMapping) {
  //     curr.mergedCount = 1;
  //     curr.end = curr[timestampField];
  //     curr.mergedLabel = createMergedLabel(currentMapping);
  //   }
  //   storeState.buffer.push(curr);
  //   continue;
  // }

  // if (!curr[valueField]) {
  //   if (prevMapping) {
  //     lastValidIndex = i - 1;
  //     const next = disconnectValues(curr[timestampField], prev[timestampField], disableThreshold);
  //     prev.end = next;
  //     storeState.buffer.push(prev);
  //   }
  //   storeState.buffer.push(curr);
  //   continue;
  // }

  // if (connectThreshold && lastValidIndex !== undefined) {
  //   const lastValidEntry = storeState.buffer[lastValidIndex];
  //   const t = findTarget(lastValidEntry[valueField]);
  //   console.log('t', t, currentMapping, prevMapping);
  //   if (t === currentMapping) {
  //     const newTime = connectNullValue(
  //       curr[timestampField],
  //       lastValidEntry.end,
  //       connectThreshold
  //     );
  //     lastValidEntry.end = newTime;
  //     lastValidEntry.mergedCount += 1;
  //   }

  //   continue;
  // }

  // if (currentMapping === prevMapping) {
  //   prev.end = curr[timestampField];
  //   prev.mergedCount += 1;
  //   storeState.buffer.push(prev);
  // } else {
  //   if (prevMapping) {
  //     const next = disconnectValues(curr[timestampField], prev[timestampField], disableThreshold);
  //     prev.end = next;
  //     storeState.buffer.push(prev);
  //   }
  //   if (createMergedLabel && currentMapping) {
  //     curr.mergedCount = 1;
  //     curr.end = curr[timestampField];
  //     curr.mergedLabel = createMergedLabel ? createMergedLabel(currentMapping) : '';
  //   }
  //   storeState.buffer.push(curr);
  // }
  // lastValidIndex = undefined;
  // firstNullValueTime = undefined;

  //   const currentMapping = findTarget(curr[valueField]);

  //   // if current value is null/undefined, record the first null time
  //   if (!curr[valueField]) {
  //     firstNullValueTime ??= curr[timestampField];
  //     if (storeState.buffer.length > 0) {
  //       const next = disconnectValues(
  //         curr[timestampField],
  //         storeState.buffer[storeState.buffer.length - 1][timestampField],
  //         disableThreshold
  //       );
  //       const rec = mergeFn(storeState.buffer, timestampField, next, storeState.currentValue);
  //       merged.push(rec);
  //       // clear buffer
  //       storeState.buffer.length = 0;
  //       storeState.currentValue = undefined;
  //     }
  //     continue;
  //   }

  //   // If the current data point does not belong to any defined values or ranges
  //   if (!currentMapping) {
  //     // won't connect values if invalid value appears
  //     firstNullValueTime = undefined;
  //     if (storeState.buffer.length > 0) {
  //       const next = disconnectValues(
  //         curr[timestampField],
  //         storeState.buffer[storeState.buffer.length - 1][timestampField],
  //         disableThreshold
  //       );
  //       const rec = mergeFn(storeState.buffer, timestampField, next, storeState.currentValue);
  //       merged.push(rec);
  //       // clear buffer
  //       storeState.buffer.length = 0;
  //       storeState.currentValue = undefined;
  //     }

  //     continue;
  //   }

  //   // first valid record after a lists of null records
  //   if (currentMapping && merged.length > 0 && firstNullValueTime && connectThreshold) {
  //     const lastNotNull = merged[merged.length - 1];

  //     if (isEqual(currentMapping, lastNotNull)) {
  //       const newTime = connectNullValue(curr[timestampField], lastNotNull.end, connectThreshold);

  //       merged[merged.length - 1] = {
  //         ...lastNotNull,
  //         end: newTime,
  //       };
  //     }

  //     firstNullValueTime = undefined;
  //   }

  //   // If same range as previous or first entry, add to buffer
  //   if (storeState.currentValue === currentMapping || storeState.currentValue === undefined) {
  //     storeState.buffer.push(curr);
  //     storeState.currentValue = currentMapping;
  //   } else {
  //     // Range changed - merge buffered entries and start new buffer
  //     if (storeState.buffer.length > 0) {
  //       const next = disconnectValues(
  //         curr[timestampField],
  //         storeState.buffer[storeState.buffer.length - 1][timestampField],
  //         disableThreshold
  //       );
  //       const rec = mergeFn(storeState.buffer, timestampField, next, storeState.currentValue);
  //       merged.push(rec);
  //     }

  //     storeState.buffer.length = 0;
  //     storeState.buffer.push(curr);
  //     storeState.currentValue = currentMapping;
  //   }
  // }

  const flushBuffer = (nextTimestamp: string) => {
    if (storeState.buffer.length === 0) return;

    const next = disconnectValues(
      nextTimestamp,
      storeState.buffer[storeState.buffer.length - 1][timestampField],
      disableThreshold
    );

    const rec = mergeFn(storeState.buffer, timestampField, next, storeState.currentValue);
    merged.push(rec);
    storeState.buffer.length = 0;
    storeState.currentValue = undefined;
  };

  for (const curr of sorted) {
    const currentMapping = findTarget(curr[valueField]);

    // Handle null/undefined values
    if (!curr[valueField]) {
      firstNullValueTime ??= curr[timestampField];
      flushBuffer(curr[timestampField]);
      continue;
    }

    // Handle invalid mappings
    if (!currentMapping) {
      // For case: null invalid null, should not connect
      firstNullValueTime = undefined;
      flushBuffer(curr[timestampField]);
      continue;
    }

    // Try to connect after null values
    if (merged.length > 0 && firstNullValueTime && connectThreshold) {
      const lastNotNull = merged[merged.length - 1];
      if (isEqual(currentMapping, lastNotNull)) {
        const newTime = connectNullValue(curr[timestampField], lastNotNull.end, connectThreshold);
        merged[merged.length - 1] = { ...lastNotNull, end: newTime };
      }
      firstNullValueTime = undefined;
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
