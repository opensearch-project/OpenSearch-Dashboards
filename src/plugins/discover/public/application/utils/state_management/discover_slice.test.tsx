/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { discoverSlice, DiscoverState } from './discover_slice';

describe('discoverSlice', () => {
  let initialState: DiscoverState;

  beforeEach(() => {
    initialState = {
      columns: [],
      sort: [],
    };
  });

  it('should handle setState', () => {
    const newState = {
      columns: ['column1', 'column2'],
      sort: [['field1', 'asc']],
    };
    const action = { type: 'discover/setState', payload: newState };
    const result = discoverSlice.reducer(initialState, action);
    expect(result).toEqual(newState);
  });

  it('should handle addColumn', () => {
    const action1 = { type: 'discover/addColumn', payload: { column: 'column1' } };
    const result1 = discoverSlice.reducer(initialState, action1);
    expect(result1.columns).toEqual(['column1']);

    const action2 = { type: 'discover/addColumn', payload: { column: 'column2', index: 0 } };
    const result2 = discoverSlice.reducer(result1, action2);
    expect(result2.columns).toEqual(['column2', 'column1']);
  });

  it('should handle removeColumn', () => {
    initialState = {
      columns: ['column1', 'column2'],
      sort: [],
    };
    const action = { type: 'discover/removeColumn', payload: 'column1' };
    const result = discoverSlice.reducer(initialState, action);
    expect(result.columns).toEqual(['column2']);
  });

  it('should handle reorderColumn', () => {
    initialState = {
      columns: ['column1', 'column2', 'column3'],
      sort: [],
    };
    const action = { type: 'discover/reorderColumn', payload: { source: 0, destination: 2 } };
    const result = discoverSlice.reducer(initialState, action);
    expect(result.columns).toEqual(['column2', 'column3', 'column1']);
  });

  it('should handle updateState', () => {
    initialState = {
      columns: ['column1', 'column2'],
      sort: [['field1', 'asc']],
    };
    const action = { type: 'discover/updateState', payload: { sort: [['field2', 'desc']] } };
    const result = discoverSlice.reducer(initialState, action);
    expect(result.sort).toEqual([['field2', 'desc']]);
  });
});
