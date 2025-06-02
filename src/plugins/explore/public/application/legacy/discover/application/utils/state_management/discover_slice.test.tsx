/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { discoverSlice, DiscoverState } from './discover_slice';
import { SortOrder } from '../../../../../../types/saved_explore_types';

describe('discoverSlice', () => {
  let initialState: DiscoverState;

  beforeEach(() => {
    initialState = {
      saveExploreLoadCount: 0,
      columns: [],
      sort: [],
    };
  });

  it('should handle setState', () => {
    const newState = {
      columns: ['column1', 'column2'],
      sort: [['field1', 'asc']],
    };
    const action = { type: 'logs/setState', payload: newState };
    const result = discoverSlice.reducer(initialState, action);
    expect(result).toEqual(newState);
  });

  it('should handle addColumn', () => {
    const action1 = { type: 'logs/addColumn', payload: { column: 'column1' } };
    const result1 = discoverSlice.reducer(initialState, action1);
    expect(result1.columns).toEqual(['column1']);
  });

  it('should handle removeColumn', () => {
    initialState = {
      saveExploreLoadCount: 0,
      columns: ['column1', 'column2'],
      sort: [['column1', 'asc']],
    };
    const action = { type: 'logs/removeColumn', payload: 'column1' };
    const result = discoverSlice.reducer(initialState, action);
    expect(result.columns).toEqual(['column2']);
    expect(result.sort).toEqual([]);
  });

  it('should handle reorderColumn', () => {
    initialState = {
      saveExploreLoadCount: 0,
      columns: ['column1', 'column2', 'column3'],
      sort: [],
    };
    const action = {
      type: 'logs/reorderColumn',
      payload: { source: 0, destination: 2 },
    };
    const result = discoverSlice.reducer(initialState, action);
    expect(result.columns).toEqual(['column2', 'column3', 'column1']);
  });

  it('should handle setColumns', () => {
    const action = {
      type: 'logs/setColumns',
      payload: { columns: ['column1', 'column2'] },
    };
    const result = discoverSlice.reducer(initialState, action);
    expect(result.columns).toEqual(['column1', 'column2']);
  });

  it('should handle setSort', () => {
    const action = { type: 'logs/setSort', payload: [['field1', 'asc']] };
    const result = discoverSlice.reducer(initialState, action);
    expect(result.sort).toEqual([['field1', 'asc']]);
  });

  it('should handle updateState', () => {
    initialState = {
      saveExploreLoadCount: 0,
      columns: ['column1', 'column2'],
      sort: [['field1', 'asc']],
    };
    const action = {
      type: 'logs/updateState',
      payload: { sort: [['field2', 'desc']] },
    };
    const result = discoverSlice.reducer(initialState, action);
    expect(result.sort).toEqual([['field2', 'desc']]);
  });

  it('should handle moveColumn', () => {
    initialState = {
      saveExploreLoadCount: 0,
      columns: ['column1', 'column2', 'column3'],
      sort: [],
    };
    const action = {
      type: 'logs/moveColumn',
      payload: { columnName: 'column2', destination: 0 },
    };
    const result = discoverSlice.reducer(initialState, action);
    expect(result.columns).toEqual(['column2', 'column1', 'column3']);
  });

  it('should maintain columns order when moving a column to its current position', () => {
    initialState = {
      saveExploreLoadCount: 0,
      columns: ['column1', 'column2', 'column3'],
      sort: [],
    };
    const action = {
      type: 'logs/moveColumn',
      payload: { columnName: 'column2', destination: 1 },
    };
    const result = discoverSlice.reducer(initialState, action);
    expect(result.columns).toEqual(['column1', 'column2', 'column3']);
  });

  it('should handle moveColumn when destination is out of range', () => {
    initialState = {
      saveExploreLoadCount: 0,
      columns: ['column1', 'column2', 'column3'],
      sort: [],
    };
    const action = {
      type: 'logs/moveColumn',
      payload: { columnName: 'column1', destination: 5 },
    };
    const result = discoverSlice.reducer(initialState, action);
    expect(result.columns).toEqual(['column1', 'column2', 'column3']);
  });

  it('should not change columns if column to move does not exist', () => {
    initialState = {
      saveExploreLoadCount: 0,
      columns: ['column1', 'column2', 'column3'],
      sort: [],
    };
    const action = {
      type: 'logs/moveColumn',
      payload: { columnName: 'nonExistingColumn', destination: 0 },
    };
    const result = discoverSlice.reducer(initialState, action);
    expect(result.columns).toEqual(['column1', 'column2', 'column3']);
  });

  it('should set the savedQuery when a valid id is provided', () => {
    const savedQueryId = 'some-query-id';
    const action = { type: 'logs/setSavedQuery', payload: savedQueryId };
    const result = discoverSlice.reducer(initialState, action);
    expect(result.savedQuery).toEqual(savedQueryId);
  });

  it('should remove the savedQuery from state when payload is undefined', () => {
    // pre-set the savedQuery in the initialState
    const initialStateWithSavedQuery = {
      ...initialState,
      savedQuery: 'existing-query-id',
    };

    const action = { type: 'logs/setSavedQuery', payload: undefined };
    const result = discoverSlice.reducer(initialStateWithSavedQuery, action);

    // Check that savedQuery is not in the resulting state
    expect(result.savedQuery).toBeUndefined();
  });

  it('should not affect other state properties when setting savedQuery', () => {
    const initialStateWithOtherProperties = {
      ...initialState,
      columns: ['column1', 'column2'],
      sort: [['field1', 'asc']] as SortOrder[],
    };
    const savedQueryId = 'new-query-id';
    const action = { type: 'logs/setSavedQuery', payload: savedQueryId };
    const result = discoverSlice.reducer(initialStateWithOtherProperties, action);
    // check that other properties remain unchanged
    expect(result.columns).toEqual(['column1', 'column2']);
    expect(result.sort).toEqual([['field1', 'asc']] as SortOrder[]);
    expect(result.savedQuery).toEqual(savedQueryId);
  });
});
