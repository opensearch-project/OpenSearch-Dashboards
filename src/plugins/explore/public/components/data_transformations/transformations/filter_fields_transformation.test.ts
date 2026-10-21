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
  type TestHit = ReturnType<typeof createHit>;
  type TestConfig = Parameters<typeof instance.transformationMethod>[1];
  const transform = (data: TestHit[], config: TestConfig) =>
    instance.transformationMethod(data, config).rows;

  describe('transformationMethod', () => {
    const data = [
      createHit({ name: 'Alice', age: 30, city: 'NYC' }),
      createHit({ name: 'Bob', age: 25, city: 'LA' }),
    ];

    it('includes only specified fields', () => {
      const result = instance.transformationMethod(data, {
        mode: 'include',
        fieldOptions: [{ name: 'name', visFieldType: VisFieldType.Categorical }],
      });
      expect(result).toEqual({
        rows: [createHit({ name: 'Alice' }), createHit({ name: 'Bob' })],
        status: 'applied',
        issues: [],
      });
    });

    it('excludes specified fields', () => {
      const result = transform(data, {
        mode: 'exclude',
        fieldOptions: [{ name: 'city', visFieldType: VisFieldType.Categorical }],
      });
      expect(result[0]._source).toEqual({ name: 'Alice', age: 30 });
      expect(result[1]._source).toEqual({ name: 'Bob', age: 25 });
    });

    it('includes multiple fields', () => {
      const result = transform(data, {
        mode: 'include',
        fieldOptions: [
          { name: 'name', visFieldType: VisFieldType.Categorical },
          { name: 'age', visFieldType: VisFieldType.Numerical },
        ],
      });
      expect(result[0]._source).toEqual({ name: 'Alice', age: 30 });
    });
  });

  describe('execution diagnostics', () => {
    it.each([
      {
        mode: 'include' as const,
        fieldOptions: [
          { name: 'name', visFieldType: VisFieldType.Categorical },
          { name: 'removed', visFieldType: VisFieldType.Categorical },
        ],
      },
      {
        mode: 'exclude' as const,
        fieldOptions: [
          { name: 'age', visFieldType: VisFieldType.Numerical },
          { name: 'removed', visFieldType: VisFieldType.Categorical },
        ],
      },
    ])(
      'filters available fields in $mode mode without reporting absent configured fields',
      (config) => {
        const data = [createHit({ name: 'Alice', age: 30 })];
        const result = instance.transformationMethod(data, config);

        expect(result).toEqual({
          rows: [createHit({ name: 'Alice' })],
          status: 'applied',
          issues: [],
        });
      }
    );

    it('applies independently to rows with different fields', () => {
      const config = {
        mode: 'include' as const,
        fieldOptions: [
          { name: 'name', visFieldType: VisFieldType.Categorical },
          { name: 'age', visFieldType: VisFieldType.Numerical },
        ],
      };
      const data = [createHit({ name: 'Alice', city: 'NYC' }), createHit({ age: 30, city: 'LA' })];

      expect(instance.transformationMethod(data, config)).toEqual({
        rows: [createHit({ name: 'Alice' }), createHit({ age: 30 })],
        status: 'applied',
        issues: [],
      });
    });

    it('skips and reports an invalid config when no fields are configured', () => {
      const config = { mode: 'include' as const, fieldOptions: [] };
      const data = [createHit({ name: 'Alice' })];

      expect(instance.transformationMethod(data, config)).toMatchObject({
        rows: data,
        status: 'skipped',
        issues: [{ code: 'invalid_config' }],
      });
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
