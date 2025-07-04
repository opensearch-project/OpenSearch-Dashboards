/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { monaco } from '@osd/monaco';
import { useTopEditor } from './use_top_editor';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('@osd/monaco', () => ({
  monaco: {
    Range: jest.fn(),
    Position: jest.fn(),
    languages: {
      CompletionItemKind: {
        Function: 1,
        Keyword: 2,
        Text: 3,
      },
    },
  },
}));

jest.mock('../../../../../../data/public', () => ({
  getEffectiveLanguageForAutoComplete: jest.fn(),
}));

jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
}));

jest.mock('../../../../application/utils/state_management/selectors', () => ({
  selectEditorMode: jest.fn(),
  selectQueryLanguage: jest.fn(),
  selectPromptModeIsAvailable: jest.fn(),
}));

jest.mock('../../../../application/components/index_pattern_context', () => ({
  useIndexPatternContext: jest.fn(),
}));

jest.mock('../use_shared_editor', () => ({
  useSharedEditor: jest.fn(),
}));

jest.mock('../editor_options', () => ({
  promptEditorOptions: { placeholder: 'Enter prompt...' },
  queryEditorOptions: { placeholder: 'Enter query...' },
}));

jest.mock('../../../../application/context', () => ({
  useEditorContextByEditorComponent: jest.fn(),
}));

jest.mock('../../../../application/utils/state_management/types', () => ({
  EditorMode: {
    SingleQuery: 'single_query',
    Prompt: 'prompt',
  },
}));

import { useSelector } from 'react-redux';
import { getEffectiveLanguageForAutoComplete } from '../../../../../../data/public';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import {
  selectEditorMode,
  selectQueryLanguage,
  selectPromptModeIsAvailable,
} from '../../../../application/utils/state_management/selectors';
import { useIndexPatternContext } from '../../../../application/components/index_pattern_context';
import { useSharedEditor } from '../use_shared_editor';
import { useEditorContextByEditorComponent } from '../../../../application/context';
import { EditorMode } from '../../../../application/utils/state_management/types';

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
const mockGetEffectiveLanguageForAutoComplete = getEffectiveLanguageForAutoComplete as jest.MockedFunction<
  typeof getEffectiveLanguageForAutoComplete
>;
const mockUseOpenSearchDashboards = useOpenSearchDashboards as jest.MockedFunction<
  typeof useOpenSearchDashboards
>;
const mockUseIndexPatternContext = useIndexPatternContext as jest.MockedFunction<
  typeof useIndexPatternContext
>;
const mockUseSharedEditor = useSharedEditor as jest.MockedFunction<typeof useSharedEditor>;
const mockUseEditorContextByEditorComponent = useEditorContextByEditorComponent as jest.MockedFunction<
  typeof useEditorContextByEditorComponent
>;

describe('useTopEditor', () => {
  let mockServices: any;
  let mockIndexPattern: any;
  let mockEditorContext: any;
  let mockSharedEditorReturn: any;

  beforeEach(() => {
    mockServices = {
      data: {
        query: {
          queryString: {
            getQuery: jest.fn().mockReturnValue({
              dataset: { id: 'test-index', type: 'INDEX_PATTERN' },
            }),
          },
        },
        autocomplete: {
          getQuerySuggestions: jest.fn().mockResolvedValue([
            {
              text: 'SELECT',
              type: monaco.languages.CompletionItemKind.Keyword,
              detail: 'SQL keyword',
              sortText: '1',
            },
            {
              text: 'FROM',
              type: monaco.languages.CompletionItemKind.Keyword,
              detail: 'SQL keyword',
              sortText: '2',
            },
          ]),
        },
      },
      indexPatterns: {
        get: jest.fn().mockResolvedValue({ id: 'test-index', title: 'test-index' }),
      },
    };

    mockIndexPattern = { id: 'test-index', title: 'test-index' };

    mockEditorContext = {
      topEditorText: 'SELECT * FROM logs',
      topEditorRef: { current: null },
    };

    mockSharedEditorReturn = {
      isFocused: false,
      height: 32,
      suggestionProvider: {
        triggerCharacters: [' '],
        provideCompletionItems: jest.fn(),
      },
      useLatestTheme: true,
      editorDidMount: jest.fn(),
      onChange: jest.fn(),
      languageConfiguration: { autoClosingPairs: [] },
    };

    // Setup mocks
    mockUseOpenSearchDashboards.mockReturnValue({ services: mockServices } as any);
    mockUseIndexPatternContext.mockReturnValue({ indexPattern: mockIndexPattern } as any);
    mockUseSelector.mockImplementation((selector) => {
      if (selector === selectQueryLanguage) return 'SQL';
      if (selector === selectEditorMode) return EditorMode.SingleQuery;
      return undefined;
    });
    mockUseEditorContextByEditorComponent.mockReturnValue(mockEditorContext);
    mockUseSharedEditor.mockReturnValue(mockSharedEditorReturn);
    mockGetEffectiveLanguageForAutoComplete.mockReturnValue('SQL');

    // Setup Monaco mocks
    ((monaco.Range as unknown) as jest.Mock).mockImplementation(
      (lineNumber, startColumn, endLineNumber, endColumn) => ({
        startLineNumber: lineNumber,
        startColumn,
        endLineNumber,
        endColumn,
      })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderUseTopEditor = () => {
    const store = configureStore({
      reducer: () => ({}),
    });

    return renderHook(() => useTopEditor(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });
  };

  it('should return correct editor configuration for query mode', () => {
    const { result } = renderUseTopEditor();

    expect(result.current).toEqual({
      ...mockSharedEditorReturn,
      languageId: 'SQL',
      options: { placeholder: 'Enter query...' },
      triggerSuggestOnFocus: true,
      value: 'SELECT * FROM logs',
    });
  });

  it('should return correct editor configuration for prompt mode', () => {
    mockUseSelector.mockImplementation((selector) => {
      if (selector === selectQueryLanguage) return 'SQL';
      if (selector === selectEditorMode) return EditorMode.SinglePrompt;
      return undefined;
    });

    const { result } = renderUseTopEditor();

    expect(result.current).toEqual({
      ...mockSharedEditorReturn,
      languageId: 'SQL',
      options: { placeholder: 'Enter prompt...' },
      triggerSuggestOnFocus: false,
      value: 'SELECT * FROM logs',
    });
  });

  it('should call useSharedEditor with setEditorRef and editorPosition', () => {
    renderUseTopEditor();

    expect(mockUseSharedEditor).toHaveBeenCalledWith({
      setEditorRef: expect.any(Function),
      editorPosition: 'top',
    });
  });

  it('should call useSharedEditor with setEditorRef function', () => {
    renderUseTopEditor();

    const setEditorRefCall = mockUseSharedEditor.mock.calls[0][0].setEditorRef;
    const mockEditor = { id: 'test-editor' };

    act(() => {
      setEditorRefCall(mockEditor as any);
    });

    expect(mockEditorContext.topEditorRef.current).toBe(mockEditor);
  });

  it('should set triggerSuggestOnFocus based on editor mode', () => {
    // Test query mode (should trigger suggest on focus)
    mockUseSelector.mockImplementation((selector) => {
      if (selector === selectQueryLanguage) return 'SQL';
      if (selector === selectEditorMode) return EditorMode.SingleQuery;
      return undefined;
    });

    const { result: queryResult } = renderUseTopEditor();
    expect(queryResult.current.triggerSuggestOnFocus).toBe(true);

    // Test prompt mode (should not trigger suggest on focus)
    mockUseSelector.mockImplementation((selector) => {
      if (selector === selectQueryLanguage) return 'SQL';
      if (selector === selectEditorMode) return EditorMode.SinglePrompt;
      return undefined;
    });

    const { result: promptResult } = renderUseTopEditor();
    expect(promptResult.current.triggerSuggestOnFocus).toBe(false);
  });

  describe('editor mode changes', () => {
    it('should update editor mode ref when editor mode changes', () => {
      const { rerender } = renderUseTopEditor();

      // Change editor mode
      mockUseSelector.mockImplementation((selector) => {
        if (selector === selectQueryLanguage) return 'SQL';
        if (selector === selectEditorMode) return EditorMode.SinglePrompt;
        return undefined;
      });

      rerender();

      // The ref should be updated through useEffect
      expect(mockUseSelector).toHaveBeenCalledWith(selectEditorMode);
    });
  });
});
