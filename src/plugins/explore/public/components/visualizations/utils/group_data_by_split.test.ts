/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { groupDataBySplitField } from './group_data_by_split';

describe('groupDataBySplitField', () => {
  it('groups data by the specified column', () => {
    const data = [
      { region: 'US', value: 1 },
      { region: 'EU', value: 2 },
      { region: 'US', value: 3 },
      { region: 'EU', value: 4 },
    ];

    const groups = groupDataBySplitField(data, 'region');

    expect(groups).toHaveLength(2);
    expect(groups[0].key).toBe('EU');
    expect(groups[0].data).toEqual([
      { region: 'EU', value: 2 },
      { region: 'EU', value: 4 },
    ]);
    expect(groups[1].key).toBe('US');
    expect(groups[1].data).toEqual([
      { region: 'US', value: 1 },
      { region: 'US', value: 3 },
    ]);
  });

  it('sorts groups alphabetically by key', () => {
    const data = [
      { cat: 'Zebra', v: 1 },
      { cat: 'Apple', v: 2 },
      { cat: 'Mango', v: 3 },
    ];

    const groups = groupDataBySplitField(data, 'cat');

    expect(groups.map((g) => g.key)).toEqual(['Apple', 'Mango', 'Zebra']);
  });

  it('places null, undefined, and empty string values in the "(empty)" group', () => {
    const data = [
      { cat: null, v: 1 },
      { cat: undefined, v: 2 },
      { cat: '', v: 3 },
      { cat: 'A', v: 4 },
    ];

    const groups = groupDataBySplitField(data, 'cat');

    expect(groups).toHaveLength(2);
    const emptyGroup = groups.find((g) => g.key === '(empty)');
    expect(emptyGroup).toBeDefined();
    expect(emptyGroup!.data).toHaveLength(3);
  });

  it('returns a single group when all values are the same', () => {
    const data = [
      { cat: 'X', v: 1 },
      { cat: 'X', v: 2 },
      { cat: 'X', v: 3 },
    ];

    const groups = groupDataBySplitField(data, 'cat');

    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe('X');
    expect(groups[0].data).toHaveLength(3);
  });

  it('returns empty array for empty data', () => {
    const groups = groupDataBySplitField([], 'cat');
    expect(groups).toEqual([]);
  });

  it('converts numeric values to string keys', () => {
    const data = [
      { code: 200, v: 1 },
      { code: 404, v: 2 },
      { code: 200, v: 3 },
    ];

    const groups = groupDataBySplitField(data, 'code');

    expect(groups.map((g) => g.key)).toEqual(['200', '404']);
    expect(groups[0].data).toHaveLength(2);
  });

  it('preserves all columns in each row', () => {
    const data = [
      { cat: 'A', x: 1, y: 2, z: 3 },
      { cat: 'B', x: 4, y: 5, z: 6 },
    ];

    const groups = groupDataBySplitField(data, 'cat');

    expect(groups[0].data[0]).toEqual({ cat: 'A', x: 1, y: 2, z: 3 });
    expect(groups[1].data[0]).toEqual({ cat: 'B', x: 4, y: 5, z: 6 });
  });

  it('handles missing column values as null (placed in "(empty)" group)', () => {
    const data = [{ cat: 'A', v: 1 }, { v: 2 }, { cat: 'A', v: 3 }];

    const groups = groupDataBySplitField(data, 'cat');

    expect(groups).toHaveLength(2);
    const emptyGroup = groups.find((g) => g.key === '(empty)');
    expect(emptyGroup!.data).toHaveLength(1);
    expect(emptyGroup!.data[0]).toEqual({ v: 2 });
  });

  it('returns all groups without truncation', () => {
    const data = Array.from({ length: 100 }, (_, i) => ({ cat: `group_${i}`, v: i }));

    const groups = groupDataBySplitField(data, 'cat');

    expect(groups).toHaveLength(100);
  });
});
