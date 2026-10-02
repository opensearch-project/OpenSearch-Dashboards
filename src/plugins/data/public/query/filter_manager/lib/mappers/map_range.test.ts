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

import { mapRange } from './map_range';
import { FilterMeta, RangeFilter, Filter, FILTERS } from '../../../../../common';

describe('filter manager utilities', () => {
  describe('mapRange()', () => {
    test('should return the key and value for matching filters with gt/lt', async () => {
      const filter = {
        meta: { index: 'logstash-*' } as FilterMeta,
        range: { bytes: { lt: 2048, gt: 1024 } },
      } as RangeFilter;
      const result = mapRange(filter);

      expect(result).toHaveProperty('key', 'bytes');
      expect(result).toHaveProperty('value');
      if (result.value) {
        const displayName = result.value();
        expect(displayName).toBe('1024 to 2048');
      }
    });

    test('should preserve phrase metadata for numeric exact date ranges', () => {
      const epochMillis = Date.parse('2026-09-16T10:15:30.000Z');
      const filter = {
        meta: {
          index: 'logstash-*',
          type: FILTERS.PHRASE,
          params: { query: epochMillis },
        } as FilterMeta,
        range: {
          '@timestamp': {
            gte: '2026-09-16T10:15:30.000Z',
            lte: '2026-09-16T10:15:30.000Z',
            format: 'strict_date_optional_time',
          },
        },
      } as RangeFilter;

      const result = mapRange(filter);

      expect(result).toMatchObject({
        key: '@timestamp',
        params: { query: epochMillis },
        type: FILTERS.PHRASE,
      });
      expect(result.value()).toBe(epochMillis);
    });

    test('should preserve phrase metadata for string exact date ranges', () => {
      const value = '2026-09-16T10:15:30Z';
      const filter = {
        meta: {
          index: 'logstash-*',
          type: FILTERS.PHRASE,
          params: { query: value },
        } as FilterMeta,
        range: {
          '@timestamp': {
            gte: '2026-09-16T10:15:30.000Z',
            lte: '2026-09-16T10:15:30.000Z',
            format: 'strict_date_optional_time',
          },
        },
      } as RangeFilter;

      const result = mapRange(filter);

      expect(result).toMatchObject({
        key: '@timestamp',
        params: { query: value },
        type: FILTERS.PHRASE,
      });
      expect(result.value()).toBe(value);
    });

    test('should return undefined for none matching', (done) => {
      const filter = {
        meta: { index: 'logstash-*' },
        query: { query_string: { query: 'foo:bar' } },
      } as Filter;

      try {
        mapRange(filter);
      } catch (e) {
        expect(e).toBe(filter);

        done();
      }
    });
  });
});
