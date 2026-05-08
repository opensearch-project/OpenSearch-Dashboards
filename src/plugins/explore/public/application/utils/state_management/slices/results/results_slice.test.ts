/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  setResults,
  clearResults,
  clearResultsByKey,
  resultsReducer,
  resultsCache,
  clearResultsCache,
  ResultsState,
  ResultMetadata,
  ISearchResult,
} from './results_slice';

describe('resultsSlice reducers', () => {
  const sampleResult: ISearchResult = {
    took: 10,
    timed_out: false,
    _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
    // @ts-expect-error TS2741 TODO(ts-error): fixme
    hits: { total: 1, max_score: 1, hits: [{ _index: 'i', _type: 't', _id: '1', _score: 1 }] },
    elapsedMs: 100,
  };

  const sampleMetadata: ResultMetadata = {
    total: 1,
    elapsedMs: 100,
    fieldSchema: undefined,
    instantFieldSchema: undefined,
    hasResults: true,
  };

  afterEach(() => {
    clearResultsCache();
  });

  it('setResults stores metadata for a cacheKey', () => {
    const action = setResults({ cacheKey: 'baz', results: { ...sampleResult, elapsedMs: 300 } });
    const state = resultsReducer({}, action);
    expect(state.baz).toEqual({ ...sampleMetadata, elapsedMs: 300 });
    // Full result is NOT in Redux state
    expect((state.baz as any).hits).toBeUndefined();
  });

  it('setResults overwrites existing cacheKey metadata', () => {
    const initial: ResultsState = { foo: { ...sampleMetadata, elapsedMs: 101 } };
    const action = setResults({ cacheKey: 'foo', results: { ...sampleResult, elapsedMs: 999 } });
    const state = resultsReducer(initial, action);
    expect(state.foo.elapsedMs).toBe(999);
  });

  it('setResults does not write to cache (middleware handles cache)', () => {
    const action = setResults({ cacheKey: 'baz', results: sampleResult });
    resultsReducer({}, action);
    // Cache write is handled by middleware, not the reducer
    expect(resultsCache.get('baz')).toBeUndefined();
  });

  it('clearResults resets state to empty object', () => {
    const initial: ResultsState = { foo: sampleMetadata };
    const state = resultsReducer(initial, clearResults());
    expect(state).toEqual({});
  });

  it('clearResultsByKey removes the specified cacheKey', () => {
    const initial: ResultsState = {
      foo: { ...sampleMetadata, elapsedMs: 101 },
      bar: { ...sampleMetadata, elapsedMs: 102 },
    };
    const state = resultsReducer(initial, clearResultsByKey('foo'));
    expect(state).toEqual({ bar: { ...sampleMetadata, elapsedMs: 102 } });
  });

  it('clearResultsByKey does nothing if cacheKey does not exist', () => {
    const initial: ResultsState = { foo: sampleMetadata };
    const state = resultsReducer(initial, clearResultsByKey('nonexistent'));
    expect(state).toEqual(initial);
  });

  it('extractMetadata: total from number', () => {
    const result: ISearchResult = {
      ...sampleResult,
      hits: { total: 42, max_score: 1, hits: [] },
    };
    const action = setResults({ cacheKey: 'k', results: result });
    const state = resultsReducer({}, action);
    expect(state.k.total).toBe(42);
    expect(state.k.hasResults).toBe(false); // no hits
  });

  it('extractMetadata: total from object with value', () => {
    const result: ISearchResult = {
      ...sampleResult,
      hits: { total: { value: 100, relation: 'eq' } as any, max_score: 1, hits: [] },
    };
    const action = setResults({ cacheKey: 'k', results: result });
    const state = resultsReducer({}, action);
    expect(state.k.total).toBe(100);
  });

  it('extractMetadata: hasResults true when hits array is non-empty', () => {
    const action = setResults({ cacheKey: 'k', results: sampleResult });
    const state = resultsReducer({}, action);
    expect(state.k.hasResults).toBe(true);
  });
});
