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
  });

  it('should handle removeColumn', () => {
    initialState = {
      columns: ['column1', 'column2'],
      sort: [['column1', 'asc']],
    };
    const action = { type: 'discover/removeColumn', payload: 'column1' };
    const result = discoverSlice.reducer(initialState, action);
    expect(result.columns).toEqual(['column2']);
    expect(result.sort).toEqual([]);
  });

  it('should handle reorderColumn', () => {
    initialState = {
      columns: ['column1', 'column2', 'column3'],
      sort: [],
    };
    const action = {
      type: 'discover/reorderColumn',
      payload: { source: 0, destination: 2 },
    };
    const result = discoverSlice.reducer(initialState, action);
    expect(result.columns).toEqual(['column2', 'column3', 'column1']);
  });

  it('should handle setColumns', () => {
    const action = {
      type: 'discover/setColumns',
      payload: { columns: ['column1', 'column2'] },
    };
    const result = discoverSlice.reducer(initialState, action);
    expect(result.columns).toEqual(['column1', 'column2']);
  });

  it('should handle setSort', () => {
    const action = { type: 'discover/setSort', payload: [['field1', 'asc']] };
    const result = discoverSlice.reducer(initialState, action);
    expect(result.sort).toEqual([['field1', 'asc']]);
  });

  it('should handle updateState', () => {
    initialState = {
      columns: ['column1', 'column2'],
      sort: [['field1', 'asc']],
    };
    const action = {
      type: 'discover/updateState',
      payload: { sort: [['field2', 'desc']] },
    };
    const result = discoverSlice.reducer(initialState, action);
    expect(result.sort).toEqual([['field2', 'desc']]);
  });
});
