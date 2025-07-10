/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useEditorPromptText } from './use_editor_prompt_text';
import { EditorContext } from '../../../context';
import { EditorMode } from '../../../utils/state_management/types';

jest.mock('../../../utils/state_management/selectors', () => ({
  selectEditorMode: jest.fn(),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: (selector: any) => selector(),
}));

import { selectEditorMode } from '../../../utils/state_management/selectors';

const mockSelectEditorMode = selectEditorMode as jest.MockedFunction<typeof selectEditorMode>;

describe('useEditorPromptText', () => {
  const createMockStore = () => {
    return configureStore({
      reducer: {
        root: (state = {}) => state,
      },
    });
  };

  const createWrapper = (topEditorText: string = '') => {
    const store = createMockStore();
    const mockContextValue = {
      topEditorText,
      bottomEditorText: '',
      dataset: undefined,
    };

    return ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>
        <EditorContext.Provider value={mockContextValue as any}>{children}</EditorContext.Provider>
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty string when editor mode is SingleQuery', () => {
    mockSelectEditorMode.mockReturnValue(EditorMode.SingleQuery);
    const wrapper = createWrapper('test prompt text');

    const { result } = renderHook(() => useEditorPromptText(), { wrapper });

    expect(result.current).toBe('');
  });

  it('returns topEditorText when editor mode is DualQuery', () => {
    const promptText = 'SELECT * FROM logs WHERE level = "error"';
    mockSelectEditorMode.mockReturnValue(EditorMode.DualQuery);
    const wrapper = createWrapper(promptText);

    const { result } = renderHook(() => useEditorPromptText(), { wrapper });

    expect(result.current).toBe(promptText);
  });

  it('returns topEditorText when editor mode is DualPrompt', () => {
    const promptText = 'Show me all error logs from the last hour';
    mockSelectEditorMode.mockReturnValue(EditorMode.DualPrompt);
    const wrapper = createWrapper(promptText);

    const { result } = renderHook(() => useEditorPromptText(), { wrapper });

    expect(result.current).toBe(promptText);
  });

  it('returns empty topEditorText when no text is provided', () => {
    mockSelectEditorMode.mockReturnValue(EditorMode.DualQuery);
    const wrapper = createWrapper('');

    const { result } = renderHook(() => useEditorPromptText(), { wrapper });

    expect(result.current).toBe('');
  });

  it('updates result when editor mode changes', () => {
    const promptText = 'test prompt';
    mockSelectEditorMode.mockReturnValue(EditorMode.SingleQuery);
    const wrapper = createWrapper(promptText);

    const { result, rerender } = renderHook(() => useEditorPromptText(), { wrapper });

    expect(result.current).toBe('');

    mockSelectEditorMode.mockReturnValue(EditorMode.DualQuery);
    rerender();

    expect(result.current).toBe(promptText);
  });
});
