/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  uiReducer,
  setActiveTab,
  setShowDatasetFields,
  setQueryPrompt,
  setUiState,
  setShowHistogram,
  UIState,
} from './ui_slice';

describe('UI Slice', () => {
  // Define the initial state for testing
  const initialState: UIState = {
    activeTabId: 'logs',
    showDatasetFields: true,
    prompt: '',
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
      expect(newState.showDatasetFields).toBe(initialState.showDatasetFields);
      expect(newState.prompt).toBe(initialState.prompt);
      expect(newState.showHistogram).toBe(initialState.showHistogram);
    });
  });

  describe('setShowDatasetFields', () => {
    it('should handle setShowDatasetFields action', () => {
      const newValue = false;
      const action = setShowDatasetFields(newValue);

      expect(action.type).toBe('ui/setShowDatasetFields');
      expect(action.payload).toBe(newValue);

      const newState = uiReducer(initialState, action);
      expect(newState.showDatasetFields).toBe(newValue);

      // Other state properties should remain unchanged
      expect(newState.activeTabId).toBe(initialState.activeTabId);
      expect(newState.prompt).toBe(initialState.prompt);
      expect(newState.showHistogram).toBe(initialState.showHistogram);
    });
  });

  describe('setQueryPrompt', () => {
    it('should handle setQueryPrompt action', () => {
      const newPrompt = 'SELECT * FROM logs';
      const action = setQueryPrompt(newPrompt);

      expect(action.type).toBe('ui/setQueryPrompt');
      expect(action.payload).toBe(newPrompt);

      const newState = uiReducer(initialState, action);
      expect(newState.prompt).toBe(newPrompt);

      // Other state properties should remain unchanged
      expect(newState.activeTabId).toBe(initialState.activeTabId);
      expect(newState.showDatasetFields).toBe(initialState.showDatasetFields);
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

      // Other state properties should remain unchanged
      expect(newState.activeTabId).toBe(initialState.activeTabId);
      expect(newState.showDatasetFields).toBe(initialState.showDatasetFields);
      expect(newState.prompt).toBe(initialState.prompt);
    });
  });

  describe('setUiState', () => {
    it('should handle setUiState action', () => {
      const newState = {
        activeTabId: 'visualizations',
        flavor: 'metric',
        showDatasetFields: false,
        prompt: 'test query',
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
      state = uiReducer(state, setShowDatasetFields(false));
      expect(state.showDatasetFields).toBe(false);

      // Third action: set query prompt
      state = uiReducer(state, setQueryPrompt('test query'));
      expect(state.prompt).toBe('test query');

      // Final state should have all changes
      expect(state).toEqual({
        ...initialState,
        activeTabId: 'visualizations',
        showDatasetFields: false,
        prompt: 'test query',
      });
    });
  });
});
