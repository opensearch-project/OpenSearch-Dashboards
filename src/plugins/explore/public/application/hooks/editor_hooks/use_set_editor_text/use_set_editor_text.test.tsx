/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { useSetEditorText } from './use_set_editor_text';
import { EditorContext, InternalEditorContextValue } from '../../../context';

describe('useSetEditorText', () => {
  const mockSetEditorText = jest.fn();

  const mockContextValue: InternalEditorContextValue = {
    editorRef: { current: null },
    editorText: '',
    setEditorText: mockSetEditorText,
    editorIsFocused: false,
    setEditorIsFocused: jest.fn(),
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <EditorContext.Provider value={mockContextValue}>{children}</EditorContext.Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return setEditorText function from context', () => {
    const { result } = renderHook(() => useSetEditorText(), { wrapper });

    expect(result.current).toBe(mockSetEditorText);
  });

  it('should call setEditorText with provided text', () => {
    const { result } = renderHook(() => useSetEditorText(), { wrapper });

    const testText = 'SELECT * FROM logs WHERE level = "error"';
    result.current(testText);

    expect(mockSetEditorText).toHaveBeenCalledWith(testText);
    expect(mockSetEditorText).toHaveBeenCalledTimes(1);
  });

  it('should call setEditorText with function when provided', () => {
    const { result } = renderHook(() => useSetEditorText(), { wrapper });

    const textUpdater = (prevText: string) => `${prevText} ORDER BY timestamp`;
    result.current(textUpdater);

    expect(mockSetEditorText).toHaveBeenCalledWith(textUpdater);
    expect(mockSetEditorText).toHaveBeenCalledTimes(1);
  });
});
