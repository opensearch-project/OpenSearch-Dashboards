/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { reduceMethod, reduceValues } from './reduce_transformation';

const a = {
  refId: 'A',
  rows: [
    { Time: '2019-11-01', Cate1: 20 },
    { Time: '2020-01-01', Cate1: 30 },
  ],
  fieldSchema: [
    { name: 'Time', type: 'date' },
    { name: 'Cate1', type: 'integer' },
  ],
};
const b = {
  refId: 'B',
  rows: [
    { Time: '2019-11-01', Cate2: 30 },
    { Time: '2020-01-01', Cate2: 40 },
  ],
  fieldSchema: [
    { name: 'Time', type: 'date' },
    { name: 'Cate2', type: 'integer' },
  ],
};

describe('reduceMethod', () => {
  it('series to rows: a row per field across series (design doc example)', () => {
    const result = reduceMethod([a, b], {
      mode: 'series_to_rows',
      fields: ['Cate1', 'Cate2'],
      methods: ['first', 'last'],
    });
    expect(result.status).toBe('applied');
    expect(result.series).toHaveLength(1);
    expect(result.series[0].rows).toEqual([
      { Field: 'Cate1', First: 20, Last: 30 },
      { Field: 'Cate2', First: 30, Last: 40 },
    ]);
  });

  it('reduce fields: each series becomes one row (design doc example)', () => {
    const single = {
      refId: 'A',
      rows: [
        { Time: '2019-11-01', Cate1: 20, Cate2: 100 },
        { Time: '2020-01-01', Cate1: 30, Cate2: 200 },
      ],
      fieldSchema: [
        { name: 'Time', type: 'date' },
        { name: 'Cate1', type: 'integer' },
        { name: 'Cate2', type: 'integer' },
      ],
    };
    const result = reduceMethod([single], {
      mode: 'reduce_fields',
      fields: [],
      methods: ['first', 'last'],
    });
    expect(result.series[0].rows).toEqual([
      { 'Cate1-First': 20, 'Cate1-Last': 30, 'Cate2-First': 100, 'Cate2-Last': 200 },
    ]);
  });

  it('reports missing fields and needs a calculation', () => {
    const partial = reduceMethod([a], {
      mode: 'series_to_rows',
      fields: ['Cate1', 'Nope'],
      methods: ['max'],
    });
    expect(partial.status).toBe('partially_applied');
    expect(partial.issues[0].fields).toEqual(['Nope']);
    expect(
      reduceMethod([a], { mode: 'series_to_rows', fields: [], methods: [] }).issues[0].code
    ).toBe('invalid_config');
  });

  it('calculates', () => {
    const values = [3, null, 1, 2];
    expect(reduceValues(values, 'first')).toBe(3);
    expect(reduceValues(values, 'last')).toBe(2);
    expect(reduceValues(values, 'min')).toBe(1);
    expect(reduceValues(values, 'max')).toBe(3);
    expect(reduceValues(values, 'sum')).toBe(6);
    expect(reduceValues(values, 'mean')).toBe(2);
    expect(reduceValues(values, 'count')).toBe(3);
  });
});
