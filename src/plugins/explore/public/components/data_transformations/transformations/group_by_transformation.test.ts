/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createGroupByTransformation } from './group_by_transformation';

const createHit = (source: Record<string, unknown>) => ({
  _index: 'test',
  _id: '1',
  _score: 1,
  _source: source,
});

describe('group_by_transformation', () => {
  const instance = createGroupByTransformation();

  describe('transformationMethod', () => {
    const data = [
      createHit({ category: 'A', value: 10, name: 'x' }),
      createHit({ category: 'B', value: 20, name: 'y' }),
      createHit({ category: 'A', value: 30, name: 'z' }),
      createHit({ category: 'B', value: 40, name: 'w' }),
    ];

    it('returns original data when groupByField is not set', () => {
      const result = instance.transformationMethod(data, {
        groupByField: undefined,
        aggregations: [],
      });
      expect(result).toEqual(data);
    });

    it('returns original data when aggregations are empty', () => {
      const result = instance.transformationMethod(data, {
        groupByField: 'category',
        aggregations: [],
      });
      expect(result).toEqual(data);
    });

    it('groups by field and applies count aggregation', () => {
      const result = instance.transformationMethod(data, {
        groupByField: 'category',
        aggregations: [{ field: 'value', method: 'count' }],
      });
      expect(result).toHaveLength(2);
      const sourceA = result[0]._source as Record<string, unknown>;
      const sourceB = result[1]._source as Record<string, unknown>;
      expect(sourceA.category).toBe('A');
      expect(sourceA.count_value).toBe(2);
      expect(sourceB.category).toBe('B');
      expect(sourceB.count_value).toBe(2);
    });

    it('groups by field and applies total aggregation', () => {
      const result = instance.transformationMethod(data, {
        groupByField: 'category',
        aggregations: [{ field: 'value', method: 'total' }],
      });
      expect(result).toHaveLength(2);
      const sourceA = result[0]._source as Record<string, unknown>;
      const sourceB = result[1]._source as Record<string, unknown>;
      expect(sourceA.total_value).toBe(40);
      expect(sourceB.total_value).toBe(60);
    });

    it('skips hidden aggregations', () => {
      const result = instance.transformationMethod(data, {
        groupByField: 'category',
        aggregations: [
          { field: 'value', method: 'total', hidden: true },
          { field: 'name', method: 'count' },
        ],
      });
      const sourceA = result[0]._source as Record<string, unknown>;
      expect(sourceA.total_value).toBeUndefined();
      expect(sourceA.count_name).toBe(2);
    });

    it('handles multiple aggregations', () => {
      const result = instance.transformationMethod(data, {
        groupByField: 'category',
        aggregations: [
          { field: 'value', method: 'total' },
          { field: 'value', method: 'count' },
        ],
      });
      const sourceA = result[0]._source as Record<string, unknown>;
      expect(sourceA.total_value).toBe(40);
      expect(sourceA.count_value).toBe(2);
    });
  });

  describe('validateConfig', () => {
    it('returns config unchanged when groupByField exists', () => {
      const config = {
        groupByField: 'category',
        aggregations: [{ field: 'value', method: 'total' as const }],
      };
      const fields = [{ name: 'category' }, { name: 'value' }];
      const result = instance.validateConfig!(config, fields);
      expect(result.groupByField).toBe('category');
    });

    it('resets when groupByField no longer exists', () => {
      const config = {
        groupByField: 'removed',
        aggregations: [{ field: 'value', method: 'total' as const }],
      };
      const fields = [{ name: 'category' }, { name: 'value' }];
      const result = instance.validateConfig!(config, fields);
      expect(result.groupByField).toBeUndefined();
      expect(result.aggregations).toEqual([]);
    });

    it('adds new fields to aggregations when groupByField is set', () => {
      const config = {
        groupByField: 'category',
        aggregations: [{ field: 'value', method: 'total' as const }],
      };
      const fields = [
        { name: 'category', type: 'keyword' },
        { name: 'value', type: 'integer' },
        { name: 'new_field', type: 'keyword' },
      ];
      const result = instance.validateConfig!(config, fields);
      expect(result.aggregations.length).toBeGreaterThan(1);
      expect(result.aggregations.find((a: any) => a.field === 'new_field')).toBeDefined();
    });

    it('removes aggregations for fields that no longer exist', () => {
      const config = {
        groupByField: 'category',
        aggregations: [
          { field: 'value', method: 'total' as const },
          { field: 'removed', method: 'count' as const },
        ],
      };
      const fields = [{ name: 'category' }, { name: 'value' }];
      const result = instance.validateConfig!(config, fields);
      const aggFields = result.aggregations.map((a: any) => a.field);
      expect(aggFields).not.toContain('removed');
    });
  });

  describe('createGroupByTransformation', () => {
    it('creates instance with default config', () => {
      expect(instance.definition_id).toBe('group_by');
      expect(instance.config).toEqual({ groupByField: undefined, aggregations: [] });
      expect(instance.hide).toBe(false);
    });
  });
});
