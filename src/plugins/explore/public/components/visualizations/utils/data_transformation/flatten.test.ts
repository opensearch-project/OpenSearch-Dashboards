/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { flatten } from './flatten';

describe('flatten', () => {
  it('auto-detects and flattens array fields', () => {
    const data = [
      { key: 'alpha', foo: [1, 2], bar: ['A', 'B'] },
      { key: 'beta', foo: [3, 4, 5], bar: ['C', 'D'] },
    ];

    const result = flatten()(data);

    expect(result).toEqual([
      { key: 'alpha', foo: 1, bar: 'A' },
      { key: 'alpha', foo: 2, bar: 'B' },
      { key: 'beta', foo: 3, bar: 'C' },
      { key: 'beta', foo: 4, bar: 'D' },
      { key: 'beta', foo: 5, bar: null },
    ]);
  });

  it('flattens specified fields only', () => {
    const data = [
      { time: '<time1>', type1: [1, 2, 3], type2: null },
      { time: '<time2>', type1: null, type2: [2] },
    ];

    const result = flatten(['type1', 'type2'])(data);

    expect(result).toEqual([
      { time: '<time1>', type1: 1, type2: null },
      { time: '<time1>', type1: 2, type2: null },
      { time: '<time1>', type1: 3, type2: null },
      { time: '<time2>', type1: null, type2: 2 },
    ]);
  });

  it('handles mixed array and non-array values', () => {
    const data = [
      { key: 'alpha', foo: 1, bar: 'A' },
      { key: 'beta', foo: [3, 4, 5], bar: ['C', 'D'] },
    ];

    const result = flatten()(data);

    expect(result).toEqual([
      { key: 'alpha', foo: 1, bar: 'A' },
      { key: 'beta', foo: 3, bar: 'C' },
      { key: 'beta', foo: 4, bar: 'D' },
      { key: 'beta', foo: 5, bar: null },
    ]);
  });

  it('returns data as-is when no array fields exist', () => {
    const data = [
      { key: 'alpha', foo: 1, bar: 'A' },
      { key: 'beta', foo: 2, bar: 'B' },
    ];

    const result = flatten()(data);

    expect(result).toEqual(data);
  });

  it('handles empty data', () => {
    const result = flatten()([]);
    expect(result).toEqual([]);
  });

  it('handles empty arrays', () => {
    const data = [{ key: 'alpha', foo: [], bar: [] }];

    const result = flatten()(data);

    expect(result).toEqual([{ key: 'alpha', foo: null, bar: null }]);
  });

  it('handles arrays of different lengths', () => {
    const data = [{ key: 'alpha', foo: [1, 2, 3], bar: ['A'] }];

    const result = flatten()(data);

    expect(result).toEqual([
      { key: 'alpha', foo: 1, bar: 'A' },
      { key: 'alpha', foo: 2, bar: null },
      { key: 'alpha', foo: 3, bar: null },
    ]);
  });
});
