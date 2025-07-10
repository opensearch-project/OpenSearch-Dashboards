/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useToggleDualEditorMode } from './use_toggle_dual_editor_mode';
import { EditorContext } from '../../../context';
import { EditorMode } from '../../../utils/state_management/types';
import { setEditorMode } from '../../../utils/state_management/slices';

// Mock Redux hooks
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

// Mock selectors
jest.mock('../../../utils/state_management/selectors', () => ({
  selectEditorMode: jest.fn(),
}));

// Mock slices
jest.mock('../../../utils/state_management/slices', () => ({
  setEditorMode: jest.fn(),
}));

import { useSelector, useDispatch } from 'react-redux';
import { selectEditorMode } from '../../../utils/state_management/selectors';

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
const mockUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>;
const mockSetEditorMode = setEditorMode as jest.MockedFunction<typeof setEditorMode>;

describe('useToggleDualEditorMode', () => {
  let mockDispatch: jest.MockedFunction<any>;
  let mockTopEditor: any;
  let mockBottomEditor: any;
  let mockEditorContext: any;

  beforeEach(() => {
    jest.useFakeTimers();

    mockDispatch = jest.fn();

    mockTopEditor = {
      focus: jest.fn(),
    };

    mockBottomEditor = {
      focus: jest.fn(),
    };

    mockEditorContext = {
      topEditorRef: { current: mockTopEditor },
      bottomEditorRef: { current: mockBottomEditor },
    };

    // Setup mocks
    mockUseDispatch.mockReturnValue(mockDispatch);
    mockSetEditorMode.mockImplementation((mode) => ({ type: 'setEditorMode', payload: mode }));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  const renderUseToggleDualEditorMode = (editorMode: EditorMode = EditorMode.DualQuery) => {
    mockUseSelector.mockImplementation((selector) => {
      if (selector === selectEditorMode) return editorMode;
      return undefined;
    });

    const store = configureStore({
      reducer: () => ({}),
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>
        <EditorContext.Provider value={mockEditorContext}>{children}</EditorContext.Provider>
      </Provider>
    );

    return renderHook(() => useToggleDualEditorMode(), { wrapper });
  };

  describe('when in DualQuery mode', () => {
    it('should toggle to DualPrompt mode and focus top editor after timeout', () => {
      const { result } = renderUseToggleDualEditorMode(EditorMode.DualQuery);

      // Call the toggle function
      result.current();

      // Should dispatch setEditorMode with DualPrompt immediately
      expect(mockSetEditorMode).toHaveBeenCalledWith(EditorMode.DualPrompt);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'setEditorMode',
        payload: EditorMode.DualPrompt,
      });

      // Focus should not be called immediately
      expect(mockTopEditor.focus).not.toHaveBeenCalled();
      expect(mockBottomEditor.focus).not.toHaveBeenCalled();

      // Run all timers to execute setTimeout callbacks
      jest.runAllTimers();

      // Now focus should be called on top editor
      expect(mockTopEditor.focus).toHaveBeenCalledTimes(1);
      expect(mockBottomEditor.focus).not.toHaveBeenCalled();
    });

    it('should handle null top editor ref gracefully', () => {
      mockEditorContext.topEditorRef.current = null;

      const { result } = renderUseToggleDualEditorMode(EditorMode.DualQuery);

      // Should not throw when calling toggle
      expect(() => result.current()).not.toThrow();

      // Should still dispatch the mode change
      expect(mockSetEditorMode).toHaveBeenCalledWith(EditorMode.DualPrompt);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'setEditorMode',
        payload: EditorMode.DualPrompt,
      });

      // Run timers - should not throw even with null ref
      expect(() => jest.runAllTimers()).not.toThrow();
    });
  });

  describe('when in DualPrompt mode', () => {
    it('should toggle to DualQuery mode and focus bottom editor after timeout', () => {
      const { result } = renderUseToggleDualEditorMode(EditorMode.DualPrompt);

      // Call the toggle function
      result.current();

      // Should dispatch setEditorMode with DualQuery immediately
      expect(mockSetEditorMode).toHaveBeenCalledWith(EditorMode.DualQuery);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'setEditorMode',
        payload: EditorMode.DualQuery,
      });

      // Focus should not be called immediately
      expect(mockBottomEditor.focus).not.toHaveBeenCalled();
      expect(mockTopEditor.focus).not.toHaveBeenCalled();

      // Run all timers to execute setTimeout callbacks
      jest.runAllTimers();

      // Now focus should be called on bottom editor
      expect(mockBottomEditor.focus).toHaveBeenCalledTimes(1);
      expect(mockTopEditor.focus).not.toHaveBeenCalled();
    });

    it('should handle null bottom editor ref gracefully', () => {
      mockEditorContext.bottomEditorRef.current = null;

      const { result } = renderUseToggleDualEditorMode(EditorMode.DualPrompt);

      // Should not throw when calling toggle
      expect(() => result.current()).not.toThrow();

      // Should still dispatch the mode change
      expect(mockSetEditorMode).toHaveBeenCalledWith(EditorMode.DualQuery);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'setEditorMode',
        payload: EditorMode.DualQuery,
      });

      // Run timers - should not throw even with null ref
      expect(() => jest.runAllTimers()).not.toThrow();
    });
  });

  describe('when in non-dual modes', () => {
    it('should do nothing when in SingleQuery mode', () => {
      const { result } = renderUseToggleDualEditorMode(EditorMode.SingleQuery);

      // Call the toggle function
      result.current();

      // Should not dispatch any action
      expect(mockSetEditorMode).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();

      // Should not focus any editor
      expect(mockTopEditor.focus).not.toHaveBeenCalled();
      expect(mockBottomEditor.focus).not.toHaveBeenCalled();
    });

    it('should do nothing when in SinglePrompt mode', () => {
      const { result } = renderUseToggleDualEditorMode(EditorMode.SinglePrompt);

      // Call the toggle function
      result.current();

      // Should not dispatch any action
      expect(mockSetEditorMode).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();

      // Should not focus any editor
      expect(mockTopEditor.focus).not.toHaveBeenCalled();
      expect(mockBottomEditor.focus).not.toHaveBeenCalled();
    });

    it('should do nothing when in SingleEmpty mode', () => {
      const { result } = renderUseToggleDualEditorMode(EditorMode.SingleEmpty);

      // Call the toggle function
      result.current();

      // Should not dispatch any action
      expect(mockSetEditorMode).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();

      // Should not focus any editor
      expect(mockTopEditor.focus).not.toHaveBeenCalled();
      expect(mockBottomEditor.focus).not.toHaveBeenCalled();
    });
  });
});
