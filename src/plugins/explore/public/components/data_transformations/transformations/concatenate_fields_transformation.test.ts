/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { concatenateFieldsMethod } from './concatenate_fields_transformation';

describe('concatenateFieldsMethod', () => {
  it('puts every series side by side by row (design doc example)', () => {
    const result = concatenateFieldsMethod([
      {
        refId: 'A',
        rows: [{ Cate1: 'Cloth', value1: 10 }],
        fieldSchema: [
          { name: 'Cate1', type: 'string' },
          { name: 'value1', type: 'integer' },
        ],
      },
      {
        refId: 'B',
        rows: [{ Cate2: 'Shoes', Value2: 2 }],
        fieldSchema: [
          { name: 'Cate2', type: 'string' },
          { name: 'Value2', type: 'integer' },
        ],
      },
    ]);
    expect(result.status).toBe('applied');
    expect(result.series).toHaveLength(1);
    expect(result.series[0].refId).toBe('A,B');
    expect(result.series[0].rows).toEqual([
      { Cate1: 'Cloth', value1: 10, Cate2: 'Shoes', Value2: 2 },
    ]);
    expect(result.series[0].fieldSchema.map(({ name }) => name)).toEqual([
      'Cate1',
      'value1',
      'Cate2',
      'Value2',
    ]);
  });

  it('ignore: leaves out a duplicate field name, and pads shorter series', () => {
    const result = concatenateFieldsMethod(
      [
        { refId: 'A', rows: [{ v: 1 }, { v: 2 }], fieldSchema: [{ name: 'v', type: 'integer' }] },
        {
          refId: 'B',
          rows: [{ v: 9, w: 3 }],
          fieldSchema: [
            { name: 'v', type: 'integer' },
            { name: 'w', type: 'integer' },
          ],
        },
      ],
      { mode: 'ignore' }
    );
    expect(result.series[0].rows).toEqual([{ v: 1, w: 3 }, { v: 2 }]);
    expect(result.series[0].fieldSchema).toEqual([
      { name: 'v', type: 'integer' },
      { name: 'w', type: 'integer' },
    ]);
    expect(result.issues).toEqual([]);
  });

  it('label (default): keeps a duplicate field as `name (refId)`', () => {
    const result = concatenateFieldsMethod([
      { refId: 'A', rows: [{ v: 1 }, { v: 2 }], fieldSchema: [{ name: 'v', type: 'integer' }] },
      {
        refId: 'B',
        rows: [{ v: 9, w: 3 }],
        fieldSchema: [
          { name: 'v', type: 'integer' },
          { name: 'w', type: 'integer' },
        ],
      },
    ]);
    expect(result.series[0].rows).toEqual([{ v: 1, 'v (B)': 9, w: 3 }, { v: 2 }]);

    expect(result.series[0].fieldSchema).toEqual([
      { name: 'v', type: 'integer' },
      { name: 'v (B)', type: 'integer' },
      { name: 'w', type: 'integer' },
    ]);
    expect(result.series[0].seriesDisplayNames).toBeUndefined();
    expect(result.issues).toEqual([]);
  });

  // it("label: builds each field's display name from its own query's display name", () => {
  it("label: keeps each query's own display names, adding none", () => {
    const result = concatenateFieldsMethod([
      {
        refId: 'A',
        rows: [{ count: 1 }],
        fieldSchema: [{ name: 'count', type: 'integer' }],
        seriesDisplayNames: { 'A: up': 'cpu' },
      },
      {
        refId: 'B',
        rows: [{ count: 2 }],
        fieldSchema: [{ name: 'count', type: 'integer' }],
        seriesDisplayNames: { 'B: up': 'mem' },
      },
    ]);

    expect(result.series[0].seriesDisplayNames).toEqual({ 'A: up': 'cpu', 'B: up': 'mem' });
  });

  it('leaves out a row key that is not in the schema', () => {
    const result = concatenateFieldsMethod([
      { refId: 'A', rows: [{ v: 1, extra: 'x' }], fieldSchema: [{ name: 'v', type: 'integer' }] },
      { refId: 'B', rows: [{ w: 2 }], fieldSchema: [{ name: 'w', type: 'integer' }] },
    ]);
    expect(result.series[0].rows).toEqual([{ v: 1, w: 2 }]);
  });

  it('skips one series', () => {
    const one = [{ refId: 'A', rows: [], fieldSchema: [] }];
    expect(concatenateFieldsMethod(one)).toEqual({ series: one, status: 'skipped', issues: [] });
  });
});
