/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { RefObject } from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useEditorRefs } from './use_editor_refs';
import { EditorContext } from '../../../context';

describe('useEditorRefs', () => {
  const createMockStore = () => {
    return configureStore({
      reducer: {
        root: (state = {}) => state,
      },
    });
  };

  const createWrapper = (
    bottomEditorRef = { current: null } as RefObject<any>,
    topEditorRef = { current: null } as RefObject<any>
  ) => {
    const store = createMockStore();
    const mockContextValue = {
      bottomEditorRef,
      topEditorRef,
      bottomEditorText: 'test bottom text',
      setBottomEditorText: jest.fn(),
      topEditorText: 'test top text',
      setTopEditorText: jest.fn(),
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

  it('should return editor refs from context', () => {
    const mockBottomEditorRef = { current: document.createElement('div') };
    const mockTopEditorRef = { current: document.createElement('div') };
    const wrapper = createWrapper(mockBottomEditorRef, mockTopEditorRef);

    const { result } = renderHook(() => useEditorRefs(), { wrapper });

    expect(result.current.bottomEditorRef).toBe(mockBottomEditorRef);
    expect(result.current.topEditorRef).toBe(mockTopEditorRef);
  });

  it('should return null refs when not set', () => {
    const wrapper = createWrapper();

    const { result } = renderHook(() => useEditorRefs(), { wrapper });

    expect(result.current.bottomEditorRef).toEqual({ current: null });
    expect(result.current.topEditorRef).toEqual({ current: null });
  });
});
