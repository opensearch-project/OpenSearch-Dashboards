/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { metaReducer, setIsInitialized, MetaState } from './meta_slice';

describe('metaSlice', () => {
  const initialState: MetaState = {
    isInitialized: false,
  };

  describe('initial state', () => {
    it('should return the initial state', () => {
      const result = metaReducer(undefined, { type: 'unknown' });
      expect(result).toEqual(initialState);
    });

    it('should have isInitialized set to false by default', () => {
      const result = metaReducer(undefined, { type: 'unknown' });
      expect(result.isInitialized).toBe(false);
    });
  });

  describe('setIsInitialized action', () => {
    it('should set isInitialized to true', () => {
      const action = setIsInitialized(true);
      const result = metaReducer(initialState, action);

      expect(result.isInitialized).toBe(true);
    });

    it('should set isInitialized to false', () => {
      const stateWithInitialized: MetaState = {
        isInitialized: true,
      };

      const action = setIsInitialized(false);
      const result = metaReducer(stateWithInitialized, action);

      expect(result.isInitialized).toBe(false);
    });

    it('should toggle isInitialized state correctly', () => {
      let state = initialState;

      // Set to true
      state = metaReducer(state, setIsInitialized(true));
      expect(state.isInitialized).toBe(true);

      // Set back to false
      state = metaReducer(state, setIsInitialized(false));
      expect(state.isInitialized).toBe(false);
    });

    it('should create action with correct type and payload', () => {
      const action = setIsInitialized(true);

      expect(action.type).toBe('meta/setIsInitialized');
      expect(action.payload).toBe(true);
    });

    it('should handle boolean payload correctly', () => {
      const trueAction = setIsInitialized(true);
      const falseAction = setIsInitialized(false);

      expect(trueAction.payload).toBe(true);
      expect(falseAction.payload).toBe(false);
    });
  });

  describe('state immutability', () => {
    it('should not mutate the original state', () => {
      const originalState: MetaState = {
        isInitialized: false,
      };

      const action = setIsInitialized(true);
      const newState = metaReducer(originalState, action);

      // Original state should remain unchanged
      expect(originalState.isInitialized).toBe(false);
      // New state should have the updated value
      expect(newState.isInitialized).toBe(true);
      // They should be different objects
      expect(newState).not.toBe(originalState);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined state gracefully', () => {
      const action = setIsInitialized(true);
      const result = metaReducer(undefined, action);

      expect(result.isInitialized).toBe(true);
    });

    it('should handle unknown actions gracefully', () => {
      const unknownAction = { type: 'unknown/action', payload: 'test' };
      const result = metaReducer(initialState, unknownAction);

      expect(result).toEqual(initialState);
    });

    it('should maintain state structure when setting same value', () => {
      const action = setIsInitialized(false);
      const result = metaReducer(initialState, action);

      expect(result).toEqual(initialState);
      expect(result.isInitialized).toBe(false);
    });
  });

  describe('integration with Redux Toolkit', () => {
    it('should work with Redux Toolkit createSlice pattern', () => {
      // Test that the slice follows RTK patterns
      expect(typeof metaReducer).toBe('function');
      expect(typeof setIsInitialized).toBe('function');

      // Test action creator returns proper action object
      const action = setIsInitialized(true);
      expect(action).toHaveProperty('type');
      expect(action).toHaveProperty('payload');
    });

    it('should have correct action type naming convention', () => {
      const action = setIsInitialized(true);
      expect(action.type).toBe('meta/setIsInitialized');
    });
  });
});
