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

describe('Date Formatter, local CI time in UTC', () => {
  test('format nicely an interval of more than 30 days', () => {
    const formatter = niceTimeFormatter([START_DAY, START_DAY + aDay * 31]);

    expect(formatter(START_DAY)).toBe('2019-01-01');
    expect(formatter(START_DAY + aDay)).toBe('2019-01-02');
    expect(formatter(START_DAY + aDay * 2)).toBe('2019-01-03');
    expect(formatter(END_DAY)).toBe('2019-01-01');
    expect(formatter(END_DAY + aDay)).toBe('2019-01-02');
    expect(formatter(END_DAY + aDay * 2)).toBe('2019-01-03');
  });

  describe('format nicely an interval of between 7 and 30 days', () => {
    const formatter = niceTimeFormatter([START_DAY, START_DAY + aDay * 10]);

    expect(formatter(START_DAY)).toBe('January 01');
    expect(formatter(START_DAY + aDay)).toBe('January 02');
    expect(formatter(START_DAY + aDay * 2)).toBe('January 03');
    expect(formatter(END_DAY)).toBe('January 01');
    expect(formatter(END_DAY + aDay)).toBe('January 02');
    expect(formatter(END_DAY + aDay * 2)).toBe('January 03');
  });

  describe('format nicely an interval of between 1 and 7 days', () => {
    const formatter = niceTimeFormatter([START_DAY, START_DAY + aDay * 6]);

    expect(formatter(START_DAY)).toBe('01-01 00:00');
    expect(formatter(START_DAY + aDay)).toBe('01-02 00:00');
    expect(formatter(START_DAY + aDay * 2)).toBe('01-03 00:00');
    expect(formatter(END_DAY)).toBe('01-01 23:59');
    expect(formatter(END_DAY + aDay)).toBe('01-02 23:59');
    expect(formatter(END_DAY + aDay * 2)).toBe('01-03 23:59');
  });

  describe('format nicely an interval LTE than 1 day', () => {
    const formatter = niceTimeFormatter([START_DAY, START_DAY + aDay - 1]);

    expect(formatter(START_DAY)).toBe('00:00:00');
    expect(formatter(START_DAY + anHour * 2.5)).toBe('02:30:00');
    expect(formatter(START_DAY + anHour * 10.5 + 1000)).toBe('10:30:01');
    expect(formatter(END_DAY)).toBe('23:59:59');
    expect(formatter(END_DAY + anHour * 2.5)).toBe('02:29:59');
    expect(formatter(END_DAY + anHour * 10.5 + 1000)).toBe('10:30:00');
  });
});
