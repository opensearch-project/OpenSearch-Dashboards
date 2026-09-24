/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createFilterTransformation } from './filter_transformation';

const createHit = (source: Record<string, unknown>) => ({
  _index: 'test',
  _id: '1',
  _score: 1,
  _source: source,
});

describe('filter_transformation', () => {
  const instance = createFilterTransformation();
  type TestHit = ReturnType<typeof createHit>;
  type TestConfig = Parameters<typeof instance.transformationMethod>[1];
  const transform = (data: TestHit[], config: TestConfig) =>
    instance.transformationMethod(data, config).rows;

  describe('transformationMethod', () => {
    const data = [
      createHit({ status: 'active', count: 10, name: 'Alice' }),
      createHit({ status: 'inactive', count: 20, name: 'Bob' }),
      createHit({ status: 'active', count: 5, name: 'Charlie' }),
      createHit({ status: 'inactive', count: 15, name: 'Diana' }),
    ];

    it.each([
      {
        field: 'status',
        operator: 'equals' as const,
        value: 'active',
        expectedNames: ['Alice', 'Charlie'],
      },
      {
        field: 'status',
        operator: 'not_equals' as const,
        value: 'active',
        expectedNames: ['Bob', 'Diana'],
      },
      {
        field: 'name',
        operator: 'contains' as const,
        value: 'li',
        expectedNames: ['Alice', 'Charlie'],
      },
      {
        field: 'name',
        operator: 'not_contains' as const,
        value: 'li',
        expectedNames: ['Bob', 'Diana'],
      },
      {
        field: 'count',
        operator: 'greater_than' as const,
        value: '10',
        expectedNames: ['Bob', 'Diana'],
      },
      {
        field: 'count',
        operator: 'less_than' as const,
        value: '15',
        expectedNames: ['Alice', 'Charlie'],
      },
      {
        field: 'count',
        operator: 'greater_than_or_equal_to' as const,
        value: '10',
        expectedNames: ['Alice', 'Bob', 'Diana'],
      },
      {
        field: 'count',
        operator: 'less_than_or_equal_to' as const,
        value: '15',
        expectedNames: ['Alice', 'Charlie', 'Diana'],
      },
    ])('filters rows using $operator', ({ field, operator, value, expectedNames }) => {
      const result = instance.transformationMethod(data, { field, operator, value });

      expect(result.rows.map((row) => (row._source as Record<string, unknown>).name)).toEqual(
        expectedNames
      );
      expect(result.status).toBe('applied');
      expect(result.issues).toEqual([]);
    });

    it('excludes rows with null field values', () => {
      const dataWithNull = [...data, createHit({ status: null, count: null, name: null })];
      const result = transform(dataWithNull, {
        field: 'status',
        operator: 'equals',
        value: 'active',
      });
      expect(result).toHaveLength(2);
    });

    it('performs case-insensitive comparison', () => {
      const result = transform(data, {
        field: 'status',
        operator: 'equals',
        value: 'ACTIVE',
      });
      expect(result).toHaveLength(2);
    });

    describe('date operators', () => {
      const dateData = [
        createHit({ timestamp: '2024-01-01T00:00:00Z' }),
        createHit({ timestamp: '2024-06-15T00:00:00Z' }),
        createHit({ timestamp: '2024-12-31T00:00:00Z' }),
      ];

      it.each([
        { operator: 'is_earlier' as const, expected: ['2024-01-01T00:00:00Z'] },
        { operator: 'is_later' as const, expected: ['2024-12-31T00:00:00Z'] },
        {
          operator: 'is_earlier_or_equal' as const,
          expected: ['2024-01-01T00:00:00Z', '2024-06-15T00:00:00Z'],
        },
        {
          operator: 'is_later_or_equal' as const,
          expected: ['2024-06-15T00:00:00Z', '2024-12-31T00:00:00Z'],
        },
      ])('filters rows using $operator', ({ operator, expected }) => {
        const result = transform(dateData, {
          field: 'timestamp',
          operator,
          value: '2024-06-15T00:00:00Z',
        });

        expect(result.map((row) => (row._source as Record<string, unknown>).timestamp)).toEqual(
          expected
        );
      });
    });
  });

  describe('execution diagnostics', () => {
    it('treats rows without the filter field as non-matches', () => {
      const config = { field: 'removed_field', operator: 'equals' as const, value: 'active' };
      const data = [createHit({ status: 'active' })];
      const result = instance.transformationMethod(data, config);

      expect(result).toEqual({
        rows: [],
        status: 'applied',
        issues: [],
      });
    });

    it('filters rows with and without the configured field uniformly', () => {
      const config = { field: 'status', operator: 'equals' as const, value: 'active' };
      const data = [
        createHit({ status: 'active' }),
        createHit({ status: 'inactive' }),
        createHit({ name: 'missing status' }),
      ];

      expect(instance.transformationMethod(data, config)).toEqual({
        rows: [data[0]],
        status: 'applied',
        issues: [],
      });
    });

    it('skips when the filter is incomplete', () => {
      const config = { field: undefined, operator: 'equals' as const, value: '' };
      const data = [createHit({ status: 'active' })];

      expect(instance.transformationMethod(data, config)).toMatchObject({
        rows: data,
        status: 'skipped',
        issues: [{ code: 'invalid_config' }],
      });
    });
  });

  describe('createFilterTransformation', () => {
    it('creates instance with default config', () => {
      expect(instance.definition_id).toBe('filter');
      expect(instance.config).toEqual({ field: undefined, operator: 'equals', value: '' });
      expect(instance.hide).toBe(false);
    });
  });
});
