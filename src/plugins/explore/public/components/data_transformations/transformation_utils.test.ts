/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  addTransformation,
  removeTransformation,
  updateTransformationConfig,
  toggleTransformationHide,
  deriveSchemaFromRows,
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
  transformationMethod: (data) => data,
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
    it('appends instance to pipeline', () => {
      const existing = [createMockInstance('a')];
      const newInstance = createMockInstance('b');
      const result = addTransformation(existing, newInstance);
      expect(result).toHaveLength(2);
      expect(result[1].instance_id).toBe('b');
    });

    it('does not mutate original pipeline', () => {
      const existing = [createMockInstance('a')];
      addTransformation(existing, createMockInstance('b'));
      expect(existing).toHaveLength(1);
    });

    it('adds to empty pipeline', () => {
      const result = addTransformation([], createMockInstance('a'));
      expect(result).toHaveLength(1);
    });
  });

  describe('removeTransformation', () => {
    it('removes instance by id', () => {
      const pipeline = [createMockInstance('a'), createMockInstance('b'), createMockInstance('c')];
      const result = removeTransformation(pipeline, 'b');
      expect(result).toHaveLength(2);
      expect(result.map((i) => i.instance_id)).toEqual(['a', 'c']);
    });

    it('returns same array structure when id not found', () => {
      const pipeline = [createMockInstance('a')];
      const result = removeTransformation(pipeline, 'nonexistent');
      expect(result).toHaveLength(1);
    });

    it('does not mutate original pipeline', () => {
      const pipeline = [createMockInstance('a'), createMockInstance('b')];
      removeTransformation(pipeline, 'a');
      expect(pipeline).toHaveLength(2);
    });
  });

  describe('updateTransformationConfig', () => {
    it('merges new config into matching instance', () => {
      const pipeline = [
        createMockInstance('a', { limit: 10, order: 'asc' }),
        createMockInstance('b', { field: 'name' }),
      ];
      const result = updateTransformationConfig(pipeline, 'a', { limit: 20 });
      expect(result[0].config).toEqual({ limit: 20, order: 'asc' });
      expect(result[1].config).toEqual({ field: 'name' });
    });

    it('does not mutate original pipeline', () => {
      const pipeline = [createMockInstance('a', { limit: 10 })];
      updateTransformationConfig(pipeline, 'a', { limit: 20 });
      expect(pipeline[0].config).toEqual({ limit: 10 });
    });

    it('leaves pipeline unchanged when id not found', () => {
      const pipeline = [createMockInstance('a', { limit: 10 })];
      const result = updateTransformationConfig(pipeline, 'nonexistent', { limit: 20 });
      expect(result[0].config).toEqual({ limit: 10 });
    });
  });

  describe('toggleTransformationHide', () => {
    it('toggles hide from false to true', () => {
      const pipeline = [createMockInstance('a', {}, false)];
      const result = toggleTransformationHide(pipeline, 'a');
      expect(result[0].hide).toBe(true);
    });

    it('toggles hide from true to false', () => {
      const pipeline = [createMockInstance('a', {}, true)];
      const result = toggleTransformationHide(pipeline, 'a');
      expect(result[0].hide).toBe(false);
    });

    it('only toggles matching instance', () => {
      const pipeline = [createMockInstance('a', {}, false), createMockInstance('b', {}, false)];
      const result = toggleTransformationHide(pipeline, 'a');
      expect(result[0].hide).toBe(true);
      expect(result[1].hide).toBe(false);
    });

    it('does not mutate original pipeline', () => {
      const pipeline = [createMockInstance('a', {}, false)];
      toggleTransformationHide(pipeline, 'a');
      expect(pipeline[0].hide).toBe(false);
    });
  });

  describe('deriveSchemaFromRows', () => {
    it('returns original schema when rows are empty', () => {
      const schema = [{ name: 'field1', type: 'keyword' }];
      expect(deriveSchemaFromRows([], schema)).toEqual(schema);
    });

    it('preserves original schema fields that still exist in source', () => {
      const rows = [createHit({ name: 'Alice', age: 30 })];
      const schema = [
        { name: 'name', type: 'keyword' },
        { name: 'age', type: 'integer' },
      ];
      const result = deriveSchemaFromRows(rows, schema);
      expect(result).toEqual(schema);
    });

    it('removes schema fields that no longer exist in source', () => {
      const rows = [createHit({ name: 'Alice' })];
      const schema = [
        { name: 'name', type: 'keyword' },
        { name: 'removed', type: 'keyword' },
      ];
      const result = deriveSchemaFromRows(rows, schema);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('name');
    });

    it('infers integer type for new integer fields', () => {
      const rows = [createHit({ name: 'Alice', count: 5 })];
      const schema = [{ name: 'name', type: 'keyword' }];
      const result = deriveSchemaFromRows(rows, schema);
      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({ name: 'count', type: 'integer' });
    });

    it('infers double type for new float fields', () => {
      const rows = [createHit({ value: 3.14 })];
      const result = deriveSchemaFromRows(rows, []);
      expect(result[0]).toEqual({ name: 'value', type: 'double' });
    });

    it('infers date type for date strings', () => {
      const rows = [createHit({ timestamp: '2024-01-15T00:00:00Z' })];
      const result = deriveSchemaFromRows(rows, []);
      expect(result[0]).toEqual({ name: 'timestamp', type: 'date' });
    });

    it('infers boolean type', () => {
      const rows = [createHit({ flag: true })];
      const result = deriveSchemaFromRows(rows, []);
      expect(result[0]).toEqual({ name: 'flag', type: 'boolean' });
    });

    it('infers string type for plain strings', () => {
      const rows = [createHit({ label: 'hello' })];
      const result = deriveSchemaFromRows(rows, []);
      expect(result[0]).toEqual({ name: 'label', type: 'string' });
    });

    it('does not treat numeric strings as dates', () => {
      const rows = [createHit({ code: '12345' })];
      const result = deriveSchemaFromRows(rows, []);
      expect(result[0].type).toBe('string');
    });
  });
});
