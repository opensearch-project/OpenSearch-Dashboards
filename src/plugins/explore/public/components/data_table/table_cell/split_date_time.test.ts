/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';
import { formatDateAndTime, splitDateTimePattern } from './split_date_time';

describe('splitDateTimePattern', () => {
  it('splits a date part followed by a time part, dropping the separator', () => {
    expect(splitDateTimePattern('MMM D, YYYY @ HH:mm:ss.SSS')).toEqual([
      'MMM D, YYYY',
      'HH:mm:ss.SSS',
    ]);
    expect(splitDateTimePattern('YYYY-MM-DD HH:mm:ss')).toEqual(['YYYY-MM-DD', 'HH:mm:ss']);
    expect(splitDateTimePattern('YYYY-MM-DDTHH:mm:ssZ')).toEqual(['YYYY-MM-DD', 'HH:mm:ssZ']);
    expect(splitDateTimePattern('DD/MM/YYYY, h:mm a')).toEqual(['DD/MM/YYYY', 'h:mm a']);
  });

  it('ignores escaped text when looking for the time part', () => {
    expect(splitDateTimePattern('[hms] YYYY-MM-DD [at] HH:mm')).toEqual([
      '[hms] YYYY-MM-DD',
      'HH:mm',
    ]);
  });

  it('returns undefined when the format cannot be split in two lines', () => {
    expect(splitDateTimePattern('YYYY-MM-DD')).toBeUndefined(); // date only
    expect(splitDateTimePattern('HH:mm:ss')).toBeUndefined(); // time only
    expect(splitDateTimePattern('HH:mm DD/MM/YYYY')).toBeUndefined(); // time first
    expect(splitDateTimePattern('LLL')).toBeUndefined(); // localized
    expect(splitDateTimePattern(undefined)).toBeUndefined();
  });
});

describe('formatDateAndTime', () => {
  // Minimal stand-in for a date field formatter: formats with its `pattern` param.
  class FakeDateFormat {
    type = FakeDateFormat;
    getConfig = () => undefined;
    constructor(private readonly formatParams: Record<string, unknown>) {}
    param = (name: string) => this.formatParams[name];
    params = () => ({ ...this.formatParams });
    convert = (value: unknown) => {
      const date = moment.utc(value as string);
      return date.isValid() ? date.format(this.formatParams.pattern as string) : String(value);
    };
  }

  it('formats the date and the time separately with the formatter pattern', () => {
    const formatter = new FakeDateFormat({ pattern: 'MMM D, YYYY @ HH:mm:ss.SSS' });
    expect(formatDateAndTime(formatter, '2026-10-10T10:05:00.000Z')).toEqual([
      'Oct 10, 2026',
      '10:05:00.000',
    ]);
  });

  it('follows a custom format', () => {
    const formatter = new FakeDateFormat({ pattern: 'DD.MM.YYYY HH:mm' });
    expect(formatDateAndTime(formatter, '2026-10-10T10:05:00.000Z')).toEqual([
      '10.10.2026',
      '10:05',
    ]);
  });

  it('returns undefined when it cannot split', () => {
    expect(formatDateAndTime(new FakeDateFormat({ pattern: 'YYYY-MM-DD' }), '2026-10-10')).toBe(
      undefined
    );
    const formatter = new FakeDateFormat({ pattern: 'YYYY-MM-DD HH:mm' });
    expect(formatDateAndTime(formatter, 'not a date')).toBeUndefined();
    expect(formatDateAndTime(formatter, ['2026-10-10', '2026-10-11'])).toBeUndefined();
    expect(formatDateAndTime(formatter, null)).toBeUndefined();
    expect(formatDateAndTime(undefined, '2026-10-10')).toBeUndefined();
    expect(formatDateAndTime({}, '2026-10-10')).toBeUndefined();
  });
});
