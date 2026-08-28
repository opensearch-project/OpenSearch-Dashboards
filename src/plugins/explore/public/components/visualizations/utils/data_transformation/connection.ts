/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DisableMode, ConnectNullValuesOption, DisconnectValuesOption } from '../../types';

export const DEFAULT_GAP_THRESHOLD = '1h';

const DURATION_UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
};

interface StyleOptions {
  connectNullValues?: ConnectNullValuesOption;
  disconnectValues?: DisconnectValuesOption;
}

export const parseThresholdDuration = (threshold?: string): number | undefined => {
  const match = threshold?.trim().match(/^(\d+(?:\.\d+)?)\s*(s|m|h)$/i);

  if (!match) {
    return undefined;
  }

  const value = Number(match[1]);
  return value > 0 ? value * DURATION_UNIT_MS[match[2].toLowerCase()] : undefined;
};

const toTimestamp = (value: any): number => {
  if (value instanceof Date) {
    return value.getTime();
  }
  return new Date(typeof value === 'string' ? value.replace(' ', 'T') : value).getTime();
};

const isMissing = (value: any): boolean => value === null || value === undefined;

interface GapOptions {
  timeField: string;
  seriesFields?: string[];
  threshold?: string;
}

export const resolveConnectMode = (styles: StyleOptions): DisableMode =>
  styles.connectNullValues?.connectMode ?? DisableMode.Always;

export const resolveDisconnectMode = (styles: StyleOptions): DisableMode =>
  styles.disconnectValues?.disableMode ?? DisableMode.Never;

/**
 * Connect the nulls lying within threshold of the last valid point and leave the rest of the run as a break.
 */
export const connectNullGaps = (
  data: Array<Record<string, any>>,
  { timeField, seriesFields, threshold }: GapOptions
): Array<Record<string, any>> => {
  const maxGap = parseThresholdDuration(threshold);
  if (maxGap === undefined || data.length === 0) {
    return data;
  }

  const rows = data.map((row) => ({ ...row }));
  const fields = seriesFields ?? Object.keys(rows[0]).filter((key) => key !== timeField);
  const toRemove = new Set<number>();
  fields.forEach((field) => {
    let lastValidIndex: number | undefined;
    const tempBuffer: number[] = [];

    const recordBuffer = (endIndex: number) => {
      if (lastValidIndex === undefined) return;
      const startTime = toTimestamp(rows[lastValidIndex][timeField]);
      const duration = toTimestamp(rows[endIndex][timeField]) - startTime;

      // when two valid points can be connected, will delete the in-between nulls
      if (duration <= maxGap) {
        tempBuffer.forEach((item) => {
          toRemove.add(item);
        });
      }

      tempBuffer.length = 0;
    };

    rows.forEach((row, index) => {
      if (isMissing(row[field])) {
        if (lastValidIndex !== undefined) {
          tempBuffer.push(index);
        }
        return;
      }

      // first non-null value after a series of nulls
      if (tempBuffer.length > 0) {
        recordBuffer(index);
      }

      lastValidIndex = index;
    });
  });

  return rows.filter((_, index) => !toRemove.has(index));
};

/**
 * Insert a null row as a break wherever two consecutive points sit further apart than threshold
 */
export const insertNullGaps = (
  data: Array<Record<string, any>>,
  { timeField, seriesFields, threshold }: GapOptions
): Array<Record<string, any>> => {
  const maxGap = parseThresholdDuration(threshold);
  if (maxGap === undefined || data.length < 2) {
    return data;
  }

  const fields = seriesFields ?? Object.keys(data[0]).filter((key) => key !== timeField);
  const rows: Array<Record<string, any>> = [];

  data.forEach((row, index) => {
    const previous = data[index - 1];
    if (previous) {
      const previousTime = toTimestamp(previous[timeField]);
      const currentTime = toTimestamp(row[timeField]);

      if (
        Number.isFinite(previousTime) &&
        Number.isFinite(currentTime) &&
        currentTime - previousTime > maxGap
      ) {
        const breakRow: Record<string, any> = { [timeField]: new Date(previousTime + maxGap) };
        fields.forEach((field) => {
          breakRow[field] = null;
        });
        rows.push(breakRow);
      }
    }

    rows.push(row);
  });

  return rows;
};

export const disconnectValues =
  (styles: StyleOptions, options: Omit<GapOptions, 'threshold'>) =>
  (data: Array<Record<string, any>>): Array<Record<string, any>> =>
    resolveDisconnectMode(styles) === DisableMode.Threshold
      ? insertNullGaps(data, {
          ...options,
          threshold: styles.disconnectValues?.threshold ?? DEFAULT_GAP_THRESHOLD,
        })
      : data;

export const connectNullValues =
  (styles: StyleOptions, options: Omit<GapOptions, 'threshold'>) =>
  (data: Array<Record<string, any>>): Array<Record<string, any>> =>
    resolveConnectMode(styles) === DisableMode.Threshold
      ? connectNullGaps(data, {
          ...options,
          threshold: styles.connectNullValues?.threshold ?? DEFAULT_GAP_THRESHOLD,
        })
      : data;
