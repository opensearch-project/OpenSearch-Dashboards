/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { EditorContext } from '../../../context';
import { useClearEditors } from './use_clear_editors';

describe('useClearEditors', () => {
  const mockSetTopEditorText = jest.fn();
  const mockSetBottomEditorText = jest.fn();

  const mockContextValue = {
    topEditorRef: { current: null },
    bottomEditorRef: { current: null },
    topEditorText: 'some top editor text',
    setTopEditorText: mockSetTopEditorText,
    bottomEditorText: 'some bottom editor text',
    setBottomEditorText: mockSetBottomEditorText,
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <EditorContext.Provider value={mockContextValue}>{children}</EditorContext.Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should clear both editors when called', () => {
    const { result } = renderHook(() => useClearEditors(), { wrapper });
    const clearEditors = result.current;

    clearEditors();

    expect(mockSetBottomEditorText).toHaveBeenCalledWith('');
    expect(mockSetTopEditorText).toHaveBeenCalledWith('');

    expect(mockSetBottomEditorText).toHaveBeenCalledTimes(1);
    expect(mockSetTopEditorText).toHaveBeenCalledTimes(1);
  });
});
