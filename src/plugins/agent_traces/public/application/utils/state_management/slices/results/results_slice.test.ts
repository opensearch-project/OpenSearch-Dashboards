/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  setResultsState,
  setResults,
  clearResults,
  clearResultsByKey,
  resultsReducer,
  ResultsState,
  ISearchResult,
} from './results_slice';

describe('resultsSlice reducers', () => {
  const sampleResult: ISearchResult = {
    took: 10,
    timed_out: false,
    _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
    hits: { total: 1, max_score: 1, hits: [] },
    elapsedMs: 100,
  };

  const initialState: ResultsState = {
    foo: { ...sampleResult, elapsedMs: 101 },
    bar: { ...sampleResult, elapsedMs: 102 },
  };

  it('setResultsState replaces the entire state', () => {
    const newState: ResultsState = {
      baz: { ...sampleResult, elapsedMs: 200 },
    };
    const state = resultsReducer(initialState, setResultsState(newState));
    expect(state).toEqual(newState);
  });

  it('setResults sets results for a cacheKey', () => {
    const action = setResults({ cacheKey: 'baz', results: { ...sampleResult, elapsedMs: 300 } });
    const state = resultsReducer(initialState, action);
    expect(state.baz).toEqual({ ...sampleResult, elapsedMs: 300 });
  });

  it('setResults overwrites existing cacheKey', () => {
    const action = setResults({ cacheKey: 'foo', results: { ...sampleResult, elapsedMs: 999 } });
    const state = resultsReducer(initialState, action);
    expect(state.foo).toEqual({ ...sampleResult, elapsedMs: 999 });
  });

  it('clearResults resets state to empty object', () => {
    const state = resultsReducer(initialState, clearResults());
    expect(state).toEqual({});
  });

  it('clearResultsByKey removes the specified cacheKey', () => {
    const state = resultsReducer(initialState, clearResultsByKey('foo'));
    expect(state).toEqual({ bar: { ...sampleResult, elapsedMs: 102 } });
  });

  it('clearResultsByKey does nothing if cacheKey does not exist', () => {
    const state = resultsReducer(initialState, clearResultsByKey('nonexistent'));
    expect(state).toEqual(initialState);
  });
});
