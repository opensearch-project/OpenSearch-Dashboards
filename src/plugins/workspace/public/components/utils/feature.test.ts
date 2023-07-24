/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  isFeatureDependBySelectedFeatures,
  getFinalFeatureIdsByDependency,
  generateFeatureDependencyMap,
} from './feature';

describe('feature utils', () => {
  describe('isFeatureDependBySelectedFeatures', () => {
    it('should return true', () => {
      expect(isFeatureDependBySelectedFeatures('a', ['b'], { b: ['a'] })).toBe(true);
      expect(isFeatureDependBySelectedFeatures('a', ['b'], { b: ['a', 'c'] })).toBe(true);
    });
    it('should return false', () => {
      expect(isFeatureDependBySelectedFeatures('a', ['b'], { b: ['c'] })).toBe(false);
      expect(isFeatureDependBySelectedFeatures('a', ['b'], {})).toBe(false);
    });
  });

  describe('getFinalFeatureIdsByDependency', () => {
    it('should return consistent feature ids', () => {
      expect(getFinalFeatureIdsByDependency(['a'], { a: ['b'] }, ['c', 'd'])).toStrictEqual([
        'c',
        'd',
        'a',
        'b',
      ]);
      expect(getFinalFeatureIdsByDependency(['a'], { a: ['b', 'e'] }, ['c', 'd'])).toStrictEqual([
        'c',
        'd',
        'a',
        'b',
        'e',
      ]);
    });
  });

  it('should generate consistent features dependency map', () => {
    expect(
      generateFeatureDependencyMap([
        { id: 'a', dependencies: { b: { type: 'required' }, c: { type: 'optional' } } },
        { id: 'b', dependencies: { c: { type: 'required' } } },
      ])
    ).toEqual({
      a: ['b'],
      b: ['c'],
    });
  });
});
