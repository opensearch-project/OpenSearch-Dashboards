/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createExtractFieldsTransformation } from './extract_fields_transformation';

const createRow = (source: Record<string, unknown>) => source;

describe('extract_fields_transformation', () => {
  const instance = createExtractFieldsTransformation();
  type TestRow = ReturnType<typeof createRow>;
  type TestConfig = Parameters<typeof instance.transformationMethod>[1];
  const transform = (data: TestRow[], config: TestConfig) =>
    instance.transformationMethod(data, config).rows;

  describe('transformationMethod', () => {
    it('extracts object fields and reports the transformation as applied', () => {
      const data = [createRow({ nested: { x: 10, y: 20 }, other: 'keep' })];
      const result = instance.transformationMethod(data, {
        field: 'nested',
        format: 'object',
        prefix: '',
      });
      expect(result).toEqual({
        rows: [createRow({ nested: { x: 10, y: 20 }, other: 'keep', x: 10, y: 20 })],
        status: 'applied',
        issues: [],
      });
    });

    it('applies prefix to extracted fields', () => {
      const data = [createRow({ nested: { x: 10 } })];
      const result = transform(data, {
        field: 'nested',
        format: 'object',
        prefix: 'ns_',
      });
      expect(result[0].ns_x).toBe(10);
      expect(result[0].x).toBeUndefined();
    });

    it('parses JSON string format', () => {
      const data = [createRow({ jsonField: '{"a":1,"b":"hello"}' })];
      const result = transform(data, {
        field: 'jsonField',
        format: 'json',
        prefix: '',
      });
      expect(result[0].a).toBe(1);
      expect(result[0].b).toBe('hello');
    });

    it.each([
      {
        name: 'invalid JSON',
        data: [createRow({ source: 'not json' })],
        format: 'json' as const,
      },
      {
        name: 'a null object',
        data: [createRow({ source: null })],
        format: 'object' as const,
      },
      {
        name: 'an array',
        data: [createRow({ source: [1, 2, 3] })],
        format: 'object' as const,
      },
    ])('leaves rows unchanged for $name', ({ data, format }) => {
      expect(
        transform(data, {
          field: 'source',
          format,
          prefix: '',
        })
      ).toEqual(data);
    });
  });

  describe('execution diagnostics', () => {
    it('skips when the required field no longer exists', () => {
      const config = { field: 'removed', format: 'object' as const, prefix: '' };
      const data = [createRow({ nested: { value: 1 } })];
      const result = instance.transformationMethod(data, config);

      expect(result).toMatchObject({
        rows: data,
        status: 'skipped',
        issues: [{ code: 'missing_fields', fields: ['removed'] }],
      });
    });

    it('extracts only rows containing the configured field', () => {
      const config = { field: 'nested', format: 'object' as const, prefix: '' };
      const data = [
        createRow({ nested: { value: 1 } }),
        createRow({ label: 'missing nested field' }),
      ];

      expect(instance.transformationMethod(data, config)).toMatchObject({
        rows: [
          createRow({ nested: { value: 1 }, value: 1 }),
          createRow({ label: 'missing nested field' }),
        ],
        status: 'partially_applied',
        issues: [{ code: 'missing_fields', fields: ['nested'] }],
      });
    });

    it('skips when the source field is not configured', () => {
      const config = { field: undefined, format: 'object' as const, prefix: '' };
      const data = [createRow({ nested: { value: 1 } })];

      expect(instance.transformationMethod(data, config)).toMatchObject({
        rows: data,
        status: 'skipped',
        issues: [{ code: 'invalid_config' }],
      });
    });
  });

  describe('createExtractFieldsTransformation', () => {
    it('creates instance with default config', () => {
      expect(instance.definition_id).toBe('extract_fields');
      expect(instance.config).toEqual({ field: undefined, format: 'object', prefix: '' });
      expect(instance.hide).toBe(false);
    });
  });
});
