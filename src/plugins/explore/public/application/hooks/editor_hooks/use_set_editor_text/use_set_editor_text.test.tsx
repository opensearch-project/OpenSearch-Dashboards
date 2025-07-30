/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react-hooks';
import React from 'react';
import { useSetEditorText } from './use_set_editor_text';
import { EditorContext, InternalEditorContextValue } from '../../../context';

describe('useSetEditorText', () => {
  const mockGetValue = jest.fn();
  const mockSetValue = jest.fn();

  const mockEditor = {
    getValue: mockGetValue,
    setValue: mockSetValue,
  };

  const mockEditorRef: InternalEditorContextValue = {
    current: mockEditor as any,
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <EditorContext.Provider value={mockEditorRef}>{children}</EditorContext.Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetValue.mockReturnValue('');
  });

  it('should return a function to set editor text', () => {
    const { result } = renderHook(() => useSetEditorText(), { wrapper });

    expect(typeof result.current).toBe('function');
  });

  it('should call setValue with provided text', () => {
    const { result } = renderHook(() => useSetEditorText(), { wrapper });

    const testText = 'SELECT * FROM logs WHERE level = "error"';

    act(() => {
      result.current(testText);
    });

    expect(mockSetValue).toHaveBeenCalledWith(testText);
    expect(mockSetValue).toHaveBeenCalledTimes(1);
  });

  it('should handle function callback by getting current value and setting new value', () => {
    const currentText = 'SELECT * FROM logs';
    mockGetValue.mockReturnValue(currentText);

    const { result } = renderHook(() => useSetEditorText(), { wrapper });

    const textUpdater = (prevText: string) => `${prevText} ORDER BY timestamp`;

    act(() => {
      result.current(textUpdater);
    });

    expect(mockGetValue).toHaveBeenCalledTimes(1);
    expect(mockSetValue).toHaveBeenCalledWith('SELECT * FROM logs ORDER BY timestamp');
    expect(mockSetValue).toHaveBeenCalledTimes(1);
  });
});
