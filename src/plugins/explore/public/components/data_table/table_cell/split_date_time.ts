/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// moment tokens that print a part of the time of day (or its offset)
const TIME_TOKEN = /[HhkmsSaAZzXx]/;
// Separators left dangling at the end of the date part, e.g. the " @ " of "MMM D, YYYY @ HH:mm"
const TRAILING_SEPARATORS = /(\[[^\]]*\]|[\s@,|T-])+$/;

/**
 * Splits a moment format such as `MMM D, YYYY @ HH:mm:ss.SSS` into its date part and its time
 * part. Returns undefined when the format is not a date part followed by a time part (time
 * first, date only, time only, or a localized `L` format whose content is not known here).
 */
export const splitDateTimePattern = (pattern: unknown): [string, string] | undefined => {
  if (typeof pattern !== 'string') return undefined;
  let timeStart = -1;
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    if (char === '[') {
      // escaped literal text
      const end = pattern.indexOf(']', i);
      if (end === -1) break;
      i = end;
    } else if (char === 'L' || char === 'l') {
      return undefined;
    } else if (TIME_TOKEN.test(char)) {
      timeStart = i;
      break;
    }
  }
  if (timeStart <= 0) return undefined;
  const datePattern = pattern.slice(0, timeStart).replace(TRAILING_SEPARATORS, '');
  const timePattern = pattern.slice(timeStart);
  // A date token after the time part (e.g. "HH:mm DD/MM") cannot be split in two lines.
  if (!datePattern || /[YyMDdQWwEeGg]/.test(timePattern.replace(/\[[^\]]*\]/g, ''))) {
    return undefined;
  }
  return [datePattern, timePattern];
};

/**
 * The parts of a `FieldFormat` (data plugin) used here. `type` is the formatter's own class and
 * `getConfig` its (protected) access to the advanced settings; both are needed to create a copy
 * of the formatter that differs only in its pattern, so the copy keeps the same time zone and
 * other defaults.
 */
interface PatternFormatter {
  type: new (params: Record<string, unknown>, getConfig?: unknown) => PatternFormatter;
  param: (name: string) => unknown;
  params: () => Record<string, unknown>;
  convert: (value: unknown, contentType: 'text') => string;
  getConfig?: unknown;
}

// The two derived formatters of a field formatter, or null when it cannot be split.
const derivedFormatters = new WeakMap<object, [PatternFormatter, PatternFormatter] | null>();

/**
 * Formats a date value as separate date and time texts, using the field's own formatter (so its
 * pattern, time zone and precision are kept) with the pattern split in two. Returns undefined
 * when the formatter has no splittable pattern or the value is not a single date.
 */
export const formatDateAndTime = (
  formatter: unknown,
  value: unknown
): [string, string] | undefined => {
  if (!formatter || typeof formatter !== 'object') return undefined;
  if (value === null || value === undefined || typeof value === 'object') return undefined;
  const source = formatter as PatternFormatter;
  try {
    let derived = derivedFormatters.get(source);
    if (derived === undefined) {
      const parts = splitDateTimePattern(source.param('pattern'));
      derived = parts
        ? (parts.map(
            (pattern) => new source.type({ ...source.params(), pattern }, source.getConfig)
          ) as [PatternFormatter, PatternFormatter])
        : null;
      derivedFormatters.set(source, derived);
    }
    if (!derived) return undefined;
    const date = derived[0].convert(value, 'text');
    const time = derived[1].convert(value, 'text');
    // An invalid date is returned unformatted by both; show it once, on one line.
    return date === time ? undefined : [date, time];
  } catch (e) {
    return undefined;
  }
};
