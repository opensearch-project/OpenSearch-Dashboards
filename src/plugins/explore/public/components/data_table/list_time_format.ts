/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';

const DEFAULT_DATE_FORMAT = 'MMM D, YYYY @ HH:mm:ss.SSS';

/**
 * The Time column pattern for list tables (Logs, Traces): the user's
 * `dateFormat` without fractional seconds. "Nov 9, 2026 @ 15:25:40" is enough
 * to scan a list; the expanded document keeps the field's full precision.
 */
export const toListTimePattern = (dateFormat?: string): string =>
  (dateFormat || DEFAULT_DATE_FORMAT).replace(/[.,]S+/g, '');

/**
 * Formats a time-field value for the list. Parsed the same way as the date and
 * date_nanos field formatters (moment in the configured default timezone), so
 * only the precision differs. `undefined` keeps the field's formatted value.
 */
export const formatListTime = (raw: unknown, pattern: string): string | undefined => {
  if (typeof raw !== 'string' && typeof raw !== 'number') return undefined;
  const value = moment(raw);
  return value.isValid() ? value.format(pattern) : undefined;
};
