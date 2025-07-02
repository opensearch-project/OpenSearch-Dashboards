/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { setQueryState, queryReducer, QueryState } from './query_slice';
import { EXPLORE_DEFAULT_LANGUAGE } from '../../../../../../common';

describe('querySlice reducers', () => {
  const initialState: QueryState = {
    query: '',
    language: EXPLORE_DEFAULT_LANGUAGE,
    dataset: undefined,
  };

  it('setQueryState replaces the entire state', () => {
    const newQuery: QueryState = {
      query: 'foo',
      language: 'sql',
      dataset: {
        id: 'my-dataset',
        title: 'my dataset',
        type: 'log',
      },
    };
    const state = queryReducer(initialState, setQueryState(newQuery));
    expect(state).toEqual(newQuery);
  });

  it('setQueryState replaces the entire state (second test)', () => {
    const newState: QueryState = {
      query: 'bar',
      language: 'ppl',
      dataset: {
        id: 'another-dataset',
        title: 'another dataset',
        type: 'metric',
      },
    };
    const state = queryReducer(initialState, setQueryState(newState));
    expect(state).toEqual(newState);
  });

  it('setQueryState works with partial fields (should overwrite missing fields with undefined)', () => {
    const partialQuery = { query: 'baz', language: 'sql' } as QueryState;
    const state = queryReducer(initialState, setQueryState(partialQuery));
    expect(state).toEqual({ ...partialQuery });
  });
});
