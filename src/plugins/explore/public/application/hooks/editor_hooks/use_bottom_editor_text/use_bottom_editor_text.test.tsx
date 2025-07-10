/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useBottomEditorText } from './use_bottom_editor_text';
import { EditorContext } from '../../../context';

describe('useBottomEditorText', () => {
  const createMockStore = () => {
    return configureStore({
      reducer: {
        root: (state = {}) => state,
      },
    });
  };

  const createWrapper = (
    bottomEditorText = 'test bottom text',
    bottomEditorRef = { current: null },
    setBottomEditorText = jest.fn()
  ) => {
    const store = createMockStore();
    const mockContextValue = {
      topEditorRef: { current: null },
      bottomEditorRef,
      topEditorText: 'test top text',
      setTopEditorText: jest.fn(),
      bottomEditorText,
      setBottomEditorText,
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

  it('should return bottom editor text', () => {
    const wrapper = createWrapper('bottom editor content');

    const { result } = renderHook(() => useBottomEditorText(), { wrapper });

    expect(result.current).toBe('bottom editor content');
  });
});
