/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useTopEditorText } from './use_top_editor_text';
import { EditorContext } from '../../../context';

describe('useTopEditorText', () => {
  const createMockStore = () => {
    return configureStore({
      reducer: {
        root: (state = {}) => state,
      },
    });
  };

  const createWrapper = (
    topEditorText = 'test top text',
    topEditorRef = { current: null },
    setTopEditorText = jest.fn()
  ) => {
    const store = createMockStore();
    const mockContextValue = {
      bottomEditorRef: { current: null },
      topEditorRef,
      bottomEditorText: 'test top text',
      setBottomEditorText: jest.fn(),
      topEditorText,
      setTopEditorText,
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

  it('should return top editor text', () => {
    const wrapper = createWrapper('top editor content');

    const { result } = renderHook(() => useTopEditorText(), { wrapper });

    expect(result.current).toBe('top editor content');
  });
});
