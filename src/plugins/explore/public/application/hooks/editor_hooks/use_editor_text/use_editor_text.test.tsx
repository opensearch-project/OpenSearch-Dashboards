/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { useEditorText } from './use_editor_text';
import { EditorContext, InternalEditorContextValue } from '../../../context';

describe('useEditorText', () => {
  const mockGetValue = jest.fn();

  const mockEditor = {
    getValue: mockGetValue,
  };

  const mockEditorRef: InternalEditorContextValue = {
    current: mockEditor as any,
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <EditorContext.Provider value={mockEditorRef}>{children}</EditorContext.Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a callback function to get editor text', () => {
    const { result } = renderHook(() => useEditorText(), { wrapper });

    expect(typeof result.current).toBe('function');
  });

  it('should return editor text from Monaco editor getValue() when callback is called', () => {
    mockGetValue.mockReturnValue('SELECT * FROM table');

    const { result } = renderHook(() => useEditorText(), { wrapper });
    const getText = result.current;

    expect(getText()).toBe('SELECT * FROM table');
    expect(mockGetValue).toHaveBeenCalledTimes(1);
  });

  it('should return updated text when Monaco editor value changes and callback is called', () => {
    mockGetValue.mockReturnValue('SELECT COUNT(*) FROM table');

    const { result } = renderHook(() => useEditorText(), { wrapper });
    const getText = result.current;

    expect(getText()).toBe('SELECT COUNT(*) FROM table');
    expect(mockGetValue).toHaveBeenCalledTimes(1);
  });

  it('should return empty string when editor is not available', () => {
    const mockEditorRefNull: InternalEditorContextValue = {
      current: null,
    };

    const wrapperWithNullEditor = ({ children }: { children: React.ReactNode }) => (
      <EditorContext.Provider value={mockEditorRefNull}>{children}</EditorContext.Provider>
    );

    const { result } = renderHook(() => useEditorText(), { wrapper: wrapperWithNullEditor });
    const getText = result.current;

    expect(getText()).toBe('');
  });
});
