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

import _ from 'lodash';
// @ts-ignore
import realHits from 'fixtures/real_hits.js';
// @ts-ignore
import stubbedLogstashFields from 'fixtures/logstash_fields';
import { coreMock } from '../../../../../../../core/public/mocks';
import { IndexPattern, IndexPatternField } from '../../../../../../data/public';
import { getStubIndexPattern } from '../../../../../../data/public/test_utils';
import { Bucket } from '../types';
import {
  groupValues,
  getFieldValues,
  getFieldValueCounts,
  FieldValueCountsParams,
} from './field_calculator';

let indexPattern: IndexPattern;

describe('field_calculator', function () {
  beforeEach(function () {
    indexPattern = getStubIndexPattern(
      'logstash-*',
      (cfg: any) => cfg,
      'time',
      stubbedLogstashFields(),
      coreMock.createSetup()
    );
  });

  describe('groupValues', function () {
    let groups: Record<string, any>;
    let grouped: boolean;
    let values: any[];
    beforeEach(function () {
      values = [
        ['foo', 'bar'],
        'foo',
        'foo',
        undefined,
        ['foo', 'bar'],
        'bar',
        'baz',
        null,
        null,
        null,
        'foo',
        undefined,
      ];
      groups = groupValues(values, grouped);
    });

    it('should return an object', function () {
      expect(groups).toBeInstanceOf(Object);
    });

    it('should throw an error if any value is a plain object', function () {
      expect(function () {
        groupValues([{}, true, false], grouped);
      }).toThrowError();
    });

    it('should handle values with dots in them', function () {
      values = ['0', '0.........', '0.......,.....'];
      groups = groupValues(values, grouped);
      expect(groups[values[0]].count).toBe(1);
      expect(groups[values[1]].count).toBe(1);
      expect(groups[values[2]].count).toBe(1);
    });

    it('should have a key for value in the array when not grouping array terms', function () {
      expect(_.keys(groups).length).toBe(3);
      expect(groups.foo).toBeInstanceOf(Object);
      expect(groups.bar).toBeInstanceOf(Object);
      expect(groups.baz).toBeInstanceOf(Object);
    });

    it('should count array terms independently', function () {
      expect(groups['foo,bar']).toBeUndefined();
      expect(groups.foo.count).toBe(5);
      expect(groups.bar.count).toBe(3);
      expect(groups.baz.count).toBe(1);
    });

    describe('grouped array terms', function () {
      beforeEach(function () {
        grouped = true;
        groups = groupValues(values, grouped);
      });

      it('should group array terms when grouped is true', function () {
        expect(_.keys(groups).length).toBe(4);
        expect(groups['foo,bar']).toBeInstanceOf(Object);
      });

      it('should contain the original array as the value', function () {
        expect(groups['foo,bar'].value).toEqual(['foo', 'bar']);
      });

      it('should count the pairs separately from the values they contain', function () {
        expect(groups['foo,bar'].count).toBe(2);
        expect(groups.foo.count).toBe(3);
        expect(groups.bar.count).toBe(1);
      });
    });
  });

  describe('getFieldValues', function () {
    let hits: any;

    beforeEach(function () {
      hits = _.each(_.cloneDeep(realHits), (hit) => indexPattern.flattenHit(hit));
    });

    it('should return an array of values for _source fields', function () {
      const extensions = getFieldValues({
        hits,
        field: indexPattern.fields.getByName('extension') as IndexPatternField,
        indexPattern,
      });
      expect(extensions).toBeInstanceOf(Array);
      expect(
        _.filter(extensions, function (v) {
          return v === 'html';
        }).length
      ).toBe(8);
      expect(_.uniq(_.clone(extensions)).sort()).toEqual(['gif', 'html', 'php', 'png']);
    });

    it('should return an array of values for core meta fields', function () {
      const types = getFieldValues({
        hits,
        field: indexPattern.fields.getByName('_type') as IndexPatternField,
        indexPattern,
      });
      expect(types).toBeInstanceOf(Array);
      expect(
        _.filter(types, function (v) {
          return v === 'apache';
        }).length
      ).toBe(18);
      expect(_.uniq(_.clone(types)).sort()).toEqual(['apache', 'nginx']);
    });
  });

  describe('getFieldValueCounts', function () {
    let params: FieldValueCountsParams;
    beforeEach(function () {
      params = {
        hits: _.cloneDeep(realHits),
        field: indexPattern.fields.getByName('extension') as IndexPatternField,
        count: 3,
        indexPattern,
      };
    });

    it('counts the top 5 values by default', function () {
      params.hits = params.hits.map((hit: Record<string, any>, i) => ({
        ...hit,
        _source: {
          extension: `${hit._source.extension}-${i}`,
        },
      }));
      params.count = undefined;
      const extensions = getFieldValueCounts(params);
      expect(extensions).toBeInstanceOf(Object);
      expect(extensions.buckets).toBeInstanceOf(Array);
      const buckets = extensions.buckets as Bucket[];
      expect(buckets.length).toBe(5);
      expect(extensions.error).toBeUndefined();
    });

    it('counts only distinct values if less than default', function () {
      params.count = undefined;
      const extensions = getFieldValueCounts(params);
      expect(extensions).toBeInstanceOf(Object);
      expect(extensions.buckets).toBeInstanceOf(Array);
      const buckets = extensions.buckets as Bucket[];
      expect(buckets.length).toBe(4);
      expect(extensions.error).toBeUndefined();
    });

    it('counts only distinct values if less than specified count', function () {
      params.count = 10;
      const extensions = getFieldValueCounts(params);
      expect(extensions).toBeInstanceOf(Object);
      expect(extensions.buckets).toBeInstanceOf(Array);
      const buckets = extensions.buckets as Bucket[];
      expect(buckets.length).toBe(4);
      expect(extensions.error).toBeUndefined();
    });

    it('counts the top 3 values', function () {
      const extensions = getFieldValueCounts(params);
      expect(extensions).toBeInstanceOf(Object);
      expect(extensions.buckets).toBeInstanceOf(Array);
      const buckets = extensions.buckets as Bucket[];
      expect(buckets.length).toBe(3);
      expect(_.map(buckets, 'value')).toEqual(['html', 'gif', 'php']);
      expect(extensions.error).toBeUndefined();
    });

    it('fails to analyze geo and attachment types', function () {
      params.field = indexPattern.fields.getByName('point') as IndexPatternField;
      expect(getFieldValueCounts(params).error).not.toBeUndefined();

      params.field = indexPattern.fields.getByName('area') as IndexPatternField;
      expect(getFieldValueCounts(params).error).not.toBeUndefined();

      params.field = indexPattern.fields.getByName('request_body') as IndexPatternField;
      expect(getFieldValueCounts(params).error).not.toBeUndefined();
    });

    it('fails to analyze fields that are in the mapping, but not the hits', function () {
      params.field = indexPattern.fields.getByName('ip') as IndexPatternField;
      expect(getFieldValueCounts(params).error).not.toBeUndefined();
    });

    it('counts the total hits', function () {
      expect(getFieldValueCounts(params).total).toBe(params.hits.length);
    });

    it('counts the hits the field exists in', function () {
      params.field = indexPattern.fields.getByName('phpmemory') as IndexPatternField;
      expect(getFieldValueCounts(params).exists).toBe(5);
    });

    it('catches and returns errors', function () {
      params.hits = params.hits.map((hit: Record<string, any>) => ({
        ...hit,
        _source: {
          extension: { foo: hit._source.extension },
        },
      }));
      params.grouped = true;
      expect(typeof getFieldValueCounts(params).error).toBe('string');
    });
  });
});
