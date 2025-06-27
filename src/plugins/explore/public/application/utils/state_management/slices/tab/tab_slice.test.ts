/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { setTabState, setSkipInitialFetch, tabReducer, TabState } from './tab_slice';

describe('tabSlice reducers', () => {
  const initialState: TabState = {
    logs: { skipInitialFetch: false },
    visualizations: { skipInitialFetch: false },
  };

  it('setTabState replaces the entire state', () => {
    const newState: TabState = {
      foo: { skipInitialFetch: true },
      bar: { skipInitialFetch: false },
    };
    const state = tabReducer(initialState, setTabState(newState));
    expect(state).toEqual(newState);
  });

  it('setSkipInitialFetch updates skipInitialFetch for existing tab', () => {
    const action = setSkipInitialFetch({ tabId: 'logs', skip: true });
    const state = tabReducer(initialState, action);
    expect(state.logs.skipInitialFetch).toBe(true);
    expect(state.visualizations.skipInitialFetch).toBe(false);
  });

  it('setSkipInitialFetch does nothing for non-existent tab', () => {
    const action = setSkipInitialFetch({ tabId: 'nonexistent', skip: true });
    const state = tabReducer(initialState, action);
    expect(state).toEqual(initialState);
  });
});
