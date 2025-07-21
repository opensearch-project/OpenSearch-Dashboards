/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react-hooks';
import React from 'react';
import { EditorContext, InternalEditorContextValue } from '../../../context';
import { useEditorFocus } from './use_editor_focus';

describe('useEditorFocus', () => {
  const mockFocus = jest.fn();
  const mockSetEditorIsFocused = jest.fn();

  const mockEditorRef = {
    current: {
      focus: mockFocus,
    } as any,
  };

  const mockContextValue: InternalEditorContextValue = {
    editorRef: mockEditorRef,
    editorIsFocused: false,
    setEditorIsFocused: mockSetEditorIsFocused,
    editorText: '',
    setEditorText: jest.fn(),
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <EditorContext.Provider value={mockContextValue}>{children}</EditorContext.Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return editor focus state and functions', () => {
    const { result } = renderHook(() => useEditorFocus(), { wrapper });

    expect(result.current.editorIsFocused).toBe(false);
    expect(typeof result.current.focusOnEditor).toBe('function');
    expect(typeof result.current.setEditorIsFocused).toBe('function');
  });

  it('should reflect current editor focus state', () => {
    const focusedContextValue: InternalEditorContextValue = {
      ...mockContextValue,
      editorIsFocused: true,
    };

    const focusedWrapper = ({ children }: { children: React.ReactNode }) => (
      <EditorContext.Provider value={focusedContextValue}>{children}</EditorContext.Provider>
    );

    const { result } = renderHook(() => useEditorFocus(), { wrapper: focusedWrapper });

    expect(result.current.editorIsFocused).toBe(true);
  });

  it('should call setEditorIsFocused and focus editor when focusOnEditor is called', () => {
    const { result } = renderHook(() => useEditorFocus(), { wrapper });

    act(() => {
      result.current.focusOnEditor();
    });

    expect(mockSetEditorIsFocused).toHaveBeenCalledWith(true);
    expect(mockSetEditorIsFocused).toHaveBeenCalledTimes(1);

    // Fast-forward timer to trigger the setTimeout
    act(() => {
      jest.runAllTimers();
    });

    expect(mockFocus).toHaveBeenCalledTimes(1);
  });

  it('should handle case when editor ref is null', () => {
    const nullRefContextValue: InternalEditorContextValue = {
      ...mockContextValue,
      editorRef: { current: null },
    };

    const nullRefWrapper = ({ children }: { children: React.ReactNode }) => (
      <EditorContext.Provider value={nullRefContextValue}>{children}</EditorContext.Provider>
    );

    const { result } = renderHook(() => useEditorFocus(), { wrapper: nullRefWrapper });

    act(() => {
      result.current.focusOnEditor();
    });

    expect(mockSetEditorIsFocused).toHaveBeenCalledWith(true);

    // Fast-forward timer
    act(() => {
      jest.runAllTimers();
    });

    // Should not throw error when ref is null
    expect(() => {
      jest.runAllTimers();
    }).not.toThrow();
  });
});
