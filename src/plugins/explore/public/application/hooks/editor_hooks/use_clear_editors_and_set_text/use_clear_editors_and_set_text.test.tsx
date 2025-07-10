/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { EditorContext, InternalEditorContextValue } from '../../../context';
import { useClearEditorsAndSetText } from './use_clear_editors_and_set_text';

describe('useClearEditorsAndSetText', () => {
  const mockSetTopEditorText = jest.fn();
  const mockSetBottomEditorText = jest.fn();

  const mockContextValue = ({
    setTopEditorText: mockSetTopEditorText,
    setBottomEditorText: mockSetBottomEditorText,
  } as unknown) as InternalEditorContextValue;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <EditorContext.Provider value={mockContextValue}>{children}</EditorContext.Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should clear bottom editor and set top editor text with string value', () => {
    const { result } = renderHook(() => useClearEditorsAndSetText(), { wrapper });
    const clearEditorsAndSetText = result.current;

    const testText = 'new query text';
    clearEditorsAndSetText(testText);

    expect(mockSetBottomEditorText).toHaveBeenCalledWith('');
    expect(mockSetTopEditorText).toHaveBeenCalledWith(testText);

    expect(mockSetBottomEditorText).toHaveBeenCalledTimes(1);
    expect(mockSetTopEditorText).toHaveBeenCalledTimes(1);
  });

  it('should clear bottom editor and set top editor text with callback function', () => {
    const { result } = renderHook(() => useClearEditorsAndSetText(), { wrapper });
    const clearEditorsAndSetText = result.current;

    const callbackFn = (prev: string) => `${prev} modified`;
    clearEditorsAndSetText(callbackFn);

    expect(mockSetBottomEditorText).toHaveBeenCalledWith('');
    expect(mockSetTopEditorText).toHaveBeenCalledWith(callbackFn);

    expect(mockSetBottomEditorText).toHaveBeenCalledTimes(1);
    expect(mockSetTopEditorText).toHaveBeenCalledTimes(1);
  });
});
