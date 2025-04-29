/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { sourceCheck } from './direct_query_sync';

describe('sourceCheck', () => {
  it('returns true if all indexPatternIds and mdsIds are the same', () => {
    const indexPatternIds = ['pattern-1', 'pattern-1', 'pattern-1'];
    const mdsIds = ['mds-1', 'mds-1', 'mds-1'];

    expect(sourceCheck(indexPatternIds, mdsIds)).toBe(true);
  });

  it('returns false if indexPatternIds are different', () => {
    const indexPatternIds = ['pattern-1', 'pattern-2', 'pattern-1'];
    const mdsIds = ['mds-1', 'mds-1', 'mds-1'];

    expect(sourceCheck(indexPatternIds, mdsIds)).toBe(false);
  });

  it('returns false if mdsIds are different', () => {
    const indexPatternIds = ['pattern-1', 'pattern-1', 'pattern-1'];
    const mdsIds = ['mds-1', 'mds-2', 'mds-1'];

    expect(sourceCheck(indexPatternIds, mdsIds)).toBe(false);
  });

  it('returns false if both indexPatternIds and mdsIds are different', () => {
    const indexPatternIds = ['pattern-1', 'pattern-2'];
    const mdsIds = ['mds-1', 'mds-2'];

    expect(sourceCheck(indexPatternIds, mdsIds)).toBe(false);
  });

  it('returns true if empty arrays (edge case)', () => {
    expect(sourceCheck([], [])).toBe(true);
  });

  it('returns true if single entry arrays', () => {
    expect(sourceCheck(['pattern-1'], ['mds-1'])).toBe(true);
  });
});
