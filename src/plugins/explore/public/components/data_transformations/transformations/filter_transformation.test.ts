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

  describe('transformationMethod', () => {
    const data = [
      createHit({ status: 'active', count: 10, name: 'Alice' }),
      createHit({ status: 'inactive', count: 20, name: 'Bob' }),
      createHit({ status: 'active', count: 5, name: 'Charlie' }),
      createHit({ status: 'inactive', count: 15, name: 'Diana' }),
    ];

    it('returns original data when config is incomplete', () => {
      const result = instance.transformationMethod(data, {
        field: undefined,
        operator: 'equals',
        value: '',
      });
      expect(result).toHaveLength(4);
    });

    it('filters by equals operator', () => {
      const result = instance.transformationMethod(data, {
        field: 'status',
        operator: 'equals',
        value: 'active',
      });
      expect(result).toHaveLength(2);
      expect(result[0]._source).toEqual({ status: 'active', count: 10, name: 'Alice' });
    });

    it('filters by not_equals operator', () => {
      const result = instance.transformationMethod(data, {
        field: 'status',
        operator: 'not_equals',
        value: 'active',
      });
      expect(result).toHaveLength(2);
      expect((result[0]._source as Record<string, unknown>).name).toBe('Bob');
    });

    it('filters by contains operator', () => {
      const result = instance.transformationMethod(data, {
        field: 'name',
        operator: 'contains',
        value: 'li',
      });
      expect(result).toHaveLength(2);
    });

    it('filters by not_contains operator', () => {
      const result = instance.transformationMethod(data, {
        field: 'name',
        operator: 'not_contains',
        value: 'li',
      });
      expect(result).toHaveLength(2);
    });

    it('filters by greater_than with numeric field', () => {
      const result = instance.transformationMethod(data, {
        field: 'count',
        operator: 'greater_than',
        value: '10',
      });
      expect(result).toHaveLength(2);
    });

    it('filters by less_than with numeric field', () => {
      const result = instance.transformationMethod(data, {
        field: 'count',
        operator: 'less_than',
        value: '15',
      });
      expect(result).toHaveLength(2);
    });

    it('filters by greater_than_or_equal_to with numeric field', () => {
      const result = instance.transformationMethod(data, {
        field: 'count',
        operator: 'greater_than_or_equal_to',
        value: '10',
      });
      expect(result).toHaveLength(3);
    });

    it('filters by less_than_or_equal_to with numeric field', () => {
      const result = instance.transformationMethod(data, {
        field: 'count',
        operator: 'less_than_or_equal_to',
        value: '15',
      });
      expect(result).toHaveLength(3);
    });

    it('excludes rows with null field values', () => {
      const dataWithNull = [...data, createHit({ status: null, count: null, name: null })];
      const result = instance.transformationMethod(dataWithNull, {
        field: 'status',
        operator: 'equals',
        value: 'active',
      });
      expect(result).toHaveLength(2);
    });

    it('performs case-insensitive comparison', () => {
      const result = instance.transformationMethod(data, {
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

      it('filters by is_earlier', () => {
        const result = instance.transformationMethod(dateData, {
          field: 'timestamp',
          operator: 'is_earlier',
          value: '2024-06-15T00:00:00Z',
        });
        expect(result).toHaveLength(1);
      });

      it('filters by is_later', () => {
        const result = instance.transformationMethod(dateData, {
          field: 'timestamp',
          operator: 'is_later',
          value: '2024-06-15T00:00:00Z',
        });
        expect(result).toHaveLength(1);
      });

      it('filters by is_earlier_or_equal', () => {
        const result = instance.transformationMethod(dateData, {
          field: 'timestamp',
          operator: 'is_earlier_or_equal',
          value: '2024-06-15T00:00:00Z',
        });
        expect(result).toHaveLength(2);
      });

      it('filters by is_later_or_equal', () => {
        const result = instance.transformationMethod(dateData, {
          field: 'timestamp',
          operator: 'is_later_or_equal',
          value: '2024-06-15T00:00:00Z',
        });
        expect(result).toHaveLength(2);
      });
    });
  });

  describe('validateConfig', () => {
    it('returns config unchanged when field exists', () => {
      const config = { field: 'status', operator: 'equals' as const, value: 'active' };
      const fields = [{ name: 'status' }, { name: 'count' }];
      expect(instance.validateConfig!(config, fields)).toEqual(config);
    });

    it('resets field when it no longer exists', () => {
      const config = { field: 'removed_field', operator: 'equals' as const, value: 'active' };
      const fields = [{ name: 'status' }, { name: 'count' }];
      const result = instance.validateConfig!(config, fields);
      expect(result.field).toBeUndefined();
      expect(result.value).toBe('');
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
