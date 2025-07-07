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

jest.mock('../../../../application/context', () => ({
  useEditorContextByEditorComponent: jest.fn(),
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
import {
  InternalEditorContextValue,
  useEditorContextByEditorComponent,
} from '../../../../application/context';
import { useSharedEditor } from '../use_shared_editor';

const mockSelectQueryLanguage = selectQueryLanguage as jest.MockedFunction<
  typeof selectQueryLanguage
>;
const mockUseEditorContextByEditorComponent = useEditorContextByEditorComponent as jest.MockedFunction<
  typeof useEditorContextByEditorComponent
>;
const mockUseSharedEditor = useSharedEditor as jest.MockedFunction<typeof useSharedEditor>;

describe('useBottomEditor', () => {
  const mockBottomEditorRef = { current: null };
  const mockBottomEditorText = 'select all';
  const mockSharedProps = {
    isFocused: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseEditorContextByEditorComponent.mockReturnValue({
      bottomEditorRef: mockBottomEditorRef,
      bottomEditorText: mockBottomEditorText,
    } as InternalEditorContextValue);

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
      triggerSuggestOnFocus: false,
      value: mockBottomEditorText,
    });
  });

  it('should call useSelector with selectQueryLanguage', () => {
    renderUseBottomEditor();
    expect(mockSelectQueryLanguage).toHaveBeenCalled();
  });

  it('should call useEditorContextByEditorComponent', () => {
    renderUseBottomEditor();
    expect(mockUseEditorContextByEditorComponent).toHaveBeenCalled();
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

  it('should set triggerSuggestOnFocus to false', () => {
    const { result } = renderUseBottomEditor();
    expect(result.current.triggerSuggestOnFocus).toBe(false);
  });

  it('should use queryEditorOptions', () => {
    const { result } = renderUseBottomEditor();
    expect(result.current.options).toEqual({
      readOnly: false,
      fontSize: 14,
      wordWrap: 'on',
    });
  });
});
