/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  legacyReducer,
  setLegacyState,
  setSavedSearch,
  setSavedQuery,
  setColumns,
  addColumn,
  removeColumn,
  moveColumn,
  setSort,
  setInterval,
  setIsDirty,
  setLineCount,
  LegacyState,
} from './legacy_slice';
import { SortOrder } from '../../../../../types/saved_explore_types';

describe('legacySlice reducers', () => {
  const initialState: LegacyState = {
    savedSearch: undefined,
    columns: ['a', 'b', 'c'],
    sort: [['a', 'asc']],
    interval: 'auto',
    isDirty: false,
    lineCount: undefined,
  };

  it('setLegacyState replaces the entire state', () => {
    const newState: LegacyState = {
      savedSearch: 'id',
      columns: ['x'],
      sort: [],
      interval: '1h',
      isDirty: true,
      lineCount: 10,
    };
    const state = legacyReducer(initialState, setLegacyState(newState));
    expect(state).toEqual(newState);
  });

  it('setSavedSearch sets savedSearch', () => {
    const state = legacyReducer(initialState, setSavedSearch('search-id'));
    expect(state.savedSearch).toBe('search-id');
  });

  it('setSavedQuery sets savedQuery', () => {
    const state = legacyReducer(initialState, setSavedQuery('query-id'));
    expect(state.savedQuery).toBe('query-id');
  });

  it('setSavedQuery removes savedQuery when payload is undefined', () => {
    const stateWithSavedQuery = {
      ...initialState,
      savedQuery: 'existing-query-id',
    };
    const state = legacyReducer(stateWithSavedQuery, setSavedQuery(undefined));
    expect(state.savedQuery).toBeUndefined();
    expect(state).not.toHaveProperty('savedQuery');
  });

  it('setColumns sets columns', () => {
    const state = legacyReducer(initialState, setColumns(['x', 'y']));
    expect(state.columns).toEqual(['x', 'y']);
  });

  it('addColumn adds a new column if not present', () => {
    const state = legacyReducer(initialState, addColumn({ column: 'd' }));
    expect(state.columns).toContain('d');
  });

  it('addColumn does not add duplicate column', () => {
    const state = legacyReducer(initialState, addColumn({ column: 'a' }));
    expect(state.columns.filter((c) => c === 'a').length).toBe(1);
  });

  it('removeColumn removes the specified column', () => {
    const state = legacyReducer(initialState, removeColumn('b'));
    expect(state.columns).toEqual(['a', 'c']);
  });

  it('removeColumn does nothing if column not present', () => {
    const state = legacyReducer(initialState, removeColumn('z'));
    expect(state.columns).toEqual(initialState.columns);
  });

  it('moveColumn moves a column to the specified destination', () => {
    const state = legacyReducer(initialState, moveColumn({ columnName: 'a', destination: 2 }));
    expect(state.columns).toEqual(['b', 'c', 'a']);
  });

  it('moveColumn does nothing if column not found', () => {
    const state = legacyReducer(initialState, moveColumn({ columnName: 'z', destination: 1 }));
    expect(state.columns).toEqual(initialState.columns);
  });

  it('moveColumn does nothing if destination is out of bounds', () => {
    const state = legacyReducer(initialState, moveColumn({ columnName: 'a', destination: 10 }));
    expect(state.columns).toEqual(initialState.columns);
  });

  it('setSort sets sort', () => {
    const sort: SortOrder[] = [['b', 'desc']];
    const state = legacyReducer(initialState, setSort(sort));
    expect(state.sort).toEqual(sort);
  });

  it('setInterval sets interval', () => {
    const state = legacyReducer(initialState, setInterval('5m'));
    expect(state.interval).toBe('5m');
  });

  it('setIsDirty sets isDirty', () => {
    const state = legacyReducer(initialState, setIsDirty(true));
    expect(state.isDirty).toBe(true);
  });

  it('setLineCount sets lineCount', () => {
    const state = legacyReducer(initialState, setLineCount(42));
    expect(state.lineCount).toBe(42);
  });
});
