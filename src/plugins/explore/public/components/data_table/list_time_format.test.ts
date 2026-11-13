/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment-timezone';
import { formatListTime, toListTimePattern } from './list_time_format';

describe('list time format', () => {
  beforeAll(() => moment.tz.setDefault('UTC'));
  afterAll(() => moment.tz.setDefault());

  it('drops fractional seconds from the date format', () => {
    expect(toListTimePattern('MMM D, YYYY @ HH:mm:ss.SSS')).toBe('MMM D, YYYY @ HH:mm:ss');
    expect(toListTimePattern('MMM D, YYYY @ HH:mm:ss.SSSSSSSSS')).toBe('MMM D, YYYY @ HH:mm:ss');
    expect(toListTimePattern('YYYY-MM-DD HH:mm:ss,SSS')).toBe('YYYY-MM-DD HH:mm:ss');
    expect(toListTimePattern(undefined)).toBe('MMM D, YYYY @ HH:mm:ss');
  });

  it('drops fractional seconds after any separator, or none', () => {
    expect(toListTimePattern('HH:mm:ss SSS')).toBe('HH:mm:ss');
    expect(toListTimePattern('HH:mm:ss:SSS')).toBe('HH:mm:ss');
    expect(toListTimePattern('YYYYMMDD HHmmssSSS')).toBe('YYYYMMDD HHmmss');
    expect(toListTimePattern('HH:mm:ss.SSS Z')).toBe('HH:mm:ss Z');
  });

  it("keeps moment's localized LTS token (time with seconds)", () => {
    expect(toListTimePattern('L LTS')).toBe('L LTS');
    expect(toListTimePattern('LTS.SSS')).toBe('LTS');
  });

  it('keeps bracketed literals', () => {
    expect(toListTimePattern('HH:mm:ss[.SSS] [at] HH:mm:ss.SSS')).toBe(
      'HH:mm:ss[.SSS] [at] HH:mm:ss'
    );
  });

  it('formats date and date_nanos values to the second with no offset suffix', () => {
    const pattern = 'MMM D, YYYY @ HH:mm:ss';
    expect(formatListTime('2026-11-09T20:13:07.227+00:00', pattern)).toBe('Nov 9, 2026 @ 20:13:07');
    expect(formatListTime('2026-11-09T20:13:07.227001234Z', pattern)).toBe(
      'Nov 9, 2026 @ 20:13:07'
    );
    expect(formatListTime(Date.UTC(2026, 10, 9, 20, 13, 7, 227), pattern)).toBe(
      'Nov 9, 2026 @ 20:13:07'
    );
  });

  it('leaves values it cannot parse to the field formatter', () => {
    expect(formatListTime('not a date', 'HH:mm:ss')).toBeUndefined();
    expect(formatListTime(undefined, 'HH:mm:ss')).toBeUndefined();
    expect(formatListTime({}, 'HH:mm:ss')).toBeUndefined();
  });
});
