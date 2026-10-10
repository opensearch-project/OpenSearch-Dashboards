/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createConvertFieldTypeTransformation } from './convert_field_type_transformation';

const createHit = (source: Record<string, unknown>) => ({
  _index: 'test',
  _id: '1',
  _score: 1,
  _source: source,
});

describe('convert_field_type_transformation', () => {
  const instance = createConvertFieldTypeTransformation();
  type TestHit = ReturnType<typeof createHit>;
  type TestConfig = Parameters<typeof instance.transformationMethod>[1];
  const transform = (data: TestHit[], config: TestConfig) =>
    instance.transformationMethod(data, config).rows;

  describe('transformationMethod', () => {
    const data = [createHit({ count: '42', flag: 'true', timestamp: '2024-01-15', obj: { a: 1 } })];

    it('converts string to boolean', () => {
      const result = transform(data, {
        rules: [{ field: 'flag', targetType: 'boolean' }],
      });
      expect((result[0]._source as Record<string, unknown>).flag).toBe(true);
    });

    it('converts to date ISO string', () => {
      const result = transform(data, {
        rules: [{ field: 'timestamp', targetType: 'date' }],
      });
      const val = (result[0]._source as Record<string, unknown>).timestamp as string;
      expect(val).toContain('2024-01-15');
      expect(new Date(val).toISOString()).toBe(val);
    });

    it('converts object to string via JSON.stringify', () => {
      const result = transform(data, {
        rules: [{ field: 'obj', targetType: 'string' }],
      });
      expect((result[0]._source as Record<string, unknown>).obj).toBe('{"a":1}');
    });

    it('returns null for non-numeric string converted to number', () => {
      const testData = [createHit({ value: 'abc' })];
      const result = transform(testData, {
        rules: [{ field: 'value', targetType: 'number' }],
      });
      expect((result[0]._source as Record<string, unknown>).value).toBeNull();
    });

    it('handles boolean conversion edge cases', () => {
      const testData = [createHit({ a: '0', b: '1', c: '', d: 'false' })];
      const result = transform(testData, {
        rules: [
          { field: 'a', targetType: 'boolean' },
          { field: 'b', targetType: 'boolean' },
          { field: 'c', targetType: 'boolean' },
          { field: 'd', targetType: 'boolean' },
        ],
      });
      const source = result[0]._source as Record<string, unknown>;
      expect(source.a).toBe(false);
      expect(source.b).toBe(true);
      expect(source.c).toBe(false);
      expect(source.d).toBe(false);
    });

    it('applies multiple conversion rules', () => {
      const result = transform(data, {
        rules: [
          { field: 'count', targetType: 'number' },
          { field: 'flag', targetType: 'boolean' },
        ],
      });
      const source = result[0]._source as Record<string, unknown>;
      expect(source.count).toBe(42);
      expect(source.flag).toBe(true);
    });
  });

  describe('execution diagnostics', () => {
    it('reports applied when all fields exist', () => {
      const config = { rules: [{ field: 'count', targetType: 'number' as const }] };
      const data = [createHit({ count: '42', name: 'Alice' })];

      expect(instance.transformationMethod(data, config)).toEqual({
        rows: [createHit({ count: 42, name: 'Alice' })],
        status: 'applied',
        issues: [],
        typeOverrides: { count: 'number' },
      });
    });

    it('applies available conversion rules and reports unavailable rules', () => {
      const config = {
        rules: [
          { field: 'count', targetType: 'string' as const },
          { field: 'removed', targetType: 'number' as const },
        ],
      };
      const data = [createHit({ count: 42 })];
      const result = instance.transformationMethod(data, config);

      expect(result).toMatchObject({
        rows: [createHit({ count: '42' })],
        status: 'partially_applied',
        issues: [{ code: 'missing_fields', fields: ['removed'] }],
        typeOverrides: { count: 'string' },
      });
    });

    it('converts only rows containing the configured field', () => {
      const config = { rules: [{ field: 'count', targetType: 'number' as const }] };
      const data = [createHit({ count: '42' }), createHit({ name: 'missing count' })];

      expect(instance.transformationMethod(data, config)).toMatchObject({
        rows: [createHit({ count: 42 }), createHit({ name: 'missing count' })],
        status: 'partially_applied',
        issues: [{ code: 'missing_fields', fields: ['count'] }],
        typeOverrides: { count: 'number' },
      });
    });

    it('skips when all configured fields are missing', () => {
      const config = { rules: [{ field: 'removed', targetType: 'number' as const }] };
      const data = [createHit({ count: '42' })];

      expect(instance.transformationMethod(data, config)).toMatchObject({
        rows: data,
        status: 'skipped',
        issues: [{ code: 'missing_fields', fields: ['removed'] }],
      });
    });

    it('reports string type intent for ISO date values converted to strings', () => {
      const config = { rules: [{ field: 'timestamp', targetType: 'string' as const }] };
      const data = [createHit({ timestamp: '2024-01-15T00:00:00Z' })];

      expect(instance.transformationMethod(data, config)).toMatchObject({
        rows: data,
        status: 'applied',
        typeOverrides: { timestamp: 'string' },
      });
    });

    it('skips when there are no complete conversion rules', () => {
      const config = { rules: [] };
      const data = [createHit({ count: '42' })];

      expect(instance.transformationMethod(data, config)).toMatchObject({
        rows: data,
        status: 'skipped',
        issues: [{ code: 'invalid_config' }],
      });
    });
  });

  describe('createConvertFieldTypeTransformation', () => {
    it('creates instance with default config', () => {
      expect(instance.definition_id).toBe('convert_field_type');
      expect(instance.config).toEqual({ rules: [] });
      expect(instance.hide).toBe(false);
    });
  });
});
