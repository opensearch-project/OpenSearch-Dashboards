/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  uiReducer,
  setActiveTab,
  setShowFilterPanel,
  setUiState,
  setShowHistogram,
  UIState,
} from './ui_slice';

describe('UI Slice', () => {
  const initialState: UIState = {
    activeTabId: '',
    showFilterPanel: true,
    showHistogram: true,
  };

  it('should return the initial state', () => {
    // @ts-ignore - passing undefined action
    expect(uiReducer(undefined, {})).toEqual(initialState);
  });

  describe('setActiveTab', () => {
    it('should handle setActiveTab action', () => {
      const newTabId = 'visualizations';
      const action = setActiveTab(newTabId);

      expect(action.type).toBe('ui/setActiveTab');
      expect(action.payload).toBe(newTabId);

      const newState = uiReducer(initialState, action);
      expect(newState.activeTabId).toBe(newTabId);

      // Other state properties should remain unchanged
      expect(newState.showFilterPanel).toBe(initialState.showFilterPanel);
      expect(newState.showHistogram).toBe(initialState.showHistogram);
    });
  });

  describe('setShowFilterPanel', () => {
    it('should handle setShowFilterPanel action', () => {
      const newValue = false;
      const action = setShowFilterPanel(newValue);

      expect(action.type).toBe('ui/setShowFilterPanel');
      expect(action.payload).toBe(newValue);

      const newState = uiReducer(initialState, action);
      expect(newState.showFilterPanel).toBe(newValue);

      expect(newState.activeTabId).toBe(initialState.activeTabId);
      expect(newState.showHistogram).toBe(initialState.showHistogram);
    });
  });

  describe('setShowHistogram', () => {
    it('should handle setShowHistogram action', () => {
      const newValue = false;
      const action = setShowHistogram(newValue);

      expect(action.type).toBe('ui/setShowHistogram');
      expect(action.payload).toBe(newValue);

      const newState = uiReducer(initialState, action);
      expect(newState.showHistogram).toBe(newValue);

      expect(newState.activeTabId).toBe(initialState.activeTabId);
      expect(newState.showFilterPanel).toBe(initialState.showFilterPanel);
    });
  });

  describe('setUiState', () => {
    it('should handle setUiState action', () => {
      const newState: UIState = {
        activeTabId: 'visualizations',
        showFilterPanel: false,
        showHistogram: false,
      };
      const action = setUiState(newState);

      expect(action.type).toBe('ui/setUiState');
      expect(action.payload).toEqual(newState);

      const resultState = uiReducer(initialState, action);
      expect(resultState).toEqual({ ...initialState, ...newState });
    });
  });

  describe('multiple actions', () => {
    it('should handle multiple actions in sequence', () => {
      let state = initialState;

      // First action: set active tab
      state = uiReducer(state, setActiveTab('visualizations'));
      expect(state.activeTabId).toBe('visualizations');

      // Second action: set show dataset fields
      state = uiReducer(state, setShowFilterPanel(false));
      expect(state.showFilterPanel).toBe(false);

      // Third action: set histogram
      state = uiReducer(state, setShowHistogram(true));
      expect(state.showHistogram).toBe(true);

      // Final state should have all changes
      expect(state).toEqual({
        ...initialState,
        activeTabId: 'visualizations',
        showFilterPanel: false,
        showHistogram: true,
      });
    });
  });
});
