/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { useEditorText } from './use_editor_text';
import { EditorContext, InternalEditorContextValue } from '../../../context';

describe('useEditorText', () => {
  const mockEditorContextValue: InternalEditorContextValue = {
    editorRef: { current: null },
    editorText: 'SELECT * FROM table',
    setEditorText: jest.fn(),
    editorIsFocused: false,
    setEditorIsFocused: jest.fn(),
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <EditorContext.Provider value={mockEditorContextValue}>{children}</EditorContext.Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return editor text from context', () => {
    const { result } = renderHook(() => useEditorText(), { wrapper });

    expect(result.current).toBe('SELECT * FROM table');
  });

  it('should return updated editor text when context changes', () => {
    const updatedContextValue: InternalEditorContextValue = {
      ...mockEditorContextValue,
      editorText: 'SELECT COUNT(*) FROM table',
    };

    const updatedWrapper = ({ children }: { children: React.ReactNode }) => (
      <EditorContext.Provider value={updatedContextValue}>{children}</EditorContext.Provider>
    );

    const { result } = renderHook(() => useEditorText(), { wrapper: updatedWrapper });

    expect(result.current).toBe('SELECT COUNT(*) FROM table');
  });
});
