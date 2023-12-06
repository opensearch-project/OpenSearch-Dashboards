/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Filter } from '../filters';
import { customFilterMatchesIndex } from './custom_filter_matches_index';
import { IIndexPattern } from '../../index_patterns';

describe('customFilterMatchesIndex', () => {
  it('should return true if the custom filter has no meta', () => {
    const filter = {} as Filter;
    const indexPattern = { id: 'foo', fields: [{ name: 'bar' }] } as IIndexPattern;

    expect(customFilterMatchesIndex(filter, indexPattern)).toBe(true);
  });

  it('should return true if no index pattern is passed', () => {
    const filter = { meta: { index: 'foo', key: 'bar', type: 'custom' } } as Filter;

    expect(customFilterMatchesIndex(filter, undefined)).toBe(true);
  });

  it('should return true if the custom filter has meta without a key', () => {
    const filter = { meta: { index: 'foo', type: 'custom' } } as Filter;
    const indexPattern = { id: 'foo', fields: [{ name: 'bar' }] } as IIndexPattern;

    expect(customFilterMatchesIndex(filter, indexPattern)).toBe(true);
  });

  it('should return false if the filter is not custom', () => {
    const filter = { meta: { index: 'foo', key: 'bar', type: 'match_all' } } as Filter;
    const indexPattern = { id: 'foo', fields: [{ name: 'bar' }] } as IIndexPattern;

    expect(customFilterMatchesIndex(filter, indexPattern)).toBe(false);
  });

  it('should return false if the custom filter is a different index id', () => {
    const filter = { meta: { index: 'foo', key: 'bar', type: 'custom' } } as Filter;
    const indexPattern = { id: 'bar', fields: [{ name: 'foo' }] } as IIndexPattern;

    expect(customFilterMatchesIndex(filter, indexPattern)).toBe(false);
  });

  it('should return true if the custom filter is the same index id', () => {
    const filter = { meta: { index: 'foo', key: 'bar', type: 'custom' } } as Filter;
    const indexPattern = { id: 'foo', fields: [{ name: 'barf' }] } as IIndexPattern;

    expect(customFilterMatchesIndex(filter, indexPattern)).toBe(true);
  });
});
