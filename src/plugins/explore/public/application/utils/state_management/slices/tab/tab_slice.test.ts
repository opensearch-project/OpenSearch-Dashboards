/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { setMetricsExploreState, setTabState, tabReducer, TabState } from './tab_slice';

describe('tabSlice reducers', () => {
  const initialState: TabState = {
    logs: {},
    patterns: { patternsField: undefined, usingRegexPatterns: false },
  };

  it('should return the initial state', () => {
    // @ts-ignore - passing undefined action
    expect(tabReducer(undefined, {})).toEqual(initialState);
  });

  describe('setTabState', () => {
    it('should replace the entire state', () => {
      const newState: TabState = {
        logs: { someProperty: 'value' },
        patterns: {
          patternsField: 'message',
          usingRegexPatterns: false,
        },
      };

      const state = tabReducer(initialState, setTabState(newState));
      expect(state).toEqual(newState);
    });

    it('should handle different tab state configurations', () => {
      const newState: TabState = {
        logs: {},
        patterns: {
          patternsField: 'message',
          usingRegexPatterns: false,
        },
      };

      const state = tabReducer(initialState, setTabState(newState));
      expect(state).toEqual(newState);
    });
  });

  describe('setMetricsExploreState', () => {
    it('persists filters with operator and enabled fields', () => {
      const payload = {
        level: 'detail',
        metric: 'http_requests_total',
        filters: [
          { name: 'job', operator: '=' as const, value: 'api' },
          { name: 'status', operator: '!=' as const, value: '200', enabled: false },
          { name: 'path', operator: '=~' as const, value: '/api/.*' },
          { name: 'region', operator: '!~' as const, value: 'dev-.*', enabled: true },
        ],
      };

      const state = tabReducer(initialState, setMetricsExploreState(payload));

      expect(state.metricsExplore).toEqual(payload);
      expect(state.metricsExplore?.filters).toHaveLength(4);
      expect(state.metricsExplore?.filters?.[1]).toEqual({
        name: 'status',
        operator: '!=',
        value: '200',
        enabled: false,
      });
    });

    it('overwrites prior metricsExplore state on subsequent dispatches', () => {
      const first = tabReducer(
        initialState,
        setMetricsExploreState({
          metric: 'foo',
          filters: [{ name: 'a', operator: '=' as const, value: '1' }],
        })
      );
      const second = tabReducer(
        first,
        setMetricsExploreState({
          metric: 'bar',
          filters: [],
        })
      );

      expect(second.metricsExplore?.metric).toBe('bar');
      expect(second.metricsExplore?.filters).toEqual([]);
    });
  });

  describe('state immutability', () => {
    it('should maintain proper state structure', () => {
      const state = tabReducer(
        initialState,
        setTabState({ logs: { someProperty: 'value' }, patterns: { usingRegexPatterns: false } })
      );

      // Ensure the state structure is maintained
      expect(state).toHaveProperty('logs');
    });

    it('should not mutate the original state', () => {
      const originalState = { ...initialState };
      tabReducer(
        initialState,
        setTabState({ logs: { someProperty: 'value' }, patterns: { usingRegexPatterns: false } })
      );

      // Original state should remain unchanged
      expect(initialState).toEqual(originalState);
    });

    it('should create new state objects for setTabState', () => {
      const newState: TabState = {
        logs: { test: 'value' },
        patterns: {
          patternsField: 'message',
          usingRegexPatterns: false,
        },
      };

      const result = tabReducer(initialState, setTabState(newState));
      expect(result).not.toBe(initialState);
      expect(result).toEqual(newState);
    });
  });
});
