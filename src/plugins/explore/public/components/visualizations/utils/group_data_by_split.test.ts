/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { filterDataBySplitField, getSplitKeysBySplitField } from './group_data_by_split';

describe('split data helpers', () => {
  it('returns sorted split keys without grouping row data', () => {
    const data = [
      { cat: 'B', v: 1 },
      { cat: 'A', v: 2 },
      { cat: 'B', v: 3 },
      { cat: null, v: 4 },
    ];

    expect(getSplitKeysBySplitField(data, 'cat')).toEqual(['(empty)', 'A', 'B']);
  });

  it('returns empty keys for empty data', () => {
    expect(getSplitKeysBySplitField([], 'cat')).toEqual([]);
  });

  it('normalizes null, undefined, empty string, missing, and numeric split keys', () => {
    const data = [{ cat: null }, { cat: undefined }, { cat: '' }, {}, { cat: 200 }, { cat: 404 }];

    expect(getSplitKeysBySplitField(data, 'cat')).toEqual(['(empty)', '200', '404']);
  });

  it('filters data by a normalized split key', () => {
    const data = [
      { cat: null, v: 1 },
      { cat: '', v: 2 },
      { cat: 'A', v: 3 },
    ];

    expect(filterDataBySplitField(data, 'cat', '(empty)')).toEqual([
      { cat: null, v: 1 },
      { cat: '', v: 2 },
    ]);
  });

  it('preserves all columns when filtering split data', () => {
    const data = [
      { cat: 'A', x: 1, y: 2, z: 3 },
      { cat: 'B', x: 4, y: 5, z: 6 },
    ];

    expect(filterDataBySplitField(data, 'cat', 'A')).toEqual([{ cat: 'A', x: 1, y: 2, z: 3 }]);
  });
});
