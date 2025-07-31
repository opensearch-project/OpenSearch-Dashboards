/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { setTabState, tabReducer, TabState } from './tab_slice';

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

  describe('state immutability', () => {
    it('should maintain proper state structure', () => {
      const state = tabReducer(initialState, setTabState({ logs: { someProperty: 'value' } }));

      // Ensure the state structure is maintained
      expect(state).toHaveProperty('logs');
    });

    it('should not mutate the original state', () => {
      const originalState = { ...initialState };
      tabReducer(initialState, setTabState({ logs: { someProperty: 'value' } }));

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
