/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';

const DEFAULT_DATE_FORMAT = 'MMM D, YYYY @ HH:mm:ss.SSS';

/**
 * The Time column pattern for list tables (Logs, Traces, Agent Traces): the
 * user's `dateFormat` without fractional seconds. "Nov 9, 2026 @ 15:25:40" is
 * enough to scan a list; detail views keep the field's full precision.
 *
 * Removes every fractional-seconds token (`S`, `SSS`, `SSSSSSSSS`…) together
 * with the one separator before it, whatever that separator is (`.`, `,`, `:`,
 * a space, or none as in `HHmmssSSS`). Bracketed moment literals (`[...]`) and
 * the `S` of the localized `LTS` token (time with seconds) are left as they are.
 */
export const toListTimePattern = (dateFormat?: string): string =>
  (dateFormat || DEFAULT_DATE_FORMAT)
    // Split out bracketed literals and the LT / LTS tokens so they are kept as
    // they are. No RegExp lookbehind: older Safari (< 16.4) cannot parse one.
    .split(/(\[[^\]]*\]|LTS?)/)
    .map((part) =>
      part.startsWith('[') || part === 'LT' || part === 'LTS'
        ? part
        : part.replace(/[^A-Za-z0-9]?S+/g, '')
    )
    .join('');

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
