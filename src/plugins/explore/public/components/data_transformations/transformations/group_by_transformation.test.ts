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
  type TestHit = ReturnType<typeof createHit>;
  type TestConfig = Parameters<typeof instance.transformationMethod>[1];
  const transform = (data: TestHit[], config: TestConfig) =>
    instance.transformationMethod(data, config).rows;

  describe('transformationMethod', () => {
    const data = [
      createHit({ category: 'A', value: 10, name: 'x' }),
      createHit({ category: 'B', value: 20, name: 'y' }),
      createHit({ category: 'A', value: 30, name: 'z' }),
      createHit({ category: 'B', value: 40, name: 'w' }),
    ];

    it('groups by field and applies a count aggregation', () => {
      const result = instance.transformationMethod(data, {
        groupByField: 'category',
        aggregations: [{ field: 'value', method: 'count' }],
      });
      expect(result).toEqual({
        rows: [
          createHit({ category: 'A', count_value: 2 }),
          createHit({ category: 'B', count_value: 2 }),
        ],
        status: 'applied',
        issues: [],
      });
    });

    it('groups by field and applies total aggregation', () => {
      const result = transform(data, {
        groupByField: 'category',
        aggregations: [{ field: 'value', method: 'total' }],
      });
      expect(result).toHaveLength(2);
      const sourceA = result[0]._source as Record<string, unknown>;
      const sourceB = result[1]._source as Record<string, unknown>;
      expect(sourceA.total_value).toBe(40);
      expect(sourceB.total_value).toBe(60);
    });

    it('skips hidden aggregations without reporting missing hidden fields', () => {
      const result = instance.transformationMethod(data, {
        groupByField: 'category',
        aggregations: [
          { field: 'removed', method: 'total', hidden: true },
          { field: 'name', method: 'count' },
        ],
      });
      expect(result).toEqual({
        rows: [
          createHit({ category: 'A', count_name: 2 }),
          createHit({ category: 'B', count_name: 2 }),
        ],
        status: 'applied',
        issues: [],
      });
    });

    it('handles multiple aggregations', () => {
      const result = transform(data, {
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

  describe('execution diagnostics', () => {
    const data = [createHit({ category: 'A', value: 10 }), createHit({ category: 'A', value: 20 })];

    it('skips when groupByField no longer exists', () => {
      const config = {
        groupByField: 'removed',
        aggregations: [{ field: 'value', method: 'total' as const }],
      };
      const result = instance.transformationMethod(data, config);

      expect(result).toMatchObject({
        rows: data,
        status: 'skipped',
        issues: [{ code: 'missing_fields', fields: ['removed'] }],
      });
    });

    it.each([
      { method: 'count' as const, expectedValue: 0 },
      { method: 'total' as const, expectedValue: null },
    ])(
      'uses $expectedValue when every value is missing for a $method aggregation',
      ({ method, expectedValue }) => {
        const config = {
          groupByField: 'category',
          aggregations: [
            { field: 'value', method: 'total' as const },
            { field: 'removed', method },
          ],
        };
        const result = instance.transformationMethod(data, config);

        expect(result).toEqual({
          rows: [
            createHit({
              category: 'A',
              total_value: 30,
              [`${method}_removed`]: expectedValue,
            }),
          ],
          status: 'applied',
          issues: [],
        });
      }
    );

    it('ignores missing aggregation values within a group', () => {
      const config = {
        groupByField: 'category',
        aggregations: [{ field: 'value', method: 'total' as const }],
      };
      const mixedData = [createHit({ category: 'A', value: 10 }), createHit({ category: 'A' })];

      expect(instance.transformationMethod(mixedData, config)).toEqual({
        rows: [createHit({ category: 'A', total_value: 10 })],
        status: 'applied',
        issues: [],
      });
    });

    it('excludes rows missing the grouping field and reports a partial result', () => {
      const config = {
        groupByField: 'category',
        aggregations: [{ field: 'value', method: 'total' as const }],
      };
      const mixedData = [createHit({ category: 'A', value: 10 }), createHit({ value: 20 })];

      expect(instance.transformationMethod(mixedData, config)).toMatchObject({
        rows: [createHit({ category: 'A', total_value: 10 })],
        status: 'partially_applied',
        issues: [{ code: 'missing_fields', fields: ['category'] }],
      });
    });

    it.each([
      {
        name: 'the group field is missing',
        config: { groupByField: undefined, aggregations: [] },
      },
      {
        name: 'aggregations are missing',
        config: { groupByField: 'category', aggregations: [] },
      },
    ])('skips when $name', ({ config }) => {
      expect(instance.transformationMethod(data, config)).toMatchObject({
        rows: data,
        status: 'skipped',
        issues: [{ code: 'invalid_config' }],
      });
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
