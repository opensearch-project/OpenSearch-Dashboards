/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TimeUnit } from '../../../types';

/**
 * Round timestamp to time unit bucket
 * @param timestamp - Date object to round
 * @param unit - TimeUnit to round to
 * @returns Date object rounded to the start of the time bucket
 */
export const roundToTimeUnit = (timestamp: Date, unit: TimeUnit): Date => {
  const d = new Date(timestamp);
  switch (unit) {
    case TimeUnit.YEAR:
      return new Date(d.getFullYear(), 0, 1);
    case TimeUnit.MONTH:
      return new Date(d.getFullYear(), d.getMonth(), 1);
    case TimeUnit.DATE:
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    case TimeUnit.HOUR:
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours());
    case TimeUnit.MINUTE:
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes());
    case TimeUnit.SECOND:
      return new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        d.getHours(),
        d.getMinutes(),
        d.getSeconds()
      );
    default:
      return d;
  }
};

/**
 * Round timestamp up to the nearest time bucket boundary.
 */
export const ceilToTimeUnit = (timestamp: Date, unit: TimeUnit): Date => {
  const bucketStart = roundToTimeUnit(timestamp, unit);
  if (bucketStart.getTime() === timestamp.getTime()) {
    return bucketStart;
  }

  switch (unit) {
    case TimeUnit.YEAR:
      bucketStart.setFullYear(bucketStart.getFullYear() + 1);
      break;
    case TimeUnit.MONTH:
      bucketStart.setMonth(bucketStart.getMonth() + 1);
      break;
    case TimeUnit.DATE:
      bucketStart.setDate(bucketStart.getDate() + 1);
      break;
    case TimeUnit.HOUR:
      bucketStart.setHours(bucketStart.getHours() + 1);
      break;
    case TimeUnit.MINUTE:
      bucketStart.setMinutes(bucketStart.getMinutes() + 1);
      break;
    case TimeUnit.SECOND:
      bucketStart.setSeconds(bucketStart.getSeconds() + 1);
      break;
  }

  return bucketStart;
};
