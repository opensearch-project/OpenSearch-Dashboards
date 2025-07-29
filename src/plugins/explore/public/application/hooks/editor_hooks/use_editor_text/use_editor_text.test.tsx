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

  it('should return editor text from Monaco editor getValue()', () => {
    mockGetValue.mockReturnValue('SELECT * FROM table');

    const { result } = renderHook(() => useEditorText(), { wrapper });

    expect(result.current).toBe('SELECT * FROM table');
    expect(mockGetValue).toHaveBeenCalledTimes(1);
  });

  it('should return updated text when Monaco editor value changes', () => {
    mockGetValue.mockReturnValue('SELECT COUNT(*) FROM table');

    const { result } = renderHook(() => useEditorText(), { wrapper });

    expect(result.current).toBe('SELECT COUNT(*) FROM table');
    expect(mockGetValue).toHaveBeenCalledTimes(1);
  });
});
