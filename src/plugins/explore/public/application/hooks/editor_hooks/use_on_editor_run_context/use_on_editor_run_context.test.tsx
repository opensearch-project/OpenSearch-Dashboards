/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { useOnEditorRunContext } from './use_on_editor_run_context';
import { EditorContext, InternalEditorContextValue } from '../../../context';

// Mock the hook dependencies
jest.mock('../use_editor_prompt_text', () => ({
  useEditorPromptText: jest.fn(),
}));

jest.mock('../use_clear_editors_and_set_text', () => ({
  useClearEditorsAndSetText: jest.fn(),
}));

jest.mock('../use_editor_query_text', () => ({
  useEditorQueryText: jest.fn(),
}));

import { useEditorPromptText } from '../use_editor_prompt_text';
import { useClearEditorsAndSetText } from '../use_clear_editors_and_set_text';
import { useEditorQueryText } from '../use_editor_query_text';

const mockUseEditorPromptText = useEditorPromptText as jest.MockedFunction<
  typeof useEditorPromptText
>;
const mockUseClearEditorsAndSetText = useClearEditorsAndSetText as jest.MockedFunction<
  typeof useClearEditorsAndSetText
>;
const mockUseEditorQueryText = useEditorQueryText as jest.MockedFunction<typeof useEditorQueryText>;

describe('useOnEditorRunContext', () => {
  const mockSetBottomEditorText = jest.fn();
  const mockClearEditorsAndSetText = jest.fn();

  const createWrapper = () => {
    const mockContextValue: InternalEditorContextValue = {
      topEditorRef: { current: null },
      bottomEditorRef: { current: null },
      topEditorText: '',
      setTopEditorText: jest.fn(),
      bottomEditorText: '',
      setBottomEditorText: mockSetBottomEditorText,
    };

    return ({ children }: { children: React.ReactNode }) => (
      <EditorContext.Provider value={mockContextValue}>{children}</EditorContext.Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns setBottomEditorText, prompt, query, and clearEditorsAndSetText', () => {
    const testPrompt = 'test prompt text';
    const testQuery = 'SELECT * FROM logs';
    mockUseEditorPromptText.mockReturnValue(testPrompt);
    mockUseEditorQueryText.mockReturnValue(testQuery);
    mockUseClearEditorsAndSetText.mockReturnValue(mockClearEditorsAndSetText);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useOnEditorRunContext(), { wrapper });

    expect(result.current).toEqual({
      setBottomEditorText: mockSetBottomEditorText,
      prompt: testPrompt,
      query: testQuery,
      clearEditorsAndSetText: mockClearEditorsAndSetText,
    });
  });

  it('calls useEditorPromptText hook', () => {
    mockUseEditorPromptText.mockReturnValue('mock prompt');
    mockUseEditorQueryText.mockReturnValue('mock query');
    mockUseClearEditorsAndSetText.mockReturnValue(mockClearEditorsAndSetText);

    const wrapper = createWrapper();
    renderHook(() => useOnEditorRunContext(), { wrapper });

    expect(mockUseEditorPromptText).toHaveBeenCalled();
  });

  it('calls useEditorQueryText hook', () => {
    mockUseEditorPromptText.mockReturnValue('mock prompt');
    mockUseEditorQueryText.mockReturnValue('mock query');
    mockUseClearEditorsAndSetText.mockReturnValue(mockClearEditorsAndSetText);

    const wrapper = createWrapper();
    renderHook(() => useOnEditorRunContext(), { wrapper });

    expect(mockUseEditorQueryText).toHaveBeenCalled();
  });

  it('calls useClearEditorsAndSetText hook', () => {
    mockUseEditorPromptText.mockReturnValue('mock prompt');
    mockUseEditorQueryText.mockReturnValue('mock query');
    mockUseClearEditorsAndSetText.mockReturnValue(mockClearEditorsAndSetText);

    const wrapper = createWrapper();
    renderHook(() => useOnEditorRunContext(), { wrapper });

    expect(mockUseClearEditorsAndSetText).toHaveBeenCalled();
  });

  it('returns the prompt from useEditorPromptText', () => {
    const expectedPrompt = 'SELECT * FROM logs WHERE level = "error"';
    mockUseEditorPromptText.mockReturnValue(expectedPrompt);
    mockUseEditorQueryText.mockReturnValue('mock query');
    mockUseClearEditorsAndSetText.mockReturnValue(mockClearEditorsAndSetText);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useOnEditorRunContext(), { wrapper });

    expect(result.current.prompt).toBe(expectedPrompt);
  });

  it('returns the query from useEditorQueryText', () => {
    const expectedQuery = 'SELECT COUNT(*) FROM logs';
    mockUseEditorPromptText.mockReturnValue('mock prompt');
    mockUseEditorQueryText.mockReturnValue(expectedQuery);
    mockUseClearEditorsAndSetText.mockReturnValue(mockClearEditorsAndSetText);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useOnEditorRunContext(), { wrapper });

    expect(result.current.query).toBe(expectedQuery);
  });

  it('returns the clearEditorsAndSetText function from useClearEditorsAndSetText', () => {
    mockUseEditorPromptText.mockReturnValue('prompt');
    mockUseEditorQueryText.mockReturnValue('query');
    mockUseClearEditorsAndSetText.mockReturnValue(mockClearEditorsAndSetText);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useOnEditorRunContext(), { wrapper });

    expect(result.current.clearEditorsAndSetText).toBe(mockClearEditorsAndSetText);
  });

  it('returns setBottomEditorText from EditorContext', () => {
    mockUseEditorPromptText.mockReturnValue('prompt');
    mockUseEditorQueryText.mockReturnValue('query');
    mockUseClearEditorsAndSetText.mockReturnValue(mockClearEditorsAndSetText);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useOnEditorRunContext(), { wrapper });

    expect(result.current.setBottomEditorText).toBe(mockSetBottomEditorText);
  });
});
