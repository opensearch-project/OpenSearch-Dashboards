/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useSetEditorText } from './use_set_editor_text';
import { EditorContext } from '../../../context';
import { EditorMode } from '../../../utils/state_management/types';

jest.mock('../../../utils/state_management/selectors', () => ({
  selectEditorMode: jest.fn(),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: (selector: any) => selector(),
}));

import { selectEditorMode } from '../../../utils/state_management/selectors';

const mockSelectEditorMode = selectEditorMode as jest.MockedFunction<typeof selectEditorMode>;

describe('useSetEditorText', () => {
  const createMockStore = () => {
    return configureStore({
      reducer: {
        root: (state = {}) => state,
      },
    });
  };

  const createWrapper = (
    setTopEditorText: jest.Mock = jest.fn(),
    setBottomEditorText: jest.Mock = jest.fn()
  ) => {
    const store = createMockStore();
    const mockContextValue = {
      topEditorText: '',
      bottomEditorText: '',
      setTopEditorText,
      setBottomEditorText,
      dataset: undefined,
    };

    return ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>
        <EditorContext.Provider value={mockContextValue as any}>{children}</EditorContext.Provider>
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DualQuery mode', () => {
    it('returns setBottomEditorText when editor mode is DualQuery', () => {
      const mockSetTopEditorText = jest.fn();
      const mockSetBottomEditorText = jest.fn();
      mockSelectEditorMode.mockReturnValue(EditorMode.DualQuery);
      const wrapper = createWrapper(mockSetTopEditorText, mockSetBottomEditorText);

      const { result } = renderHook(() => useSetEditorText(), { wrapper });

      expect(result.current).toBe(mockSetBottomEditorText);
    });

    it('can set bottom editor text when in DualQuery mode', () => {
      const mockSetTopEditorText = jest.fn();
      const mockSetBottomEditorText = jest.fn();
      mockSelectEditorMode.mockReturnValue(EditorMode.DualQuery);
      const wrapper = createWrapper(mockSetTopEditorText, mockSetBottomEditorText);

      const { result } = renderHook(() => useSetEditorText(), { wrapper });

      const testText = 'SELECT * FROM logs WHERE level = "error"';
      result.current(testText);

      expect(mockSetBottomEditorText).toHaveBeenCalledWith(testText);
      expect(mockSetTopEditorText).not.toHaveBeenCalled();
    });
  });

  describe('Other editor modes', () => {
    it('returns setTopEditorText when editor mode is SingleQuery', () => {
      const mockSetTopEditorText = jest.fn();
      const mockSetBottomEditorText = jest.fn();
      mockSelectEditorMode.mockReturnValue(EditorMode.SingleQuery);
      const wrapper = createWrapper(mockSetTopEditorText, mockSetBottomEditorText);

      const { result } = renderHook(() => useSetEditorText(), { wrapper });

      expect(result.current).toBe(mockSetTopEditorText);
    });

    it('returns setTopEditorText when editor mode is SingleEmpty', () => {
      const mockSetTopEditorText = jest.fn();
      const mockSetBottomEditorText = jest.fn();
      mockSelectEditorMode.mockReturnValue(EditorMode.SingleEmpty);
      const wrapper = createWrapper(mockSetTopEditorText, mockSetBottomEditorText);

      const { result } = renderHook(() => useSetEditorText(), { wrapper });

      expect(result.current).toBe(mockSetTopEditorText);
    });

    it('returns setTopEditorText when editor mode is SinglePrompt', () => {
      const mockSetTopEditorText = jest.fn();
      const mockSetBottomEditorText = jest.fn();
      mockSelectEditorMode.mockReturnValue(EditorMode.SinglePrompt);
      const wrapper = createWrapper(mockSetTopEditorText, mockSetBottomEditorText);

      const { result } = renderHook(() => useSetEditorText(), { wrapper });

      expect(result.current).toBe(mockSetTopEditorText);
    });

    it('returns setTopEditorText when editor mode is DualPrompt', () => {
      const mockSetTopEditorText = jest.fn();
      const mockSetBottomEditorText = jest.fn();
      mockSelectEditorMode.mockReturnValue(EditorMode.DualPrompt);
      const wrapper = createWrapper(mockSetTopEditorText, mockSetBottomEditorText);

      const { result } = renderHook(() => useSetEditorText(), { wrapper });

      expect(result.current).toBe(mockSetTopEditorText);
    });

    it('can set top editor text when not in DualQuery mode', () => {
      const mockSetTopEditorText = jest.fn();
      const mockSetBottomEditorText = jest.fn();
      mockSelectEditorMode.mockReturnValue(EditorMode.SingleQuery);
      const wrapper = createWrapper(mockSetTopEditorText, mockSetBottomEditorText);

      const { result } = renderHook(() => useSetEditorText(), { wrapper });

      const testText = 'SELECT COUNT(*) FROM users';
      result.current(testText);

      expect(mockSetTopEditorText).toHaveBeenCalledWith(testText);
      expect(mockSetBottomEditorText).not.toHaveBeenCalled();
    });
  });
});
