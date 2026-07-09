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

import { mapPhrase } from './map_phrase';
import { PhraseFilter, Filter } from '../../../../../common';

describe('filter manager utilities', () => {
  describe('mapPhrase()', () => {
    test('should return the key and value for matching filters', async () => {
      const filter = {
        meta: { index: 'logstash-*' },
        query: { match: { _type: { query: 'apache', type: 'phrase' } } },
      } as PhraseFilter;

      const result = mapPhrase(filter);

      expect(result).toHaveProperty('value');
      expect(result).toHaveProperty('key', '_type');

      if (result.value) {
        const displayName = result.value();
        expect(displayName).toBe('apache');
      }
    });

    test('should return undefined for none matching', (done) => {
      const filter = {
        meta: { index: 'logstash-*' },
        query: { query_string: { query: 'foo:bar' } },
      } as Filter;

      try {
        mapPhrase(filter);
      } catch (e) {
        expect(e).toBe(filter);
        done();
      }
    });

    test('should return the key and value for scripted phrase filters with value 0', () => {
      const filter = ({
        meta: { index: 'logstash-*', field: 'script_number' },
        script: {
          script: {
            lang: 'painless',
            params: { value: 0 },
            source:
              'boolean compare(Supplier s, def v) {return s.get() == v;}compare(() -> { doc["bytes"].value }, params.value);',
          },
        },
      } as unknown) as PhraseFilter;

      const result = mapPhrase(filter);

      expect(result).toHaveProperty('key', 'script_number');
      expect(result).toHaveProperty('type', 'phrase');

      if (result.value) {
        const displayName = result.value();
        expect(displayName).toBe(0);
      }
    });

    test('should return the key and value for scripted phrase filters with value false', () => {
      const filter = ({
        meta: { index: 'logstash-*', field: 'script_boolean' },
        script: {
          script: {
            lang: 'painless',
            params: { value: false },
            source:
              'boolean compare(Supplier s, def v) {return s.get() == v;}compare(() -> { doc["is_active"].value }, params.value);',
          },
        },
      } as unknown) as PhraseFilter;

      const result = mapPhrase(filter);

      expect(result).toHaveProperty('key', 'script_boolean');
      expect(result).toHaveProperty('type', 'phrase');

      if (result.value) {
        const displayName = result.value();
        expect(displayName).toBe(false);
      }
    });

    test('should return the key and value for scripted phrase filters with empty string value', () => {
      const filter = ({
        meta: { index: 'logstash-*', field: 'script_string' },
        script: {
          script: {
            lang: 'painless',
            params: { value: '' },
            source:
              'boolean compare(Supplier s, def v) {return s.get() == v;}compare(() -> { doc["status"].value }, params.value);',
          },
        },
      } as unknown) as PhraseFilter;

      const result = mapPhrase(filter);

      expect(result).toHaveProperty('key', 'script_string');
      expect(result).toHaveProperty('type', 'phrase');

      if (result.value) {
        const displayName = result.value();
        expect(displayName).toBe('');
      }
    });
  });
});
