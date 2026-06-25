/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createFilterFieldsTransformation } from './filter_fields_transformation';
import { VisFieldType } from '../../visualizations/types';

const createHit = (source: Record<string, unknown>) => ({
  _index: 'test',
  _id: '1',
  _score: 1,
  _source: source,
});

describe('filter_fields_transformation', () => {
  const instance = createFilterFieldsTransformation();

  describe('transformationMethod', () => {
    const data = [
      createHit({ name: 'Alice', age: 30, city: 'NYC' }),
      createHit({ name: 'Bob', age: 25, city: 'LA' }),
    ];

    it('returns original data when no fields are selected', () => {
      const result = instance.transformationMethod(data, {
        mode: 'include',
        fieldOptions: [],
      });
      expect(result).toEqual(data);
    });

    it('includes only specified fields', () => {
      const result = instance.transformationMethod(data, {
        mode: 'include',
        fieldOptions: [{ name: 'name', visFieldType: VisFieldType.String }],
      });
      expect(result[0]._source).toEqual({ name: 'Alice' });
      expect(result[1]._source).toEqual({ name: 'Bob' });
    });

    it('excludes specified fields', () => {
      const result = instance.transformationMethod(data, {
        mode: 'exclude',
        fieldOptions: [{ name: 'city', visFieldType: VisFieldType.String }],
      });
      expect(result[0]._source).toEqual({ name: 'Alice', age: 30 });
      expect(result[1]._source).toEqual({ name: 'Bob', age: 25 });
    });

    it('includes multiple fields', () => {
      const result = instance.transformationMethod(data, {
        mode: 'include',
        fieldOptions: [
          { name: 'name', visFieldType: VisFieldType.String },
          { name: 'age', visFieldType: VisFieldType.Numerical },
        ],
      });
      expect(result[0]._source).toEqual({ name: 'Alice', age: 30 });
    });
  });

  describe('validateConfig', () => {
    it('returns config unchanged when all fields exist', () => {
      const config = {
        mode: 'include' as const,
        fieldOptions: [
          { name: 'name', visFieldType: VisFieldType.String },
          { name: 'age', visFieldType: VisFieldType.Numerical },
        ],
      };
      const fields = [{ name: 'name' }, { name: 'age' }, { name: 'city' }];
      expect(instance.validateConfig!(config, fields)).toEqual(config);
    });

    it('removes fields that no longer exist', () => {
      const config = {
        mode: 'include' as const,
        fieldOptions: [
          { name: 'name', visFieldType: VisFieldType.String },
          { name: 'removed', visFieldType: VisFieldType.String },
        ],
      };
      const fields = [{ name: 'name' }, { name: 'age' }];
      const result = instance.validateConfig!(config, fields);
      expect(result.fieldOptions).toHaveLength(1);
      expect(result.fieldOptions[0].name).toBe('name');
    });
  });

  describe('createFilterFieldsTransformation', () => {
    it('creates instance with default config', () => {
      expect(instance.definition_id).toBe('filter_fields');
      expect(instance.config).toEqual({ mode: 'exclude', fieldOptions: [] });
      expect(instance.hide).toBe(false);
    });
  });
});
