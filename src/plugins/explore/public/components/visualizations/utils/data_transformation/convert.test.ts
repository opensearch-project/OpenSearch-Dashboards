/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { convertTo2DArray } from './convert';

describe('convertTo2DArray', () => {
  it('returns empty array for empty input', () => {
    expect(convertTo2DArray()([])).toEqual([]);
  });

  it('converts array of objects to 2D array without headers', () => {
    const data = [
      { name: 'foo', age: 10, height: 100 },
      { name: 'bar', age: 15, height: 130 },
    ];
    const result = convertTo2DArray()(data);
    expect(result).toEqual([
      ['name', 'age', 'height'],
      ['foo', 10, 100],
      ['bar', 15, 130],
    ]);
  });

  it('converts array of objects to 2D array with specified headers', () => {
    const data = [
      { name: 'foo', age: 10, height: 100 },
      { name: 'bar', age: 15, height: 130 },
    ];
    const result = convertTo2DArray(['name', 'age'])(data);
    expect(result).toEqual([
      ['name', 'age'],
      ['foo', 10],
      ['bar', 15],
    ]);
  });

  it('handles single object', () => {
    const data = [{ name: 'foo', age: 10 }];
    const result = convertTo2DArray()(data);
    expect(result).toEqual([
      ['name', 'age'],
      ['foo', 10],
    ]);
  });

  it('handles objects with undefined values', () => {
    const data = [
      { name: 'foo', age: undefined },
      { name: 'bar', age: 15 },
    ];
    const result = convertTo2DArray()(data);
    expect(result).toEqual([
      ['name', 'age'],
      ['foo', undefined],
      ['bar', 15],
    ]);
  });
});
