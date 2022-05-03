/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { mergeArrays } from './merge_arrays';

describe('mergeArrays', () => {
  const arrayA = ['a', 'b', 'c'].map((x) => ({ id: x, value: `${x} in arrayA` }));
  const arrayB = ['a', 'c', 'd'].map((x) => ({ id: x, value: `${x} in arrayB` }));
  test('should merge two object arrays based on id in order without duplicates', () => {
    const mergedArrays = mergeArrays(arrayA, arrayB, 'id');
    expect(mergedArrays.map((x) => x.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(mergedArrays[0].value).toEqual('a in arrayB');
  });

  test('should throw an error if key is not a string or number', () => {
    const arr = [{ id: {} }];

    expect(() => mergeArrays(arrayA, arr, 'id')).toThrowErrorMatchingInlineSnapshot(
      `"Can only merge arrays with keys of type number or string"`
    );
  });
});
