/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisFieldType } from '../types';
import { compareTableValues, sortTableRows, toGridSorting } from './table_vis_utils';

describe('compareTableValues', () => {
  test('compares numerical values numerically', () => {
    expect(compareTableValues(9, 10, VisFieldType.Numerical)).toBeLessThan(0);
    expect(compareTableValues('9', '10', VisFieldType.Numerical)).toBeLessThan(0);
  });

  test('compares date values by time', () => {
    expect(
      compareTableValues('2024-02-01T00:00:00Z', '2024-10-01T00:00:00Z', VisFieldType.Date)
    ).toBeLessThan(0);
    expect(compareTableValues(2000, 1000, VisFieldType.Date)).toBeGreaterThan(0);
  });

  test('compares categorical values as strings', () => {
    expect(compareTableValues('apple', 'banana', VisFieldType.Categorical)).toBeLessThan(0);
    expect(compareTableValues('b', 'b', VisFieldType.Categorical)).toBe(0);
  });

  test('falls back to string comparison for unparsable values', () => {
    expect(compareTableValues('abc', 'abd', VisFieldType.Numerical)).toBeLessThan(0);
    expect(compareTableValues('not a date', 'zzz', VisFieldType.Date)).toBeLessThan(0);
  });
});

describe('sortTableRows', () => {
  const columnTypes = { n: VisFieldType.Numerical, c: VisFieldType.Categorical };
  const rows = [
    { n: 2, c: 'b' },
    { n: null, c: 'a' },
    { n: 3, c: 'a' },
    { n: 1, c: '' },
  ];

  test('returns the input when there is no sorting', () => {
    expect(sortTableRows(rows, [], columnTypes)).toBe(rows);
  });

  test('does not mutate the input', () => {
    const copy = [...rows];
    sortTableRows(rows, [{ id: 'n', direction: 'desc' }], columnTypes);
    expect(rows).toEqual(copy);
  });

  test('sorts ascending and descending with empty values last', () => {
    expect(
      sortTableRows(rows, [{ id: 'n', direction: 'asc' }], columnTypes).map((r) => r.n)
    ).toEqual([1, 2, 3, null]);
    expect(
      sortTableRows(rows, [{ id: 'n', direction: 'desc' }], columnTypes).map((r) => r.n)
    ).toEqual([3, 2, 1, null]);
    expect(
      sortTableRows(rows, [{ id: 'c', direction: 'desc' }], columnTypes).map((r) => r.c)
    ).toEqual(['b', 'a', 'a', '']);
  });

  test('uses later columns to break ties', () => {
    const result = sortTableRows(
      rows,
      [
        { id: 'c', direction: 'asc' },
        { id: 'n', direction: 'desc' },
      ],
      columnTypes
    );
    expect(result.map((r) => [r.c, r.n])).toEqual([
      ['a', 3],
      ['a', null],
      ['b', 2],
      ['', 1],
    ]);
  });
});

describe('toGridSorting', () => {
  const columns = [
    { id: 1, name: 'Count', column: 'field-0', schema: VisFieldType.Numerical },
    { id: 2, name: 'Host', column: 'field-1', schema: VisFieldType.Categorical },
  ];

  test('maps column names to column ids, keeping order and direction', () => {
    expect(
      toGridSorting(
        [
          { field: 'Host', direction: 'asc' },
          { field: 'Count', direction: 'desc' },
        ],
        columns
      )
    ).toEqual([
      { id: 'field-1', direction: 'asc' },
      { id: 'field-0', direction: 'desc' },
    ]);
  });

  test('drops entries whose column no longer exists', () => {
    expect(toGridSorting([{ field: 'Missing', direction: 'asc' }], columns)).toEqual([]);
  });

  test('returns an empty array when there is no saved sort', () => {
    expect(toGridSorting(undefined, columns)).toEqual([]);
  });
});
