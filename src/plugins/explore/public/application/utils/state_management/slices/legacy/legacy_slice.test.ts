/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  legacyReducer,
  setLegacyState,
  setSavedSearch,
  setSavedQuery,
  setInterval,
  setIsDirty,
  setLineCount,
  LegacyState,
} from './legacy_slice';

describe('legacySlice reducers', () => {
  const initialState: LegacyState = {
    savedSearch: undefined,
    interval: 'auto',
    isDirty: false,
    lineCount: undefined,
  };

  it('setLegacyState replaces the entire state', () => {
    const newState: LegacyState = {
      savedSearch: 'id',
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
