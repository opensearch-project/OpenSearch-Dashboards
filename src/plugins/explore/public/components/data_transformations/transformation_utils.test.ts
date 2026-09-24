/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  addTransformation,
  removeTransformation,
  updateTransformationConfig,
  toggleTransformationHide,
  inferSchemaFromRows,
  getRowFieldValue,
  rowHasField,
} from './transformation_utils';
import { TransformationInstance } from './types';

const createMockInstance = (
  id: string,
  config: Record<string, unknown> = {},
  hide = false
): TransformationInstance => ({
  instance_id: id,
  definition_id: 'test',
  config,
  hide,
  transformationMethod: (data) => ({ rows: data, status: 'applied', issues: [] }),
  Editor: (() => null) as any,
});

const createHit = (source: Record<string, unknown>) => ({
  _index: 'test',
  _id: '1',
  _score: 1,
  _source: source,
});

describe('transformation_utils', () => {
  describe('addTransformation', () => {
    it('appends an instance without mutating the pipeline', () => {
      const existing = [createMockInstance('a')];
      const newInstance = createMockInstance('b');
      const result = addTransformation(existing, newInstance);

      expect(result.map((instance) => instance.instance_id)).toEqual(['a', 'b']);
      expect(existing.map((instance) => instance.instance_id)).toEqual(['a']);
    });
  });

  describe('removeTransformation', () => {
    it('removes an instance without mutating the pipeline', () => {
      const pipeline = [createMockInstance('a'), createMockInstance('b'), createMockInstance('c')];
      const result = removeTransformation(pipeline, 'b');

      expect(result.map((i) => i.instance_id)).toEqual(['a', 'c']);
      expect(pipeline.map((i) => i.instance_id)).toEqual(['a', 'b', 'c']);
      expect(removeTransformation(pipeline, 'nonexistent')).toEqual(pipeline);
    });
  });

  describe('updateTransformationConfig', () => {
    it('updates only the matching config without mutating the pipeline', () => {
      const pipeline = [
        createMockInstance('a', { limit: 10, order: 'asc' }),
        createMockInstance('b', { field: 'name' }),
      ];
      const result = updateTransformationConfig(pipeline, 'a', { limit: 20 });
      expect(result[0].config).toEqual({ limit: 20, order: 'asc' });
      expect(result[1].config).toEqual({ field: 'name' });
      expect(pipeline[0].config).toEqual({ limit: 10, order: 'asc' });
      expect(updateTransformationConfig(pipeline, 'nonexistent', { limit: 20 })).toEqual(pipeline);
    });
  });

  describe('toggleTransformationHide', () => {
    it.each([
      { initial: false, expected: true },
      { initial: true, expected: false },
    ])('toggles hide from $initial to $expected', ({ initial, expected }) => {
      const pipeline = [createMockInstance('a', {}, initial), createMockInstance('b', {}, false)];
      const result = toggleTransformationHide(pipeline, 'a');

      expect(result[0].hide).toBe(expected);
      expect(result[1].hide).toBe(false);
      expect(pipeline[0].hide).toBe(initial);
    });
  });

  describe('inferSchemaFromRows', () => {
    it('uses the union of fields present across rows', () => {
      const rows = [createHit({ name: 'Alice' }), createHit({ age: 30 })];
      expect(inferSchemaFromRows(rows)).toEqual([
        { name: 'name', type: 'string' },
        { name: 'age', type: 'integer' },
      ]);
    });

    it('infers field types from row values', () => {
      const rows = [
        createHit({
          count: 5,
          ratio: 1.5,
          timestamp: '2024-01-15T00:00:00Z',
          label: 'hello',
          enabled: true,
          nested: { value: 1 },
        }),
      ];

      expect(inferSchemaFromRows(rows)).toEqual([
        { name: 'count', type: 'integer' },
        { name: 'ratio', type: 'double' },
        { name: 'timestamp', type: 'date' },
        { name: 'label', type: 'string' },
        { name: 'enabled', type: 'boolean' },
        { name: 'nested', type: 'object' },
      ]);
    });

    it('uses a later non-null value to infer a field type', () => {
      const rows = [createHit({ value: null }), createHit({ value: 42 })];
      expect(inferSchemaFromRows(rows)).toEqual([{ name: 'value', type: 'integer' }]);
    });

    it('returns an empty schema when there are no rows', () => {
      expect(inferSchemaFromRows([])).toEqual([]);
    });
  });

  describe('row field access', () => {
    it('prefers a literal dotted field and falls back to a nested path', () => {
      const literalRow = createHit({
        'service.name': 'literal',
        service: { name: 'nested' },
      });
      const nestedRow = createHit({ service: { name: 'nested' } });

      expect(rowHasField(literalRow, 'service.name')).toBe(true);
      expect(getRowFieldValue(literalRow, 'service.name')).toBe('literal');
      expect(rowHasField(nestedRow, 'service.name')).toBe(true);
      expect(getRowFieldValue(nestedRow, 'service.name')).toBe('nested');
      expect(rowHasField(nestedRow, 'service.missing')).toBe(false);
      expect(getRowFieldValue(nestedRow, 'service.missing')).toBeUndefined();
    });
  });
});
