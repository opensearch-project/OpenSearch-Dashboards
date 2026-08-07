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

  describe('transformationMethod', () => {
    const data = [createHit({ count: '42', flag: 'true', timestamp: '2024-01-15', obj: { a: 1 } })];

    it('returns original data when config is incomplete', () => {
      const result = instance.transformationMethod(data, { rules: [] });
      expect(result).toEqual(data);
    });

    it('converts string to number', () => {
      const result = instance.transformationMethod(data, {
        rules: [{ field: 'count', targetType: 'number' }],
      });
      expect((result[0]._source as Record<string, unknown>).count).toBe(42);
    });

    it('converts string to boolean', () => {
      const result = instance.transformationMethod(data, {
        rules: [{ field: 'flag', targetType: 'boolean' }],
      });
      expect((result[0]._source as Record<string, unknown>).flag).toBe(true);
    });

    it('converts to date ISO string', () => {
      const result = instance.transformationMethod(data, {
        rules: [{ field: 'timestamp', targetType: 'date' }],
      });
      const val = (result[0]._source as Record<string, unknown>).timestamp as string;
      expect(val).toContain('2024-01-15');
      expect(new Date(val).toISOString()).toBe(val);
    });

    it('converts object to string via JSON.stringify', () => {
      const result = instance.transformationMethod(data, {
        rules: [{ field: 'obj', targetType: 'string' }],
      });
      expect((result[0]._source as Record<string, unknown>).obj).toBe('{"a":1}');
    });

    it('returns null for non-numeric string converted to number', () => {
      const testData = [createHit({ value: 'abc' })];
      const result = instance.transformationMethod(testData, {
        rules: [{ field: 'value', targetType: 'number' }],
      });
      expect((result[0]._source as Record<string, unknown>).value).toBeNull();
    });

    it('handles boolean conversion edge cases', () => {
      const testData = [createHit({ a: '0', b: '1', c: '', d: 'false' })];
      const result = instance.transformationMethod(testData, {
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
      const result = instance.transformationMethod(data, {
        rules: [
          { field: 'count', targetType: 'number' },
          { field: 'flag', targetType: 'boolean' },
        ],
      });
      const source = result[0]._source as Record<string, unknown>;
      expect(source.count).toBe(42);
      expect(source.flag).toBe(true);
    });

    it('skips rules with undefined field', () => {
      const result = instance.transformationMethod(data, {
        rules: [{ field: undefined, targetType: 'number' }],
      });
      expect(result).toEqual(data);
    });
  });

  describe('transformSchema', () => {
    it('updates schema types for converted fields', () => {
      const schema = [
        { name: 'count', type: 'keyword' },
        { name: 'name', type: 'keyword' },
      ];
      const result = instance.transformSchema!(schema, {
        rules: [{ field: 'count', targetType: 'number' }],
      });
      expect(result[0].type).toBe('number');
      expect(result[1].type).toBe('keyword');
    });

    it('returns schema unchanged when config is incomplete', () => {
      const schema = [{ name: 'count', type: 'keyword' }];
      const result = instance.transformSchema!(schema, { rules: [] });
      expect(result).toEqual(schema);
    });
  });

  describe('validateConfig', () => {
    it('returns config unchanged when all fields exist', () => {
      const config = { rules: [{ field: 'count', targetType: 'number' as const }] };
      const fields = [{ name: 'count' }, { name: 'name' }];
      expect(instance.validateConfig!(config, fields)).toEqual(config);
    });

    it('resets field for rules referencing removed fields', () => {
      const config = { rules: [{ field: 'removed', targetType: 'number' as const }] };
      const fields = [{ name: 'count' }];
      const result = instance.validateConfig!(config, fields);
      expect(result.rules[0].field).toBeUndefined();
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
