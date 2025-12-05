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
  const mockSetSelection = jest.fn();
  const mockSetPosition = jest.fn();
  const mockGetModel = jest.fn();
  const mockGetFullModelRange = jest.fn();
  const mockGetLineCount = jest.fn();
  const mockGetLineMaxColumn = jest.fn();

  const mockModel = {
    getFullModelRange: mockGetFullModelRange,
    getLineCount: mockGetLineCount,
    getLineMaxColumn: mockGetLineMaxColumn,
  };

  const mockEditor = {
    focus: mockFocus,
    setSelection: mockSetSelection,
    setPosition: mockSetPosition,
    getModel: mockGetModel,
  };

  const mockEditorRef: InternalEditorContextValue = {
    current: mockEditor as any,
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <EditorContext.Provider value={mockEditorRef}>{children}</EditorContext.Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockGetModel.mockReturnValue(mockModel);
    mockGetLineCount.mockReturnValue(5);
    mockGetLineMaxColumn.mockReturnValue(20);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return a focus function', () => {
    const { result } = renderHook(() => useEditorFocus(), { wrapper });

    expect(typeof result.current).toBe('function');
  });

  it('should focus editor and position cursor at end by default', () => {
    const { result } = renderHook(() => useEditorFocus(), { wrapper });

    act(() => {
      result.current();
    });

    // Fast-forward timer to trigger the setTimeout
    act(() => {
      jest.runAllTimers();
    });

    expect(mockFocus).toHaveBeenCalledTimes(1);
    expect(mockGetModel).toHaveBeenCalledTimes(1);
    expect(mockGetLineCount).toHaveBeenCalledTimes(1);
    expect(mockGetLineMaxColumn).toHaveBeenCalledWith(5);
    expect(mockSetPosition).toHaveBeenCalledWith({ lineNumber: 5, column: 20 });
    expect(mockSetSelection).not.toHaveBeenCalled();
  });

  it('should select all text when selectAll is true', () => {
    const mockRange = { startLineNumber: 1, startColumn: 1, endLineNumber: 5, endColumn: 20 };
    mockGetFullModelRange.mockReturnValue(mockRange);

    const { result } = renderHook(() => useEditorFocus(), { wrapper });

    act(() => {
      result.current(true);
    });

    // Fast-forward timer to trigger the setTimeout
    act(() => {
      jest.runAllTimers();
    });

    expect(mockFocus).toHaveBeenCalledTimes(1);
    expect(mockGetModel).toHaveBeenCalledTimes(1);
    expect(mockGetFullModelRange).toHaveBeenCalledTimes(1);
    expect(mockSetSelection).toHaveBeenCalledWith(mockRange);
    expect(mockSetPosition).not.toHaveBeenCalled();
  });

  it('should handle case when editor ref is null', () => {
    const nullRefContextValue: InternalEditorContextValue = {
      current: null,
    };

    const nullRefWrapper = ({ children }: { children: React.ReactNode }) => (
      <EditorContext.Provider value={nullRefContextValue}>{children}</EditorContext.Provider>
    );

    const { result } = renderHook(() => useEditorFocus(), { wrapper: nullRefWrapper });

    act(() => {
      result.current();
    });

    // Fast-forward timer
    act(() => {
      jest.runAllTimers();
    });

    // Should not throw error when ref is null
    expect(() => {
      jest.runAllTimers();
    }).not.toThrow();
  });

  it('should handle case when model is null', () => {
    mockGetModel.mockReturnValue(null);

    const { result } = renderHook(() => useEditorFocus(), { wrapper });

    act(() => {
      result.current();
    });

    // Fast-forward timer
    act(() => {
      jest.runAllTimers();
    });

    expect(mockFocus).toHaveBeenCalledTimes(1);
    expect(mockGetModel).toHaveBeenCalledTimes(1);
    expect(mockSetSelection).not.toHaveBeenCalled();
    expect(mockSetPosition).not.toHaveBeenCalled();
  });
});
