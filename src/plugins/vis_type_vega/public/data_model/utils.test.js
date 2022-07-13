/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { Utils } from './utils';

describe('Utils.handleNonStringIndex', () => {
  test('should return same string on string input', async () => {
    expect(Utils.handleNonStringIndex('*')).toBe('*');
  });

  test('should return empty string on empty string input', async () => {
    expect(Utils.handleNonStringIndex('')).toBe('');
  });

  test('should return undefined on non-string input', async () => {
    expect(Utils.handleNonStringIndex(123)).toBe(undefined);
    expect(Utils.handleNonStringIndex(null)).toBe(undefined);
    expect(Utils.handleNonStringIndex(undefined)).toBe(undefined);
  });
});

describe('Utils.handleInvalidDate', () => {
  test('should return null if passed timestamp is Not A Number', async () => {
    expect(Utils.handleInvalidDate(Number.NaN)).toBe(null);
  });

  test('should return timestamp if passed timestamp is valid Number', async () => {
    expect(Utils.handleInvalidDate(1658189958487)).toBe(1658189958487);
  });

  test('should return string on string input', async () => {
    expect(Utils.handleInvalidDate('Sat Jul 16 2022 22:59:42')).toBe('Sat Jul 16 2022 22:59:42');
  });

  test('should return date on date input', async () => {
    const date = Date.now();
    expect(Utils.handleInvalidDate(date)).toBe(date);
  });

  test('should return null if input neigther timestamp, nor date, nor string', async () => {
    expect(Utils.handleInvalidDate(undefined)).toBe(null);
    expect(Utils.handleInvalidDate({ key: 'value' })).toBe(null);
  });
});

describe('Utils.handleInvalidQuery', () => {
  test('should return valid object on valid DSL query', async () => {
    const testQuery = { match_phrase: { customer_gender: 'MALE' } };
    expect(Utils.handleInvalidQuery(testQuery)).toStrictEqual(testQuery);
  });

  test('should return null on null or undefined input', async () => {
    expect(Utils.handleInvalidQuery(null)).toBe(null);
    expect(Utils.handleInvalidQuery(undefined)).toBe(null);
  });

  test('should return null if input object has function as property', async () => {
    const input = {
      key1: 'value1',
      key2: () => {
        alert('Hello!');
      },
    };

    expect(Utils.handleInvalidQuery(input)).toBe(null);
  });

  test('should return null if nested object has function as property', async () => {
    const input = {
      key1: 'value1',
      key2: {
        func: () => {
          alert('Hello!');
        },
      },
    };
    expect(Utils.handleInvalidQuery(input)).toBe(null);
  });

  test('should throw error on polluted query', async () => {
    const maliciousQueries = [
      JSON.parse(`{ "__proto__": null }`),
      JSON.parse(`{ "constructor": { "prototype" : null } }`),
    ];

    maliciousQueries.forEach((value) => {
      expect(() => {
        Utils.handleInvalidQuery(value);
      }).toThrowError();
    });
  });
});
