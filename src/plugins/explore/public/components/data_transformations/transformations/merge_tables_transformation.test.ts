/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { mergeTablesMethod } from './merge_tables_transformation';

describe('mergeTablesMethod', () => {
  it('merges rows whose shared fields match (design doc example)', () => {
    const result = mergeTablesMethod([
      {
        refId: 'A',
        rows: [
          { Time: '2019-11-02', Size: 'S', Value: 10 },
          { Time: '2019-11-01', Size: 'M', Value: 20 },
        ],
        fieldSchema: [
          { name: 'Time', type: 'date' },
          { name: 'Size', type: 'string' },
          { name: 'Value', type: 'integer' },
        ],
      },
      {
        refId: 'B',
        rows: [{ Time: '2019-11-01', Cate: 'Shoes' }],
        fieldSchema: [
          { name: 'Time', type: 'date' },
          { name: 'Cate', type: 'string' },
        ],
      },
    ]);
    expect(result.status).toBe('applied');
    expect(result.series[0].rows).toEqual([
      { Time: '2019-11-02', Size: 'S', Value: 10 },
      { Time: '2019-11-01', Size: 'M', Value: 20, Cate: 'Shoes' },
    ]);
    expect(result.series[0].fieldSchema.map(({ name }) => name)).toEqual([
      'Time',
      'Size',
      'Value',
      'Cate',
    ]);
  });

  it('appends rows that match nothing, and stacks series sharing no field', () => {
    const result = mergeTablesMethod([
      { refId: 'A', rows: [{ a: 1 }], fieldSchema: [{ name: 'a', type: 'integer' }] },
      { refId: 'B', rows: [{ b: 2 }], fieldSchema: [{ name: 'b', type: 'integer' }] },
    ]);
    expect(result.series[0].rows).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it('merges an identical row once, and keeps a series its own repeated rows', () => {
    const schema = [
      { name: 'host', type: 'string' },
      { name: 'count', type: 'integer' },
    ];
    const result = mergeTablesMethod([
      { refId: 'A', rows: [{ host: 'a', count: 5 }], fieldSchema: schema },
      {
        refId: 'B',
        rows: [
          { host: 'a', count: 5 },
          { host: 'b', count: 1 },
          { host: 'b', count: 1 },
        ],
        fieldSchema: schema,
      },
    ]);
    expect(result.series[0].rows).toEqual([
      { host: 'a', count: 5 },
      { host: 'b', count: 1 },
      { host: 'b', count: 1 },
    ]);
  });

  it('does not overwrite a row that already has the incoming value', () => {
    const result = mergeTablesMethod([
      { refId: 'A', rows: [{ k: 1 }], fieldSchema: [{ name: 'k', type: 'integer' }] },
      {
        refId: 'B',
        rows: [
          { k: 1, x: 'first' },
          { k: 1, x: 'second' },
        ],
        fieldSchema: [
          { name: 'k', type: 'integer' },
          { name: 'x', type: 'string' },
        ],
      },
    ]);
    expect(result.series[0].rows).toEqual([
      { k: 1, x: 'first' },
      { k: 1, x: 'second' },
    ]);
  });
});
