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
      return new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    case TimeUnit.MONTH:
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
    case TimeUnit.DATE:
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    case TimeUnit.HOUR:
      return new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours())
      );
    case TimeUnit.MINUTE:
      return new Date(
        Date.UTC(
          d.getUTCFullYear(),
          d.getUTCMonth(),
          d.getUTCDate(),
          d.getUTCHours(),
          d.getUTCMinutes()
        )
      );
    case TimeUnit.SECOND:
      return new Date(
        Date.UTC(
          d.getUTCFullYear(),
          d.getUTCMonth(),
          d.getUTCDate(),
          d.getUTCHours(),
          d.getUTCMinutes(),
          d.getUTCSeconds()
        )
      );
    default:
      return d;
  }
};
