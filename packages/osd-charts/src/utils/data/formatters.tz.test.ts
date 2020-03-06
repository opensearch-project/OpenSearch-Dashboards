/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License. */

import { niceTimeFormatter } from './formatters';

const anHour = 1000 * 60 * 60;
const aDay = anHour * 24;
const END_DAY = 1546387199000; // 2019-01-01T23:59:99.000Z
const START_DAY = 1546300800000; // 2019-01-01T00:00:00.000Z
const TIMEZONE_UTC = { timeZone: 'UTC' };
const TIMEZONE_NY = { timeZone: 'America/New_York' };
const TIMEZONE_TOKYO = { timeZone: 'Asia/Tokyo' };

describe('Date Formatter', () => {
  describe('format nicely an interval of more than 30 days', () => {
    const formatter = niceTimeFormatter([START_DAY, START_DAY + aDay * 31]);
    test('UTC', () => {
      expect(formatter(START_DAY, TIMEZONE_UTC)).toBe('2019-01-01');
      expect(formatter(START_DAY + aDay, TIMEZONE_UTC)).toBe('2019-01-02');
      expect(formatter(START_DAY + aDay * 2, TIMEZONE_UTC)).toBe('2019-01-03');
      expect(formatter(END_DAY, TIMEZONE_UTC)).toBe('2019-01-01');
      expect(formatter(END_DAY + aDay, TIMEZONE_UTC)).toBe('2019-01-02');
      expect(formatter(END_DAY + aDay * 2, TIMEZONE_UTC)).toBe('2019-01-03');
    });
    test('America/New_York', () => {
      expect(formatter(START_DAY, TIMEZONE_NY)).toBe('2018-12-31');
      expect(formatter(START_DAY + aDay, TIMEZONE_NY)).toBe('2019-01-01');
      expect(formatter(START_DAY + aDay * 2, TIMEZONE_NY)).toBe('2019-01-02');
      expect(formatter(END_DAY, TIMEZONE_NY)).toBe('2019-01-01');
      expect(formatter(END_DAY + aDay, TIMEZONE_NY)).toBe('2019-01-02');
      expect(formatter(END_DAY + aDay * 2, TIMEZONE_NY)).toBe('2019-01-03');
    });
    test('Asia/Tokyo', () => {
      expect(formatter(START_DAY, TIMEZONE_TOKYO)).toBe('2019-01-01');
      expect(formatter(START_DAY + aDay, TIMEZONE_TOKYO)).toBe('2019-01-02');
      expect(formatter(START_DAY + aDay * 2, TIMEZONE_TOKYO)).toBe('2019-01-03');
      expect(formatter(END_DAY, TIMEZONE_TOKYO)).toBe('2019-01-02');
      expect(formatter(END_DAY + aDay, TIMEZONE_TOKYO)).toBe('2019-01-03');
      expect(formatter(END_DAY + aDay * 2, TIMEZONE_TOKYO)).toBe('2019-01-04');
    });
  });
  describe('format nicely an interval of between 7 and 30 days', () => {
    const formatter = niceTimeFormatter([START_DAY, START_DAY + aDay * 10]);
    test('UTC', () => {
      expect(formatter(START_DAY, TIMEZONE_UTC)).toBe('January 01');
      expect(formatter(START_DAY + aDay, TIMEZONE_UTC)).toBe('January 02');
      expect(formatter(START_DAY + aDay * 2, TIMEZONE_UTC)).toBe('January 03');
      expect(formatter(END_DAY, TIMEZONE_UTC)).toBe('January 01');
      expect(formatter(END_DAY + aDay, TIMEZONE_UTC)).toBe('January 02');
      expect(formatter(END_DAY + aDay * 2, TIMEZONE_UTC)).toBe('January 03');
    });
    test('America/New_York', () => {
      expect(formatter(START_DAY, TIMEZONE_NY)).toBe('December 31');
      expect(formatter(START_DAY + aDay, TIMEZONE_NY)).toBe('January 01');
      expect(formatter(START_DAY + aDay * 2, TIMEZONE_NY)).toBe('January 02');
      expect(formatter(END_DAY, TIMEZONE_NY)).toBe('January 01');
      expect(formatter(END_DAY + aDay, TIMEZONE_NY)).toBe('January 02');
      expect(formatter(END_DAY + aDay * 2, TIMEZONE_NY)).toBe('January 03');
    });
    test('Asia/Tokyo', () => {
      expect(formatter(START_DAY, TIMEZONE_TOKYO)).toBe('January 01');
      expect(formatter(START_DAY + aDay, TIMEZONE_TOKYO)).toBe('January 02');
      expect(formatter(START_DAY + aDay * 2, TIMEZONE_TOKYO)).toBe('January 03');
      expect(formatter(END_DAY, TIMEZONE_TOKYO)).toBe('January 02');
      expect(formatter(END_DAY + aDay, TIMEZONE_TOKYO)).toBe('January 03');
      expect(formatter(END_DAY + aDay * 2, TIMEZONE_TOKYO)).toBe('January 04');
    });
  });
  describe('format nicely an interval of between 1 and 7 days', () => {
    const formatter = niceTimeFormatter([START_DAY, START_DAY + aDay * 6]);
    test('UTC', () => {
      expect(formatter(START_DAY, TIMEZONE_UTC)).toBe('01-01 00:00');
      expect(formatter(START_DAY + aDay, TIMEZONE_UTC)).toBe('01-02 00:00');
      expect(formatter(START_DAY + aDay * 2, TIMEZONE_UTC)).toBe('01-03 00:00');
      expect(formatter(END_DAY, TIMEZONE_UTC)).toBe('01-01 23:59');
      expect(formatter(END_DAY + aDay, TIMEZONE_UTC)).toBe('01-02 23:59');
      expect(formatter(END_DAY + aDay * 2, TIMEZONE_UTC)).toBe('01-03 23:59');
    });
    test('America/New_York', () => {
      expect(formatter(START_DAY, TIMEZONE_NY)).toBe('12-31 19:00');
      expect(formatter(START_DAY + aDay, TIMEZONE_NY)).toBe('01-01 19:00');
      expect(formatter(START_DAY + aDay * 2, TIMEZONE_NY)).toBe('01-02 19:00');
      expect(formatter(END_DAY, TIMEZONE_NY)).toBe('01-01 18:59');
      expect(formatter(END_DAY + aDay, TIMEZONE_NY)).toBe('01-02 18:59');
      expect(formatter(END_DAY + aDay * 2, TIMEZONE_NY)).toBe('01-03 18:59');
    });
    test('Asia/Tokyo', () => {
      expect(formatter(START_DAY, TIMEZONE_TOKYO)).toBe('01-01 09:00');
      expect(formatter(START_DAY + aDay, TIMEZONE_TOKYO)).toBe('01-02 09:00');
      expect(formatter(START_DAY + aDay * 2, TIMEZONE_TOKYO)).toBe('01-03 09:00');
      expect(formatter(END_DAY, TIMEZONE_TOKYO)).toBe('01-02 08:59');
      expect(formatter(END_DAY + aDay, TIMEZONE_TOKYO)).toBe('01-03 08:59');
      expect(formatter(END_DAY + aDay * 2, TIMEZONE_TOKYO)).toBe('01-04 08:59');
    });
  });
  describe('format nicely an interval LTE than 1 day', () => {
    const formatter = niceTimeFormatter([START_DAY, START_DAY + aDay - 1]);
    test('UTC', () => {
      expect(formatter(START_DAY, TIMEZONE_UTC)).toBe('00:00:00');
      expect(formatter(START_DAY + anHour * 2.5, TIMEZONE_UTC)).toBe('02:30:00');
      expect(formatter(START_DAY + anHour * 10.5 + 1000, TIMEZONE_UTC)).toBe('10:30:01');
      expect(formatter(END_DAY, TIMEZONE_UTC)).toBe('23:59:59');
      expect(formatter(END_DAY + anHour * 2.5, TIMEZONE_UTC)).toBe('02:29:59');
      expect(formatter(END_DAY + anHour * 10.5 + 1000, TIMEZONE_UTC)).toBe('10:30:00');
    });
    test('America/New_York', () => {
      expect(formatter(START_DAY, TIMEZONE_NY)).toBe('19:00:00');
      expect(formatter(START_DAY + anHour * 2.5, TIMEZONE_NY)).toBe('21:30:00');
      expect(formatter(START_DAY + anHour * 10.5 + 1000, TIMEZONE_NY)).toBe('05:30:01');
      expect(formatter(END_DAY, TIMEZONE_NY)).toBe('18:59:59');
      expect(formatter(END_DAY + anHour * 2.5, TIMEZONE_NY)).toBe('21:29:59');
      expect(formatter(END_DAY + anHour * 10.5 + 1000, TIMEZONE_NY)).toBe('05:30:00');
    });
    test('Asia/Tokyo', () => {
      expect(formatter(START_DAY, TIMEZONE_TOKYO)).toBe('09:00:00');
      expect(formatter(START_DAY + anHour * 2.5, TIMEZONE_TOKYO)).toBe('11:30:00');
      expect(formatter(START_DAY + anHour * 10.5 + 1000, TIMEZONE_TOKYO)).toBe('19:30:01');
      expect(formatter(END_DAY, TIMEZONE_TOKYO)).toBe('08:59:59');
      expect(formatter(END_DAY + anHour * 2.5, TIMEZONE_TOKYO)).toBe('11:29:59');
      expect(formatter(END_DAY + anHour * 10.5 + 1000, TIMEZONE_TOKYO)).toBe('19:30:00');
    });
  });
});
