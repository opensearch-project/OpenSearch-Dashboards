/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { useBottomEditor } from './use_bottom_editor';

jest.mock('../../../../application/utils/state_management/selectors', () => ({
  selectQueryLanguage: jest.fn(),
}));

jest.mock('../../../../application/hooks', () => ({
  useBottomEditorText: jest.fn(),
  useEditorRefs: jest.fn(),
}));

jest.mock('../use_shared_editor', () => ({
  useSharedEditor: jest.fn(),
}));

jest.mock('../editor_options', () => ({
  queryEditorOptions: {
    readOnly: false,
    fontSize: 14,
    wordWrap: 'on',
  },
}));

import { selectQueryLanguage } from '../../../../application/utils/state_management/selectors';

import { useSharedEditor } from '../use_shared_editor';
import { useBottomEditorText, useEditorRefs } from '../../../../application/hooks';

const mockSelectQueryLanguage = selectQueryLanguage as jest.MockedFunction<
  typeof selectQueryLanguage
>;
const mockUseBottomEditorText = useBottomEditorText as jest.MockedFunction<
  typeof useBottomEditorText
>;
const mockUseEditorRefs = useEditorRefs as jest.MockedFunction<typeof useEditorRefs>;
const mockUseSharedEditor = useSharedEditor as jest.MockedFunction<typeof useSharedEditor>;

describe('useBottomEditor', () => {
  const mockBottomEditorRef = { current: null };
  const mockBottomEditorText = 'select all';
  const mockSharedProps = {
    isFocused: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseBottomEditorText.mockReturnValue(mockBottomEditorText);
    mockUseEditorRefs.mockReturnValue({
      bottomEditorRef: mockBottomEditorRef,
      topEditorRef: { current: null },
    });

    mockUseSharedEditor.mockReturnValue(mockSharedProps as any);
  });

  const createMockStore = (queryLanguage = 'SQL') => {
    const mockState = {};
    const store = createStore(() => mockState);
    mockSelectQueryLanguage.mockReturnValue(queryLanguage);
    return store;
  };

  const renderUseBottomEditor = (queryLanguage = 'SQL') => {
    const store = createMockStore(queryLanguage);
    return renderHook(() => useBottomEditor(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });
  };

  it('should return correct editor configuration for PPL', () => {
    const { result } = renderUseBottomEditor('PPL');

    expect(result.current).toEqual({
      ...mockSharedProps,
      languageId: 'PPL',
      options: {
        readOnly: false,
        fontSize: 14,
        wordWrap: 'on',
      },
      triggerSuggestOnFocus: true,
      value: mockBottomEditorText,
    });
  });

  it('should call useSelector with selectQueryLanguage', () => {
    renderUseBottomEditor();
    expect(mockSelectQueryLanguage).toHaveBeenCalled();
  });

  it('should call useBottomEditorText and useEditorRefs', () => {
    renderUseBottomEditor();
    expect(mockUseBottomEditorText).toHaveBeenCalled();
    expect(mockUseEditorRefs).toHaveBeenCalled();
  });

  it('should call useSharedEditor with setEditorRef callback and editorPosition', () => {
    renderUseBottomEditor();

    expect(mockUseSharedEditor).toHaveBeenCalledWith({
      setEditorRef: expect.any(Function),
      editorPosition: 'bottom',
    });

    // Test the setEditorRef callback
    const setEditorRefCall = mockUseSharedEditor.mock.calls[0][0];
    const mockEditor = { dispose: jest.fn() } as any;

    setEditorRefCall.setEditorRef(mockEditor);
    expect(mockBottomEditorRef.current).toBe(mockEditor);
  });

  it('should set triggerSuggestOnFocus to true', () => {
    const { result } = renderUseBottomEditor();
    expect(result.current.triggerSuggestOnFocus).toBe(true);
  });

  it('should use queryEditorOptions', () => {
    const { result } = renderUseBottomEditor();
    expect(result.current.options).toEqual({
      readOnly: false,
      fontSize: 14,
      wordWrap: 'on',
    });
  });

  it('should return text value from useBottomEditorText', () => {
    const customText = 'custom query text';
    mockUseBottomEditorText.mockReturnValue(customText);

    const { result } = renderUseBottomEditor();
    expect(result.current.value).toBe(customText);
  });
});
