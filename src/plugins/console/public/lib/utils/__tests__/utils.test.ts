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

import * as utils from '../';
import { stringify } from '@osd/std';

describe('Utils class', () => {
  test('extract deprecation messages', function () {
    expect(
      utils.extractDeprecationMessages(
        '299 OpenSearch-6.0.0-alpha1-SNAPSHOT-abcdef1 "this is a warning" "Mon, 27 Feb 2017 14:52:14 GMT"'
      )
    ).toEqual(['#! Deprecation: this is a warning']);
    expect(
      utils.extractDeprecationMessages(
        '299 OpenSearch-6.0.0-alpha1-SNAPSHOT-abcdef1 "this is a warning"'
      )
    ).toEqual(['#! Deprecation: this is a warning']);

    expect(
      utils.extractDeprecationMessages(
        '299 OpenSearch-6.0.0-alpha1-SNAPSHOT-abcdef1 "this is a warning" "Mon, 27 Feb 2017 14:52:14 GMT", 299 OpenSearch-6.0.0-alpha1-SNAPSHOT-abcdef1 "this is a second warning" "Mon, 27 Feb 2017 14:52:14 GMT"'
      )
    ).toEqual(['#! Deprecation: this is a warning', '#! Deprecation: this is a second warning']);
    expect(
      utils.extractDeprecationMessages(
        '299 OpenSearch-6.0.0-alpha1-SNAPSHOT-abcdef1 "this is a warning", 299 OpenSearch-6.0.0-alpha1-SNAPSHOT-abcdef1 "this is a second warning"'
      )
    ).toEqual(['#! Deprecation: this is a warning', '#! Deprecation: this is a second warning']);

    expect(
      utils.extractDeprecationMessages(
        '299 OpenSearch-6.0.0-alpha1-SNAPSHOT-abcdef1 "this is a warning, and it includes a comma" "Mon, 27 Feb 2017 14:52:14 GMT"'
      )
    ).toEqual(['#! Deprecation: this is a warning, and it includes a comma']);
    expect(
      utils.extractDeprecationMessages(
        '299 OpenSearch-6.0.0-alpha1-SNAPSHOT-abcdef1 "this is a warning, and it includes a comma"'
      )
    ).toEqual(['#! Deprecation: this is a warning, and it includes a comma']);

    expect(
      utils.extractDeprecationMessages(
        '299 OpenSearch-6.0.0-alpha1-SNAPSHOT-abcdef1 "this is a warning, and it includes an escaped backslash \\\\ and a pair of \\"escaped quotes\\"" "Mon, 27 Feb 2017 14:52:14 GMT"'
      )
    ).toEqual([
      '#! Deprecation: this is a warning, and it includes an escaped backslash \\ and a pair of "escaped quotes"',
    ]);
    expect(
      utils.extractDeprecationMessages(
        '299 OpenSearch-6.0.0-alpha1-SNAPSHOT-abcdef1 "this is a warning, and it includes an escaped backslash \\\\ and a pair of \\"escaped quotes\\""'
      )
    ).toEqual([
      '#! Deprecation: this is a warning, and it includes an escaped backslash \\ and a pair of "escaped quotes"',
    ]);
  });

  test('unescape', function () {
    expect(utils.unescape('escaped backslash \\\\')).toEqual('escaped backslash \\');
    expect(utils.unescape('a pair of \\"escaped quotes\\"')).toEqual('a pair of "escaped quotes"');
    expect(utils.unescape('escaped quotes do not have to come in pairs: \\"')).toEqual(
      'escaped quotes do not have to come in pairs: "'
    );
  });

  test('split on unquoted comma followed by space', function () {
    expect(utils.splitOnUnquotedCommaSpace('a, b')).toEqual(['a', 'b']);
    expect(utils.splitOnUnquotedCommaSpace('a,b, c')).toEqual(['a,b', 'c']);
    expect(utils.splitOnUnquotedCommaSpace('"a, b"')).toEqual(['"a, b"']);
    expect(utils.splitOnUnquotedCommaSpace('"a, b", c')).toEqual(['"a, b"', 'c']);
    expect(utils.splitOnUnquotedCommaSpace('"a, b\\", c"')).toEqual(['"a, b\\", c"']);
    expect(utils.splitOnUnquotedCommaSpace(', a, b')).toEqual(['', 'a', 'b']);
    expect(utils.splitOnUnquotedCommaSpace('a, b, ')).toEqual(['a', 'b', '']);
    expect(utils.splitOnUnquotedCommaSpace('\\"a, b", "c, d\\", e", f"')).toEqual([
      '\\"a',
      'b", "c',
      'd\\"',
      'e", f"',
    ]);
  });

  describe('formatRequestBodyDoc', () => {
    const longPositive = BigInt(Number.MAX_SAFE_INTEGER) * 2n;
    const longNegative = BigInt(Number.MIN_SAFE_INTEGER) * 2n;
    const sample = {
      version: true,
      size: 500,
      sort: [{ time: { order: 'desc', unmapped_type: 'boolean' } }],
      aggs: {
        '2': {
          date_histogram: {
            field: 'time',
            fixed_interval: '30s',
            time_zone: 'America/Los_Angeles',
            min_doc_count: 1,
          },
        },
      },
      _source: { excludes: [] },
      query: {
        bool: {
          filter: [
            {
              match_all: {},
            },
            {
              range: {
                time: {
                  gte: '2222-22-22T22:22:22.222Z',
                  lte: '3333-33-33T33:33:33.333Z',
                  format: 'strict_date_optional_time',
                },
              },
            },
          ],
        },
      },
    };
    const objStringSample = {
      [`'"key"'`]: `'oddly' 'quoted "value"'`,
      obj: `{"nested": "inner-value", "inner-max": ${longPositive}`,
    };
    const data = [
      stringify({ data: { 'long-max': longPositive, 'long-min': longNegative, num: 2 } }),
      JSON.stringify(objStringSample),
      JSON.stringify(sample),
      JSON.stringify(sample, null, 3),
    ];

    test('changed with indenting', () => {
      expect(utils.formatRequestBodyDoc(data, true)).toMatchSnapshot();
    });

    test('changed with no-indenting', () => {
      expect(utils.formatRequestBodyDoc(data, false)).toMatchSnapshot();
    });

    test('unchanged with indenting', () => {
      const result = utils.formatRequestBodyDoc([JSON.stringify(sample, null, 2)], true);
      expect(result.changed).toStrictEqual(false);
    });

    test('unchanged with no-indenting', () => {
      const result = utils.formatRequestBodyDoc([JSON.stringify(sample)], false);
      expect(result.changed).toStrictEqual(false);
    });
  });
});
