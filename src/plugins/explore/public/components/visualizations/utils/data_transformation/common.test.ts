/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { map, pick } from './common';

describe('map', () => {
  it('returns empty array for empty input', () => {
    const mapper = map((row) => row);
    expect(mapper([])).toEqual([]);
  });

  it('applies transformation function to each row', () => {
    const data = [
      { name: 'foo', age: 10 },
      { name: 'bar', age: 15 },
    ];
    const mapper = map((row) => ({ ...row, age: row.age * 2 }));
    const result = mapper(data);
    expect(result).toEqual([
      { name: 'foo', age: 20 },
      { name: 'bar', age: 30 },
    ]);
  });

  it('works with pick for column selection', () => {
    const data = [
      { name: 'foo', age: 10, height: 100 },
      { name: 'bar', age: 15, height: 130 },
    ];
    const columnMapper = map(pick(['name', 'age']));
    const result = columnMapper(data);
    expect(result).toEqual([
      { name: 'foo', age: 10 },
      { name: 'bar', age: 15 },
    ]);
  });
});

describe('pick', () => {
  it('returns empty object for empty columns array', () => {
    const picker = pick([]);
    const result = picker({ name: 'foo', age: 10 });
    expect(result).toEqual({});
  });

  it('selects specified columns from object', () => {
    const picker = pick(['name', 'age']);
    const result = picker({ name: 'foo', age: 10, height: 100 });
    expect(result).toEqual({ name: 'foo', age: 10 });
  });

  it('ignores non-existent columns', () => {
    const picker = pick(['name', 'nonexistent']);
    const result = picker({ name: 'foo', age: 10 });
    expect(result).toEqual({ name: 'foo' });
  });
});
