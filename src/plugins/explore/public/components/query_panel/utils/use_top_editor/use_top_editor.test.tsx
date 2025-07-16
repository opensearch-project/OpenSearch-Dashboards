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
  selectQueryLanguage: jest.fn(),
  selectTopEditorIsQueryMode: jest.fn(),
}));

jest.mock('../../../../application/context', () => ({
  useDatasetContext: jest.fn(),
}));

jest.mock('../use_shared_editor', () => ({
  useSharedEditor: jest.fn(),
}));

jest.mock('../editor_options', () => ({
  promptEditorOptions: { placeholder: 'Enter prompt...' },
  queryEditorOptions: { placeholder: 'Enter query...' },
}));

jest.mock('../../../../application/hooks', () => ({
  useEditorRefs: jest.fn(),
  useTopEditorText: jest.fn(),
}));

import { useSelector } from 'react-redux';
import { getEffectiveLanguageForAutoComplete } from '../../../../../../data/public';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import {
  selectQueryLanguage,
  selectTopEditorIsQueryMode,
} from '../../../../application/utils/state_management/selectors';
import { useDatasetContext } from '../../../../application/context';
import { useSharedEditor } from '../use_shared_editor';
import { useTopEditorText, useEditorRefs } from '../../../../application/hooks';

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
const mockGetEffectiveLanguageForAutoComplete = getEffectiveLanguageForAutoComplete as jest.MockedFunction<
  typeof getEffectiveLanguageForAutoComplete
>;
const mockUseOpenSearchDashboards = useOpenSearchDashboards as jest.MockedFunction<
  typeof useOpenSearchDashboards
>;
const mockuseDatasetContext = useDatasetContext as jest.MockedFunction<typeof useDatasetContext>;
const mockUseSharedEditor = useSharedEditor as jest.MockedFunction<typeof useSharedEditor>;
const mockUseTopEditorText = useTopEditorText as jest.MockedFunction<typeof useTopEditorText>;
const mockUseEditorRefs = useEditorRefs as jest.MockedFunction<typeof useEditorRefs>;

describe('useTopEditor', () => {
  let mockServices: any;
  let mockIndexPattern: any;
  let mockTopEditorRef: any;
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

    mockTopEditorRef = { current: null };

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
    mockuseDatasetContext.mockReturnValue({ indexPattern: mockIndexPattern } as any);
    mockUseSelector.mockImplementation((selector) => {
      if (selector === selectQueryLanguage) return 'SQL';
      if (selector === selectTopEditorIsQueryMode) return true;
      return undefined;
    });
    mockUseTopEditorText.mockReturnValue('SELECT * FROM logs');
    mockUseEditorRefs.mockReturnValue({
      topEditorRef: mockTopEditorRef,
      bottomEditorRef: { current: null },
    });
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
      triggerSuggestOnFocus: false,
      value: 'SELECT * FROM logs',
    });
  });

  it('should return correct editor configuration for prompt mode', () => {
    mockUseSelector.mockImplementation((selector) => {
      if (selector === selectQueryLanguage) return 'SQL';
      if (selector === selectTopEditorIsQueryMode) return false;
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

  it('should return correct editor configuration when not in query mode', () => {
    mockUseSelector.mockImplementation((selector) => {
      if (selector === selectQueryLanguage) return 'SQL';
      if (selector === selectTopEditorIsQueryMode) return false;
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

    expect(mockTopEditorRef.current).toBe(mockEditor);
  });

  it('should always set triggerSuggestOnFocus to false', () => {
    // Test query mode
    const { result: queryResult } = renderUseTopEditor();
    expect(queryResult.current.triggerSuggestOnFocus).toBe(false);

    // Test prompt mode
    mockUseSelector.mockImplementation((selector) => {
      if (selector === selectQueryLanguage) return 'SQL';
      if (selector === selectTopEditorIsQueryMode) return false;
      return undefined;
    });

    const { result: promptResult } = renderUseTopEditor();
    expect(promptResult.current.triggerSuggestOnFocus).toBe(false);

    // Test when not in query mode
    mockUseSelector.mockImplementation((selector) => {
      if (selector === selectQueryLanguage) return 'SQL';
      if (selector === selectTopEditorIsQueryMode) return false;
      return undefined;
    });

    const { result: nonQueryResult } = renderUseTopEditor();
    expect(nonQueryResult.current.triggerSuggestOnFocus).toBe(false);
  });

  describe('manual suggestion triggering', () => {
    it('should set up onDidFocusEditorWidget listener in query mode', () => {
      const mockOnDidFocusDisposable = { dispose: jest.fn() };
      const mockEditor = {
        onDidFocusEditorWidget: jest.fn().mockReturnValue(mockOnDidFocusDisposable),
        trigger: jest.fn(),
      };

      mockTopEditorRef.current = mockEditor;

      const { unmount } = renderUseTopEditor();

      expect(mockEditor.onDidFocusEditorWidget).toHaveBeenCalledWith(expect.any(Function));

      // Cleanup
      unmount();
      expect(mockOnDidFocusDisposable.dispose).toHaveBeenCalled();
    });

    it('should clean up focus listener when isQueryMode changes', () => {
      const mockOnDidFocusDisposable = { dispose: jest.fn() };
      const mockEditor = {
        onDidFocusEditorWidget: jest.fn().mockReturnValue(mockOnDidFocusDisposable),
        trigger: jest.fn(),
      };

      mockTopEditorRef.current = mockEditor;

      const { rerender } = renderUseTopEditor();

      // Verify listener is set up initially
      expect(mockEditor.onDidFocusEditorWidget).toHaveBeenCalled();

      // Change to non-query mode
      mockUseSelector.mockImplementation((selector) => {
        if (selector === selectQueryLanguage) return 'SQL';
        if (selector === selectTopEditorIsQueryMode) return false;
        return undefined;
      });

      rerender();

      // Should dispose previous listener
      expect(mockOnDidFocusDisposable.dispose).toHaveBeenCalled();
    });

    it('should trigger suggestions when editor is focused in query mode', () => {
      const mockEditor = {
        onDidFocusEditorWidget: jest.fn(),
        trigger: jest.fn(),
      };

      mockTopEditorRef.current = mockEditor;

      renderUseTopEditor();

      // Get the callback function passed to onDidFocusEditorWidget
      const focusCallback = mockEditor.onDidFocusEditorWidget.mock.calls[0][0];

      // Call the callback to simulate editor focus
      focusCallback();

      expect(mockEditor.trigger).toHaveBeenCalledWith(
        'keyboard',
        'editor.action.triggerSuggest',
        {}
      );
    });

    it('should not set up focus listener when not in query mode', () => {
      mockUseSelector.mockImplementation((selector) => {
        if (selector === selectQueryLanguage) return 'SQL';
        if (selector === selectTopEditorIsQueryMode) return false;
        return undefined;
      });

      const mockEditor = {
        onDidFocusEditorWidget: jest.fn(),
        trigger: jest.fn(),
      };

      mockTopEditorRef.current = mockEditor;

      renderUseTopEditor();

      expect(mockEditor.onDidFocusEditorWidget).not.toHaveBeenCalled();
    });

    it('should not set up focus listener when isQueryMode changes to false', () => {
      mockUseSelector.mockImplementation((selector) => {
        if (selector === selectQueryLanguage) return 'SQL';
        if (selector === selectTopEditorIsQueryMode) return false;
        return undefined;
      });

      const mockEditor = {
        onDidFocusEditorWidget: jest.fn(),
        trigger: jest.fn(),
      };

      mockTopEditorRef.current = mockEditor;

      renderUseTopEditor();

      expect(mockEditor.onDidFocusEditorWidget).not.toHaveBeenCalled();
    });
  });

  describe('query mode changes', () => {
    it('should respond to isQueryMode changes', () => {
      const { rerender } = renderUseTopEditor();

      // Change from query mode to prompt mode
      mockUseSelector.mockImplementation((selector) => {
        if (selector === selectQueryLanguage) return 'SQL';
        if (selector === selectTopEditorIsQueryMode) return false;
        return undefined;
      });

      rerender();

      // The selector should be called
      expect(mockUseSelector).toHaveBeenCalledWith(selectTopEditorIsQueryMode);
    });
  });
});
