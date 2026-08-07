/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createExtractFieldsTransformation } from './extract_fields_transformation';

const createHit = (source: Record<string, unknown>) => ({
  _index: 'test',
  _id: '1',
  _score: 1,
  _source: source,
});

describe('extract_fields_transformation', () => {
  const instance = createExtractFieldsTransformation();

  describe('transformationMethod', () => {
    it('returns original data when field is not set', () => {
      const data = [createHit({ nested: { a: 1 } })];
      const result = instance.transformationMethod(data, {
        field: undefined,
        format: 'object',
        prefix: '',
      });
      expect(result).toEqual(data);
    });

    it('extracts object fields into top-level source', () => {
      const data = [createHit({ nested: { x: 10, y: 20 }, other: 'keep' })];
      const result = instance.transformationMethod(data, {
        field: 'nested',
        format: 'object',
        prefix: '',
      });
      const source = result[0]._source as Record<string, unknown>;
      expect(source.x).toBe(10);
      expect(source.y).toBe(20);
      expect(source.other).toBe('keep');
    });

    it('applies prefix to extracted fields', () => {
      const data = [createHit({ nested: { x: 10 } })];
      const result = instance.transformationMethod(data, {
        field: 'nested',
        format: 'object',
        prefix: 'ns_',
      });
      const source = result[0]._source as Record<string, unknown>;
      expect(source.ns_x).toBe(10);
      expect(source.x).toBeUndefined();
    });

    it('parses JSON string format', () => {
      const data = [createHit({ jsonField: '{"a":1,"b":"hello"}' })];
      const result = instance.transformationMethod(data, {
        field: 'jsonField',
        format: 'json',
        prefix: '',
      });
      const source = result[0]._source as Record<string, unknown>;
      expect(source.a).toBe(1);
      expect(source.b).toBe('hello');
    });

    it('handles invalid JSON gracefully', () => {
      const data = [createHit({ jsonField: 'not json' })];
      const result = instance.transformationMethod(data, {
        field: 'jsonField',
        format: 'json',
        prefix: '',
      });
      const source = result[0]._source as Record<string, unknown>;
      expect(source.jsonField).toBe('not json');
    });

    it('skips rows where field value is null', () => {
      const data = [createHit({ nested: null, other: 'keep' })];
      const result = instance.transformationMethod(data, {
        field: 'nested',
        format: 'object',
        prefix: '',
      });
      expect(result[0]._source).toEqual({ nested: null, other: 'keep' });
    });

    it('does not extract arrays', () => {
      const data = [createHit({ nested: [1, 2, 3] })];
      const result = instance.transformationMethod(data, {
        field: 'nested',
        format: 'object',
        prefix: '',
      });
      expect(result[0]._source).toEqual({ nested: [1, 2, 3] });
    });
  });

  describe('validateConfig', () => {
    it('returns config unchanged when field exists', () => {
      const config = { field: 'nested', format: 'object' as const, prefix: '' };
      const fields = [{ name: 'nested' }, { name: 'other' }];
      expect(instance.validateConfig!(config, fields)).toEqual(config);
    });

    it('resets field when it no longer exists', () => {
      const config = { field: 'removed', format: 'object' as const, prefix: '' };
      const fields = [{ name: 'nested' }];
      const result = instance.validateConfig!(config, fields);
      expect(result.field).toBeUndefined();
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
