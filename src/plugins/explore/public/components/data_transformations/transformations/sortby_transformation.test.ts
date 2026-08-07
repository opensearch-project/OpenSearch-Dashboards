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

  describe('transformationMethod', () => {
    const data = [
      createHit({ name: 'Charlie', count: 5 }),
      createHit({ name: 'Alice', count: 10 }),
      createHit({ name: 'Bob', count: 3 }),
    ];

    it('returns original data when field is not set', () => {
      const result = instance.transformationMethod(data, { field: undefined, order: 'asc' });
      expect(result).toHaveLength(3);
      expect((result[0]._source as Record<string, unknown>).name).toBe('Charlie');
    });

    it('sorts strings ascending', () => {
      const result = instance.transformationMethod(data, { field: 'name', order: 'asc' });
      expect((result[0]._source as Record<string, unknown>).name).toBe('Alice');
      expect((result[1]._source as Record<string, unknown>).name).toBe('Bob');
      expect((result[2]._source as Record<string, unknown>).name).toBe('Charlie');
    });

    it('sorts strings descending', () => {
      const result = instance.transformationMethod(data, { field: 'name', order: 'desc' });
      expect((result[0]._source as Record<string, unknown>).name).toBe('Charlie');
      expect((result[1]._source as Record<string, unknown>).name).toBe('Bob');
      expect((result[2]._source as Record<string, unknown>).name).toBe('Alice');
    });

    it('sorts numbers ascending', () => {
      const result = instance.transformationMethod(data, { field: 'count', order: 'asc' });
      expect((result[0]._source as Record<string, unknown>).count).toBe(3);
      expect((result[1]._source as Record<string, unknown>).count).toBe(5);
      expect((result[2]._source as Record<string, unknown>).count).toBe(10);
    });

    it('sorts numbers descending', () => {
      const result = instance.transformationMethod(data, { field: 'count', order: 'desc' });
      expect((result[0]._source as Record<string, unknown>).count).toBe(10);
      expect((result[1]._source as Record<string, unknown>).count).toBe(5);
      expect((result[2]._source as Record<string, unknown>).count).toBe(3);
    });

    it('pushes null values to end', () => {
      const dataWithNull = [...data, createHit({ name: null, count: null })];
      const result = instance.transformationMethod(dataWithNull, { field: 'name', order: 'asc' });
      expect((result[3]._source as Record<string, unknown>).name).toBeNull();
    });

    it('does not mutate original data', () => {
      const original = [...data];
      instance.transformationMethod(data, { field: 'name', order: 'asc' });
      expect(data).toEqual(original);
    });
  });

  describe('validateConfig', () => {
    it('returns config unchanged when field exists', () => {
      const config = { field: 'name', order: 'asc' as const };
      const fields = [{ name: 'name' }, { name: 'count' }];
      expect(instance.validateConfig!(config, fields)).toEqual(config);
    });

    it('resets field when it no longer exists', () => {
      const config = { field: 'removed_field', order: 'asc' as const };
      const fields = [{ name: 'name' }, { name: 'count' }];
      const result = instance.validateConfig!(config, fields);
      expect(result.field).toBeUndefined();
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
