/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { filterQuery } from './filter_query';

describe('filterQuery', () => {
  it('should return full list of allowed vals, requested values unspecified', () => {
    const allowedVals = ['config', 'index-pattern', 'url', 'query'];
    const requestedVals = undefined;

    const expected = ['config', 'index-pattern', 'url', 'query'];
    expect(filterQuery(allowedVals, requestedVals)).toEqual(expected);
  });

  it('should return list of all requested values, all values within allowed values', () => {
    const allowedVals = ['config', 'index-pattern', 'url', 'query'];
    const requestedVals = ['config', 'index-pattern'];

    const expected = ['config', 'index-pattern'];
    expect(filterQuery(allowedVals, requestedVals)).toEqual(expected);
  });

  it('should return only allowed values within requested values', () => {
    const allowedVals = ['config', 'index-pattern', 'url', 'query'];
    const requestedVals = ['config', 'index-pattern', 'forbidden'];

    const expected = ['config', 'index-pattern'];
    expect(filterQuery(allowedVals, requestedVals)).toEqual(expected);
  });
});
