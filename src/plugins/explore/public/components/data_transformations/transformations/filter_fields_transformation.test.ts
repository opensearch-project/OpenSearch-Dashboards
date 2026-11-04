/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createFilterFieldsTransformation } from './filter_fields_transformation';

const createRow = (source: Record<string, unknown>) => source;

describe('filter_fields_transformation', () => {
  const instance = createFilterFieldsTransformation();
  type TestRow = ReturnType<typeof createRow>;
  type TestConfig = Parameters<typeof instance.transformationMethod>[1];
  const transform = (data: TestRow[], config: TestConfig) =>
    instance.transformationMethod(data, config).rows;

  describe('transformationMethod', () => {
    const data = [
      createRow({ name: 'Alice', age: 30, city: 'NYC' }),
      createRow({ name: 'Bob', age: 25, city: 'LA' }),
    ];

    it('includes only specified fields', () => {
      const result = instance.transformationMethod(data, {
        mode: 'include',
        fieldOptions: [{ name: 'name' }],
      });
      expect(result).toEqual({
        rows: [createRow({ name: 'Alice' }), createRow({ name: 'Bob' })],
        status: 'applied',
        issues: [],
      });
    });

    it('excludes specified fields', () => {
      const result = transform(data, {
        mode: 'exclude',
        fieldOptions: [{ name: 'city' }],
      });
      expect(result[0]).toEqual({ name: 'Alice', age: 30 });
      expect(result[1]).toEqual({ name: 'Bob', age: 25 });
    });

    it('includes multiple fields', () => {
      const result = transform(data, {
        mode: 'include',
        fieldOptions: [{ name: 'name' }, { name: 'age' }],
      });
      expect(result[0]).toEqual({ name: 'Alice', age: 30 });
    });
  });

  describe('execution diagnostics', () => {
    it.each([
      {
        mode: 'include' as const,
        fieldOptions: [{ name: 'name' }, { name: 'removed' }],
      },
      {
        mode: 'exclude' as const,
        fieldOptions: [{ name: 'age' }, { name: 'removed' }],
      },
    ])(
      'filters available fields in $mode mode without reporting absent configured fields',
      (config) => {
        const data = [createRow({ name: 'Alice', age: 30 })];
        const result = instance.transformationMethod(data, config);

        expect(result).toEqual({
          rows: [createRow({ name: 'Alice' })],
          status: 'applied',
          issues: [],
        });
      }
    );

    it('applies independently to rows with different fields', () => {
      const config = {
        mode: 'include' as const,
        fieldOptions: [{ name: 'name' }, { name: 'age' }],
      };
      const data = [createRow({ name: 'Alice', city: 'NYC' }), createRow({ age: 30, city: 'LA' })];

      expect(instance.transformationMethod(data, config)).toEqual({
        rows: [createRow({ name: 'Alice' }), createRow({ age: 30 })],
        status: 'applied',
        issues: [],
      });
    });

    it('skips and reports an invalid config when no fields are configured', () => {
      const config = { mode: 'include' as const, fieldOptions: [] };
      const data = [createRow({ name: 'Alice' })];

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
