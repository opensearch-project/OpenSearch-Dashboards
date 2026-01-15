/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { groupBy } from 'lodash';
import { Threshold, ValueMapping } from '../types';
import { StateTimeLineChartStyle } from './state_timeline_config';
import { BaseChartStyle, PipelineFn } from '../utils/echarts_spec';
import { resolveColor } from '../theme/color_utils';
import { TransformFn } from '../utils/data_transformation';

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

const mergeRecordsWithColor = (
  records: Array<Record<string, any>>,
  timestampField: string,
  nextData?: string,
  valueMapping?: ValueMapping | string
) => {
  const endTime = nextData ? nextData : records[records.length - 1][timestampField];
  const startTime = records[0][timestampField];
  const duration = new Date(endTime).getTime() - new Date(startTime).getTime();

  const label =
    typeof valueMapping !== 'object' && valueMapping !== undefined
      ? String(valueMapping)
      : valueMapping?.type === 'value'
      ? valueMapping?.value
      : valueMapping?.type === 'range'
      ? `[${valueMapping?.range?.min},${valueMapping?.range?.max ?? '∞'})`
      : '_unmatched_';

  return {
    ...records[0],
    start: startTime,
    end: endTime,
    mergedCount: records.length,
    duration: formatDuration(duration),
    mergedColor: typeof valueMapping === 'object' ? valueMapping?.color : undefined,
    mergedLabel: label,
    displayText: typeof valueMapping === 'object' ? valueMapping?.displayText : undefined,
  };
};

export const convertThresholdsToValueMappings = (thresholds: Threshold[]): ValueMapping[] => {
  return thresholds.map((t, i) => ({
    type: 'range',
    range: {
      min: t.value,
      max: i === thresholds.length - 1 ? undefined : thresholds[i + 1].value,
    },
    color: t.color,
  }));
};

/**
 * Merges consecutive data points by a field that fall within the same numerical range.
 */

export const mergeDataCore = ({
  timestampField,
  groupField,
  mappingField,
  rangeMappings = [],
  valueMappings = [],
  disconnectThreshold,
  connectThreshold,
  useThresholdColor,
  useValueMappingColor,
}: {
  timestampField?: string;
  groupField?: string;
  mappingField?: string;
  rangeMappings?: ValueMapping[];
  valueMappings?: ValueMapping[];
  disconnectThreshold?: string;
  connectThreshold?: string;
  useThresholdColor?: boolean;
  useValueMappingColor?: boolean;
}) => (data: Array<Record<string, any>>): Array<Record<string, any>> => {
  if (!timestampField || !mappingField) return data;

  const mergedMappings = [...valueMappings, ...rangeMappings];

  const findMatch = (value: string) => {
    if (!useThresholdColor && !useValueMappingColor) return String(value);
    return mergedMappings.find((v) => {
      if (v.type === 'range') {
        const numberValue = Number(value);
        return (
          v.range?.min !== undefined &&
          numberValue >= v.range.min &&
          numberValue < (v.range.max ?? Infinity)
        );
      } else {
        return v.value === `${value}`;
      }
    });
  };

  if (groupField) {
    const merged = mergeByGroup({
      sorted: data,
      groupField,
      valueField: mappingField,
      timestampField,
      disconnectThreshold,
      connectThreshold,
      findTarget: findMatch,
      mergeFn: mergeRecordsWithColor,
    });

    return merged;
  } else {
    const merged: Array<Record<string, any>> = [];

    const buffer: Array<Record<string, any>> = [];
    let currentValue: ValueMapping | undefined;

    const storeState = { buffer, currentValue };

    mergeInAGroup({
      sorted: data,
      timestampField,
      valueField: mappingField,
      disconnectThreshold,
      connectThreshold,
      merged,
      storeState,
      findTarget: findMatch,
      mergeFn: mergeRecordsWithColor,
    });

    // Merge any remaining buffered entries, no need to pass nextTime
    const finalData = storeState.buffer.pop();
    if (storeState.buffer.length > 0) {
      const rec = mergeRecordsWithColor(
        buffer,
        timestampField,
        finalData?.[timestampField],
        storeState.currentValue
      );
      merged.push(rec);
    }

    return merged;
  }
};

export const groupByMergedLabel = (fn: TransformFn) => (data: Array<Record<string, any>>) => {
  const result = new Map<string, Array<Record<string, any>>>();
  data.forEach((row) => {
    const label = row.mergedLabel;
    if (!result.has(label)) result.set(label, []);
    result.get(label)!.push(row);
  });

  const newData = Array.from(result.values()).map((group) => {
    return fn(group);
  });

  return newData;
};

type MergeFn = (
  buffer: Array<Record<string, any>>,
  timestampField: string,
  endTime?: string,
  valueMapping?: ValueMapping | string
) => any;
interface MergeOptions {
  sorted: Array<Record<string, any>>;
  timestampField: string;
  groupField: string;
  valueField: string;
  disconnectThreshold?: string;
  connectThreshold?: string;
  findTarget: (value: string) => string | ValueMapping | undefined;
  mergeFn: MergeFn;
}
const mergeByGroup = ({
  sorted,
  groupField,
  valueField,
  timestampField,
  disconnectThreshold,
  connectThreshold,
  findTarget,
  mergeFn,
}: MergeOptions) => {
  const groups = groupBy(sorted, (item) => item[groupField]);
  const merged: Array<Record<string, any>> = [];

  for (const g1 of Object.values(groups)) {
    const buffer: Array<Record<string, any>> = [];
    let currentValue: ValueMapping | undefined;

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

    // Process any remaining buffered entries
    // Skip single entries to avoid zero-duration records
    const finalData = storeState.buffer.pop();
    if (storeState.buffer.length > 0) {
      const rec = mergeFn(
        storeState.buffer,
        timestampField,
        finalData?.[timestampField],
        storeState.currentValue
      );
      merged.push(rec);
    }
  }

  return merged;
};

interface MergeInAGroupOptions {
  sorted: Array<Record<string, any>>;
  timestampField: string;
  valueField: string;
  disconnectThreshold?: string;
  connectThreshold?: string;
  merged: Array<Record<string, any>>;
  storeState: {
    buffer: Array<Record<string, any>>;
    currentValue: string | ValueMapping | undefined;
  };
  findTarget: (value: string) => string | ValueMapping | undefined;
  mergeFn: MergeFn;
}

export const mergeInAGroup = ({
  sorted,
  valueField,
  timestampField,
  disconnectThreshold,
  connectThreshold,
  merged,
  storeState,
  findTarget,
  mergeFn,
}: MergeInAGroupOptions) => {
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

    if (curr[valueField] === undefined || curr[valueField] === null) {
      if (storeState.buffer.length > 0) {
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
        storeState.buffer.pop(); // last null cannot be connect, pop that to ensure correct length
        flushBuffer(lastTime);
      }

      // Reset null tracking variables
      firstNullValueTime = undefined;
    }

    // Add to buffer or flush and start new
    if (storeState.currentValue === currentMapping || storeState.buffer.length === 0) {
      storeState.buffer.push(curr);
      storeState.currentValue = currentMapping;
    } else {
      flushBuffer(curr[timestampField]);
      storeState.buffer.push(curr);
      storeState.currentValue = currentMapping;
    }
  }
};

function decideSeriesStyle(mapping: { label: any; color: any; displayText: any }) {
  return mapping.label === '_unmatched_' ? 'lightgrey' : resolveColor(mapping.color);
}

const renderSingleStateTimeLineItem = (styles: StateTimeLineChartStyle, displayText?: string) => (
  params: any,
  api: any
) => {
  const y = 5; // a fake y
  const start = api.coord([+new Date(api.value('start')), y]);
  const end = api.coord([+new Date(api.value('end')), y]);
  const height = api.size([0, 1])[1] * 5 * (styles.exclusive.rowHeight ?? 0.8);
  return {
    type: 'group',
    children: [
      {
        type: 'rect',
        shape: {
          x: start[0],
          y: start[1] - height / 2,
          width: end[0] - start[0],
          height,
        },
        z2: 5,
        style: {
          ...api.style(),
        },
      },
      ...(styles.exclusive.showValues
        ? [
            {
              type: 'text',
              z2: 10,
              style: {
                text: displayText,
                font: '10px sans-serif',
              },
              // position text in the center of the rect
              x: (start[0] + end[0]) / 2,
              y: start[1],
            },
          ]
        : []),
    ],
  };
};

const renderItem = (styles: StateTimeLineChartStyle, groupField: string, displayText?: string) => (
  params: any,
  api: any
) => {
  const y = api.value(groupField);
  const start = api.coord([+new Date(api.value('start')), y]);
  const end = api.coord([+new Date(api.value('end')), y]);
  const height = api.size([0, 1])[1] * (styles.exclusive.rowHeight ?? 0.8);
  // api.size([0, 1])[1] meaning:
  // How many pixels tall is 1 unit on the Y axis in the current chart scale
  return {
    type: 'group',
    children: [
      {
        type: 'rect',
        shape: {
          x: start[0],
          y: start[1] - height / 2,
          width: end[0] - start[0],
          height,
        },
        z2: 5,
        style: {
          ...api.style(),
        },
      },

      // TODO style display text
      ...(styles.exclusive.showValues
        ? [
            {
              type: 'text',
              z2: 10,
              style: {
                text: displayText,
                font: '10px sans-serif',
              },
              // position text in the center of the rect
              x: (start[0] + end[0]) / 2,
              y: start[1],
            },
          ]
        : []),
    ],
  };
};

export const createStateTimeLineSpec = <T extends BaseChartStyle>({
  styles,
  groupField,
}: {
  styles: StateTimeLineChartStyle;
  groupField?: string;
}): PipelineFn<T> => (state) => {
  const { transformedData, yAxisConfig } = state;
  const newState = { ...state };
  const mergeLabelCombo: Array<{ label: any; color: any; displayText: any }> = [];

  // Transform data into serval datasets based on color mapping
  // Structure: [{ source: [headers, ...dataRows] }, { source: [headers, ...dataRows] }, ...]
  // Headers: [originalFields..., "start", "end", "mergedCount", "duration", "mergedColor", "mergedLabel", "displayText"]
  // Get mergedLabel/mergedColor/displayText combination for styling
  transformedData?.forEach((row) => {
    const mergeLabelIndex = row[0].indexOf('mergedLabel');
    const mergedColorIndex = row[0].indexOf('mergedColor');
    const displayTextIndex = row[0].indexOf('displayText');
    mergeLabelCombo.push({
      label: row[1][mergeLabelIndex],
      color: row[1][mergedColorIndex],
      displayText: row[1][displayTextIndex],
    });
  });

  if (!groupField) {
    const newyAxisConfig = { ...yAxisConfig };
    newyAxisConfig.min = 0;
    newyAxisConfig.max = 10;
    newyAxisConfig.axisTick = { show: false };
    newyAxisConfig.axisLabel = { show: false };
    newyAxisConfig.splitLine = { show: false };
    newState.yAxisConfig = newyAxisConfig;
  }

  const allSeries = mergeLabelCombo.map((mapping, index: number) => {
    return {
      name: mapping.displayText || mapping.label,
      type: 'custom',
      renderItem: groupField
        ? renderItem(styles, groupField, mapping.displayText)
        : renderSingleStateTimeLineItem(styles, mapping.displayText),
      datasetIndex: index,
      itemStyle: {
        color: decideSeriesStyle(mapping),
      },
      encode: {
        x: ['start', 'end'],
        ...(groupField && { y: groupField }),
        tooltip: ['start', 'end', 'duration', 'mergedCount'],
      },
    };
  });

  newState.series = allSeries?.flat() as any;

  return newState;
};
