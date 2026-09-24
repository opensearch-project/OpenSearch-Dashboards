/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSortByTransformation } from './sortby_transformation';

const createHit = (source: Record<string, unknown>) => ({
  _index: 'test',
  _id: '1',
  _score: 1,
  _source: source,
});

describe('sortby_transformation', () => {
  const instance = createSortByTransformation();
  type TestHit = ReturnType<typeof createHit>;
  type TestConfig = Parameters<typeof instance.transformationMethod>[1];
  const transform = (data: TestHit[], config: TestConfig) =>
    instance.transformationMethod(data, config).rows;

  describe('transformationMethod', () => {
    const data = [
      createHit({ name: 'Charlie', count: 5 }),
      createHit({ name: 'Alice', count: 10 }),
      createHit({ name: 'Bob', count: 3 }),
    ];

    it.each([
      { field: 'name', order: 'asc' as const, expected: ['Alice', 'Bob', 'Charlie'] },
      { field: 'name', order: 'desc' as const, expected: ['Charlie', 'Bob', 'Alice'] },
      { field: 'count', order: 'asc' as const, expected: [3, 5, 10] },
      { field: 'count', order: 'desc' as const, expected: [10, 5, 3] },
    ])('sorts $field in $order order', ({ field, order, expected }) => {
      const result = instance.transformationMethod(data, { field, order });

      expect(result.rows.map((row) => (row._source as Record<string, unknown>)[field])).toEqual(
        expected
      );
      expect(result.status).toBe('applied');
      expect(result.issues).toEqual([]);
    });

    it('sorts by a nested field path', () => {
      const nestedData = [
        createHit({ details: { name: 'Bob' } }),
        createHit({ details: { name: 'Alice' } }),
      ];

      const result = transform(nestedData, { field: 'details.name', order: 'asc' });

      expect(result).toEqual([nestedData[1], nestedData[0]]);
    });

    it('pushes null values to end', () => {
      const dataWithNull = [...data, createHit({ name: null, count: null })];
      const result = transform(dataWithNull, { field: 'name', order: 'asc' });
      expect((result[3]._source as Record<string, unknown>).name).toBeNull();
    });

    it('does not mutate original data', () => {
      const original = [...data];
      transform(data, { field: 'name', order: 'asc' });
      expect(data).toEqual(original);
    });
  });

  describe('execution diagnostics', () => {
    it('skips when the required field no longer exists', () => {
      const config = { field: 'removed_field', order: 'asc' as const };
      const data = [createHit({ name: 'Alice', count: 1 })];
      const result = instance.transformationMethod(data, config);

      expect(result).toMatchObject({
        rows: data,
        status: 'skipped',
        issues: [{ code: 'missing_fields', fields: ['removed_field'] }],
      });
    });

    it('sorts rows with values and places rows missing the field last', () => {
      const config = { field: 'name', order: 'asc' as const };
      const data = [
        createHit({ name: 'Bob' }),
        createHit({ label: 'missing name' }),
        createHit({ name: 'Alice' }),
      ];

      expect(instance.transformationMethod(data, config)).toMatchObject({
        rows: [data[2], data[0], data[1]],
        status: 'partially_applied',
        issues: [{ code: 'missing_fields', fields: ['name'] }],
      });
    });

    it('skips when the sort field is not configured', () => {
      const config = { field: undefined, order: 'asc' as const };
      const data = [createHit({ name: 'Alice' })];

      expect(instance.transformationMethod(data, config)).toMatchObject({
        rows: data,
        status: 'skipped',
        issues: [{ code: 'invalid_config' }],
      });
    });
  });

  describe('createSortByTransformation', () => {
    it('creates instance with default config', () => {
      expect(instance.definition_id).toBe('sort_by');
      expect(instance.config).toEqual({ field: undefined, order: 'asc' });
      expect(instance.hide).toBe(false);
    });
  });
});
