/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { useEditorRef } from './use_editor_ref';
import { EditorContext, InternalEditorContextValue } from '../../../context';

describe('useEditorRef', () => {
  const mockEditorRef = {
    current: null as any,
  };

  const mockContextValue: InternalEditorContextValue = {
    editorRef: mockEditorRef,
    editorText: 'test text',
    setEditorText: jest.fn(),
    editorIsFocused: false,
    setEditorIsFocused: jest.fn(),
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <EditorContext.Provider value={mockContextValue}>{children}</EditorContext.Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return editor ref from context', () => {
    const { result } = renderHook(() => useEditorRef(), { wrapper });

    expect(result.current).toBe(mockEditorRef);
  });

  it('should return ref with null current when not set', () => {
    const { result } = renderHook(() => useEditorRef(), { wrapper });

    expect(result.current.current).toBeNull();
  });

  it('should return ref with actual editor when set', () => {
    const mockEditor = { focus: jest.fn() } as any;
    const contextWithEditor: InternalEditorContextValue = {
      ...mockContextValue,
      editorRef: { current: mockEditor },
    };

    const wrapperWithEditor = ({ children }: { children: React.ReactNode }) => (
      <EditorContext.Provider value={contextWithEditor}>{children}</EditorContext.Provider>
    );

    const { result } = renderHook(() => useEditorRef(), { wrapper: wrapperWithEditor });

    expect(result.current.current).toBe(mockEditor);
  });
});
