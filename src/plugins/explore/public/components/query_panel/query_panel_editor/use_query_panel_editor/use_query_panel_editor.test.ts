/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Mock all dependencies BEFORE any imports - targeting the specific problematic chain
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
  connect: jest.fn(() => (component: any) => component),
}));

// Mock the specific problematic opensearch_dashboards_react import
jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
  withOpenSearchDashboards: jest.fn((component) => component),
  CodeEditor: jest.fn(),
  EuiCodeEditor: jest.fn(),
}));

// Mock the hooks that import from opensearch_dashboards_react
jest.mock(
  '../../../../application/hooks/editor_hooks/use_change_query_editor/use_change_query_editor',
  () => ({
    useChangeQueryEditor: jest.fn(),
  })
);

jest.mock('../../../../application/hooks', () => ({
  useEditorRef: jest.fn(),
}));

jest.mock('../../../../application/context');
jest.mock('../../../../../../data/public');
jest.mock('../../../../application/utils/state_management/actions/query_editor');
jest.mock('../../../../application/utils/state_management/slices');
jest.mock('../../../../application/utils/state_management/selectors', () => ({
  selectIsPromptEditorMode: jest.fn((state) => state.isPromptEditorMode),
  selectPromptModeIsAvailable: jest.fn((state) => state.promptModeIsAvailable),
  selectQueryLanguage: jest.fn((state) => state.queryLanguage),
  selectQueryString: jest.fn((state) => state.queryString),
}));
jest.mock('../../../../application/utils/state_management/types', () => ({
  EditorMode: {
    Query: 'Query',
    Prompt: 'Prompt',
  },
  QueryExecutionStatus: {
    UNINITIALIZED: 'uninitialized',
    LOADING: 'loading',
    READY: 'ready',
    NO_RESULTS: 'none',
    ERROR: 'error',
  },
}));
jest.mock('./command_enter_action');
jest.mock('./shift_enter_action');
jest.mock('./tab_action');
jest.mock('./enter_action');
jest.mock('./spacebar_action');
jest.mock('./escape_action');
jest.mock('./use_prompt_is_typing', () => ({
  usePromptIsTyping: jest.fn(),
}));
jest.mock('./editor_options', () => ({
  queryEditorOptions: { readOnly: false },
  promptEditorOptions: { readOnly: false },
}));

// Mock Monaco editor
jest.mock('@osd/monaco', () => ({
  monaco: {
    KeyCode: {
      Enter: 3,
      Escape: 9,
      Space: 10,
      Tab: 2,
    },
    languages: {
      registerCompletionItemProvider: jest.fn(() => ({ dispose: jest.fn() })),
      CompletionItemKind: {
        Keyword: 1,
      },
    },
    Range: jest.fn(),
  },
}));

// Now import after mocking
import { act } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { useSelector, useDispatch } from 'react-redux';
import { monaco } from '@osd/monaco';
import { useQueryPanelEditor } from './use_query_panel_editor';
import { useEditorRef } from '../../../../application/hooks';
import { useDatasetContext } from '../../../../application/context';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { getEffectiveLanguageForAutoComplete } from '../../../../../../data/public';
import { onEditorRunActionCreator } from '../../../../application/utils/state_management/actions/query_editor';
import { setEditorMode } from '../../../../application/utils/state_management/slices';
import { EditorMode } from '../../../../application/utils/state_management/types';
import { usePromptIsTyping } from './use_prompt_is_typing';
import {
  selectIsPromptEditorMode,
  selectPromptModeIsAvailable,
  selectQueryLanguage,
  selectQueryString,
  selectIsQueryEditorDirty,
} from '../../../../application/utils/state_management/selectors';

const mockUseSelector = jest.mocked(useSelector);
const mockUseDispatch = jest.mocked(useDispatch);
const mockUseEditorRef = jest.mocked(useEditorRef);
const mockUseDatasetContext = jest.mocked(useDatasetContext);
const mockUseOpenSearchDashboards = jest.mocked(useOpenSearchDashboards);
const mockGetEffectiveLanguageForAutoComplete = jest.mocked(getEffectiveLanguageForAutoComplete);
const mockUsePromptIsTyping = jest.mocked(usePromptIsTyping);

describe('useQueryPanelEditor', () => {
  let mockDispatch: jest.Mock;
  let mockEditor: any;
  let mockServices: any;
  let mockDataset: any;
  let mockEditorRef: any;
  let mockHandleChangeForPromptIsTyping: jest.Mock;

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockHandleChangeForPromptIsTyping = jest.fn();
    mockEditorRef = { current: null };

    mockEditor = {
      onDidFocusEditorText: jest.fn(() => ({ dispose: jest.fn() })),
      onDidBlurEditorText: jest.fn(() => ({ dispose: jest.fn() })),
      onDidFocusEditorWidget: jest.fn(() => ({ dispose: jest.fn() })),
      onDidContentSizeChange: jest.fn(),
      addAction: jest.fn(),
      trigger: jest.fn(),
      focus: jest.fn(),
      getContentHeight: jest.fn(() => 50),
      getLayoutInfo: jest.fn(() => ({ width: 800 })),
      layout: jest.fn(),
      updateOptions: jest.fn(),
      getOffsetAt: jest.fn(() => 10),
      getValue: jest.fn(() => 'test query'),
      getWordUntilPosition: jest.fn(() => ({ startColumn: 1, endColumn: 5 })),
      getModel: jest.fn(() => ({ getLineCount: jest.fn() })),
      revealLine: jest.fn(),
      getPosition: jest.fn(() => ({ lineNumber: 1 })),
      getVisibleRanges: jest.fn(() => [{ startLineNumber: 1, endLineNumber: 10 }]),
    };

    mockDataset = {
      id: 'test-dataset',
      title: 'Test Dataset',
    };

    mockServices = {
      data: {
        query: {
          queryString: {
            getQuery: jest.fn(() => ({ dataset: { id: 'test-id', type: 'INDEX_PATTERN' } })),
          },
        },
        autocomplete: {
          getQuerySuggestions: jest.fn(() =>
            Promise.resolve([
              {
                text: 'SELECT',
                type: monaco.languages.CompletionItemKind.Keyword,
                detail: 'SQL keyword',
              },
            ])
          ),
          getTriggerCharacters: jest.fn(() => []),
        },
      },
      datasets: {
        get: jest.fn(() => Promise.resolve(mockDataset)),
      },
    };

    // Mock implementations
    mockUseDispatch.mockReturnValue(mockDispatch);
    mockUseEditorRef.mockReturnValue(mockEditorRef);
    mockUseDatasetContext.mockReturnValue({
      dataset: mockDataset,
      isLoading: false,
      error: null,
    });
    mockUseOpenSearchDashboards.mockReturnValue({
      services: mockServices,
      overlays: {
        openFlyout: jest.fn(),
        openModal: jest.fn(),
        sidecar: jest.fn(),
      },
      notifications: {
        toasts: {
          show: jest.fn(),
          success: jest.fn(),
          warning: jest.fn(),
          danger: jest.fn(),
        },
      },
    });
    mockGetEffectiveLanguageForAutoComplete.mockReturnValue('PPL');
    mockUsePromptIsTyping.mockReturnValue({
      promptIsTyping: false,
      handleChangeForPromptIsTyping: mockHandleChangeForPromptIsTyping,
    });

    // Default selector values
    mockUseSelector.mockImplementation((selector) => {
      if (!selector) return '';
      const selectorString = selector.toString();
      if (selectorString.includes('selectPromptModeIsAvailable')) return false;
      if (selectorString.includes('selectQueryLanguage')) return 'PPL';
      if (selectorString.includes('selectIsPromptEditorMode')) return false;
      if (selectorString.includes('selectQueryString')) return '';
      if (selectorString.includes('selectIsQueryEditorDirty')) return false;
      return '';
    });

    // Mock action creators
    jest.doMock('./command_enter_action', () => ({
      getCommandEnterAction: jest.fn(() => ({
        id: 'command-enter',
        run: jest.fn(),
      })),
    }));
    jest.doMock('./shift_enter_action', () => ({
      getShiftEnterAction: jest.fn(() => ({
        id: 'shift-enter',
        run: jest.fn(),
      })),
    }));
    jest.doMock('./tab_action', () => ({
      getTabAction: jest.fn(() => ({ id: 'tab', run: jest.fn() })),
    }));
    jest.doMock('./enter_action', () => ({
      getEnterAction: jest.fn(() => ({ id: 'enter', run: jest.fn() })),
    }));
    jest.doMock('./spacebar_action', () => ({
      getSpacebarAction: jest.fn(() => ({
        id: 'spacebar',
        run: jest.fn(),
      })),
    }));
    jest.doMock('./escape_action', () => ({
      getEscapeAction: jest.fn(() => ({
        id: 'escape',
        run: jest.fn(),
      })),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('basic hook behavior', () => {
    it('should return query editor options when in query mode', () => {
      mockUseSelector.mockImplementation((selector: any) => {
        if (!selector) return '';
        const selectorString = selector.toString();
        if (selectorString.includes('selectIsPromptEditorMode')) return false;
        if (selectorString.includes('selectPromptModeIsAvailable')) return false;
        if (selectorString.includes('selectQueryLanguage')) return 'PPL';
        if (selectorString.includes('selectQueryString')) return '';
        if (selectorString.includes('selectIsQueryEditorDirty')) return false;
        return '';
      });

      const { result } = renderHook(() => useQueryPanelEditor());

      expect(result.current.options).toBeDefined();
    });
  });

  describe('placeholder text', () => {
    it('should return disabled prompt placeholder when prompt mode is not available', () => {
      mockUseSelector.mockImplementation((selector: any) => {
        if (selector === selectPromptModeIsAvailable) return false;
        if (selector === selectIsPromptEditorMode) return false;
        if (selector === selectQueryLanguage) return 'PPL';
        if (selector === selectQueryString) return '';
        if (selector === selectIsQueryEditorDirty) return false;
        return '';
      });

      const { result } = renderHook(() => useQueryPanelEditor());

      expect(result.current.placeholder).toContain('PPL');
    });
  });

  describe('showPlaceholder logic', () => {
    it('should show placeholder when text is empty', () => {
      const { result } = renderHook(() => useQueryPanelEditor());

      expect(result.current.showPlaceholder).toBe(true);
    });

    it('should not show placeholder when text is present', () => {
      const { result } = renderHook(() => useQueryPanelEditor());

      // Add text to local state through onChange
      act(() => {
        result.current.onChange('some text');
      });

      // The text should now be 'some text' from local state
      expect(result.current.value).toBe('some text');

      // Since text is present, showPlaceholder should be false
      expect(result.current.showPlaceholder).toBe(false);
    });
  });

  describe('onChange handler', () => {
    it('should update local text state when onChange is called', () => {
      const { result } = renderHook(() => useQueryPanelEditor());

      // Initial value should be empty (from selector)
      expect(result.current.value).toBe('');

      act(() => {
        result.current.onChange('new text');
      });

      // Value should be updated in local state
      expect(result.current.value).toBe('new text');
    });

    it('should call handleChangeForPromptIsTyping when in prompt mode', () => {
      // Create a fresh mock for this test
      const localMockHandleChangeForPromptIsTyping = jest.fn();

      mockUsePromptIsTyping.mockReturnValue({
        promptIsTyping: false,
        handleChangeForPromptIsTyping: localMockHandleChangeForPromptIsTyping,
      });

      mockUseSelector.mockImplementation((selector: any) => {
        if (selector === selectIsPromptEditorMode) return true;
        if (selector === selectPromptModeIsAvailable) return false;
        if (selector === selectQueryLanguage) return 'PPL';
        if (!selector) return '';
        const selectorString = selector.toString();
        if (selectorString.includes('selectQueryString')) return '';
        if (selectorString.includes('selectIsQueryEditorDirty')) return false;
        return '';
      });

      const { result } = renderHook(() => useQueryPanelEditor());

      // First, let's verify that isPromptMode is correctly set
      expect(result.current.isPromptMode).toBe(true);

      act(() => {
        result.current.onChange('new text');
      });

      expect(result.current.value).toBe('new text');
      expect(localMockHandleChangeForPromptIsTyping).toHaveBeenCalledTimes(1);
    });

    it('should not call handleChangeForPromptIsTyping when not in prompt mode', () => {
      mockUseSelector.mockImplementation((selector: any) => {
        if (!selector) return '';
        const selectorString = selector.toString();
        if (selectorString.includes('selectIsPromptEditorMode')) return false;
        if (selectorString.includes('selectPromptModeIsAvailable')) return false;
        if (selectorString.includes('selectQueryLanguage')) return 'PPL';
        if (selectorString.includes('selectQueryString')) return '';
        if (selectorString.includes('selectIsQueryEditorDirty')) return false;
        return '';
      });

      const { result } = renderHook(() => useQueryPanelEditor());

      act(() => {
        result.current.onChange('new text');
      });

      expect(result.current.value).toBe('new text');
      expect(mockHandleChangeForPromptIsTyping).not.toHaveBeenCalled();
    });
  });

  describe('onEditorClick handler', () => {
    it('should focus the editor when clicked', () => {
      mockEditorRef.current = mockEditor;

      const { result } = renderHook(() => useQueryPanelEditor());

      act(() => {
        result.current.onEditorClick();
      });

      expect(mockEditor.focus).toHaveBeenCalled();
    });

    it('should not throw when editor ref is null', () => {
      mockEditorRef.current = null;

      const { result } = renderHook(() => useQueryPanelEditor());

      expect(() => {
        act(() => {
          result.current.onEditorClick();
        });
      }).not.toThrow();
    });
  });

  describe('editorDidMount', () => {
    it('should set up editor with all actions and event listeners', () => {
      const { result } = renderHook(() => useQueryPanelEditor());

      act(() => {
        const cleanup = result.current.editorDidMount(mockEditor);
        expect(typeof cleanup).toBe('function');
      });

      expect(mockEditor.onDidFocusEditorText).toHaveBeenCalled();
      expect(mockEditor.onDidBlurEditorText).toHaveBeenCalled();
      expect(mockEditor.onDidContentSizeChange).toHaveBeenCalled();
      expect(mockEditor.addAction).toHaveBeenCalledTimes(6); // All 6 actions added
    });

    it('should handle content size changes correctly', () => {
      mockEditor.getContentHeight.mockReturnValue(150); // Exceeds max height

      const { result } = renderHook(() => useQueryPanelEditor());

      act(() => {
        result.current.editorDidMount(mockEditor);
      });

      // Trigger content size change
      const contentSizeChangeCallback = mockEditor.onDidContentSizeChange.mock.calls[0][0];
      act(() => {
        contentSizeChangeCallback();
      });

      expect(mockEditor.layout).toHaveBeenCalledWith({
        width: 800,
        height: 100, // Capped at maxHeight
      });
      expect(mockEditor.updateOptions).toHaveBeenCalledWith({
        scrollBeyondLastLine: false,
        scrollbar: {
          vertical: 'visible', // Visible because content height > max height
        },
      });
    });

    it('should dispose event listeners on cleanup', () => {
      const mockFocusDisposable = { dispose: jest.fn() };
      const mockBlurDisposable = { dispose: jest.fn() };

      mockEditor.onDidFocusEditorText.mockReturnValue(mockFocusDisposable);
      mockEditor.onDidBlurEditorText.mockReturnValue(mockBlurDisposable);

      const { result } = renderHook(() => useQueryPanelEditor());

      let cleanup: any;
      act(() => {
        cleanup = result.current.editorDidMount(mockEditor);
      });

      act(() => {
        cleanup();
      });

      expect(mockFocusDisposable.dispose).toHaveBeenCalled();
      expect(mockBlurDisposable.dispose).toHaveBeenCalled();
    });
  });

  describe('autocomplete functionality', () => {
    beforeEach(() => {
      // Mock Monaco's Range constructor
      (global as any).monaco = {
        ...(global as any).monaco,
        Range: jest
          .fn()
          .mockImplementation((startLine: any, startCol: any, endLine: any, endCol: any) => ({
            startLineNumber: startLine,
            startColumn: startCol,
            endLineNumber: endLine,
            endColumn: endCol,
          })),
      };
    });

    it('should trigger autosuggestion on focus when in query mode with text', () => {
      // Set up hook with text in local state
      const { result } = renderHook(() => useQueryPanelEditor());

      // Add text to local state
      act(() => {
        result.current.onChange('SELECT *');
      });

      mockUseSelector.mockImplementation((selector: any) => {
        const selectorString = selector.toString();
        if (selectorString.includes('selectIsPromptEditorMode')) return false;
        if (selectorString.includes('selectPromptModeIsAvailable')) return false;
        if (selectorString.includes('selectQueryLanguage')) return 'PPL';
        if (selectorString.includes('selectQueryString')) return '';
        return '';
      });

      const mockOnDidFocusDisposable = { dispose: jest.fn() };
      mockEditor.onDidFocusEditorWidget.mockReturnValue(mockOnDidFocusDisposable);
      mockEditorRef.current = mockEditor;

      // Re-render hook to apply new selector values and trigger useEffect
      renderHook(() => useQueryPanelEditor());

      // Check that focus event was set up
      expect(mockEditor.onDidFocusEditorWidget).toHaveBeenCalled();

      // Simulate focus event
      const focusCallback = mockEditor.onDidFocusEditorWidget.mock.calls[0][0];
      act(() => {
        focusCallback();
      });

      expect(mockEditor.trigger).toHaveBeenCalledWith(
        'keyboard',
        'editor.action.triggerSuggest',
        {}
      );
    });

    it('should not trigger autosuggestion when text is empty', () => {
      mockUseSelector.mockImplementation((selector: any) => {
        const selectorString = selector.toString();
        if (selectorString.includes('selectIsPromptEditorMode')) return false;
        if (selectorString.includes('selectQueryString')) return '';
        return false;
      });
      mockEditorRef.current = mockEditor;

      renderHook(() => useQueryPanelEditor());

      // Should not set up focus event listener when text is empty
      expect(mockEditor.onDidFocusEditorWidget).not.toHaveBeenCalled();
    });
  });

  describe('handleRun and handleEscape', () => {
    it('should dispatch onEditorRunActionCreator when handleRun is called', () => {
      const { result } = renderHook(() => useQueryPanelEditor());

      // Set text in local state
      act(() => {
        result.current.onChange('test query');
      });

      // Get handleRun from editorDidMount actions
      act(() => {
        result.current.editorDidMount(mockEditor);
      });

      // Find the command+enter action and call its handler
      const commandEnterModule = jest.requireMock('./command_enter_action');
      const handleRunCall = commandEnterModule.getCommandEnterAction.mock.calls[0][0];

      act(() => {
        handleRunCall();
      });

      expect(mockDispatch).toHaveBeenCalledWith(
        onEditorRunActionCreator(mockServices, 'test query')
      );
    });

    it('should not clear local text and set query mode when handleEscape is called', () => {
      const { result } = renderHook(() => useQueryPanelEditor());

      // Set some text first
      act(() => {
        result.current.onChange('some text');
      });

      expect(result.current.value).toBe('some text');

      act(() => {
        result.current.editorDidMount(mockEditor);
      });

      // Find the escape action and call its handler
      const escapeModule = jest.requireMock('./escape_action');
      const handleEscapeCall = escapeModule.getEscapeAction.mock.calls[0][1];

      act(() => {
        handleEscapeCall();
      });

      // Text should be cleared
      expect(result.current.value).toBe('some text');
      expect(mockDispatch).toHaveBeenCalledWith(setEditorMode(EditorMode.Query));
    });
  });

  describe('prompt typing integration', () => {
    it('should return promptIsTyping value from usePromptIsTyping hook', () => {
      mockUsePromptIsTyping.mockReturnValue({
        promptIsTyping: true,
        handleChangeForPromptIsTyping: mockHandleChangeForPromptIsTyping,
      });

      const { result } = renderHook(() => useQueryPanelEditor());

      expect(result.current.promptIsTyping).toBe(true);
    });

    it('should return false for promptIsTyping when not typing', () => {
      mockUsePromptIsTyping.mockReturnValue({
        promptIsTyping: false,
        handleChangeForPromptIsTyping: mockHandleChangeForPromptIsTyping,
      });

      const { result } = renderHook(() => useQueryPanelEditor());

      expect(result.current.promptIsTyping).toBe(false);
    });
  });

  describe('PPL language switching', () => {
    it('should return PPL languageId when in query mode', () => {
      mockUseSelector.mockImplementation((selector: any) => {
        if (selector === selectIsPromptEditorMode) return false;
        if (selector === selectQueryLanguage) return 'PPL';
        if (selector === selectPromptModeIsAvailable) return true;
        if (selector === selectQueryString) return '';
        if (selector === selectIsQueryEditorDirty) return false;
        return '';
      });

      const { result } = renderHook(() => useQueryPanelEditor());

      expect(result.current.languageId).toBe('PPL');
      expect(result.current.isPromptMode).toBe(false);
    });

    it('should return plaintext languageId when in AI/prompt mode', () => {
      mockUseSelector.mockImplementation((selector: any) => {
        if (selector === selectIsPromptEditorMode) return true;
        if (selector === selectQueryLanguage) return 'PPL';
        if (selector === selectPromptModeIsAvailable) return true;
        if (selector === selectQueryString) return '';
        if (selector === selectIsQueryEditorDirty) return false;
        return '';
      });

      const { result } = renderHook(() => useQueryPanelEditor());

      expect(result.current.languageId).toBe('AI');
      expect(result.current.isPromptMode).toBe(true);
    });
  });

  describe('provideCompletionItems parameter passing', () => {
    beforeEach(() => {
      mockServices.data.autocomplete.getQuerySuggestions = jest.fn().mockResolvedValue([
        {
          text: 'suggestion',
          detail: 'test suggestion',
        },
      ]);
      mockServices.data.dataViews = {
        get: jest.fn().mockResolvedValue({ id: 'test-dataset' }),
      };
    });

    it('should call getQuerySuggestions with baseLanguage=PPL and language=AI in AI mode', async () => {
      mockUseSelector.mockImplementation((selector: any) => {
        if (selector === selectIsPromptEditorMode) return true;
        if (selector === selectQueryLanguage) return 'PPL';
        if (selector === selectPromptModeIsAvailable) return true;
        if (selector === selectQueryString) return '';
        if (selector === selectIsQueryEditorDirty) return false;
        return '';
      });

      mockGetEffectiveLanguageForAutoComplete.mockReturnValue('AI');

      const { result } = renderHook(() => useQueryPanelEditor());

      // Mock objects for completion call
      const mockModel = {
        getValue: () => 'show me logs',
        getOffsetAt: () => 10,
        getWordUntilPosition: () => ({ startColumn: 1, endColumn: 5 }),
      } as any;
      const mockPosition = { lineNumber: 1, column: 10 } as any;

      // Call the completion provider directly
      await act(async () => {
        await result.current.suggestionProvider.provideCompletionItems(
          mockModel,
          mockPosition,
          {},
          { isCancellationRequested: false }
        );
      });

      // Verify that getQuerySuggestions was called with correct parameters
      expect(mockServices.data.autocomplete.getQuerySuggestions).toHaveBeenCalledWith(
        expect.objectContaining({
          language: 'AI', // effectiveLanguage for AI mode
          baseLanguage: 'PPL', // original queryLanguage passed as baseLanguage
          query: 'show me logs',
        })
      );
    });

    it('should call getQuerySuggestions with baseLanguage=PPL and language=PPL_Simplified in PPL mode', async () => {
      mockUseSelector.mockImplementation((selector: any) => {
        if (selector === selectIsPromptEditorMode) return false;
        if (selector === selectQueryLanguage) return 'PPL';
        if (selector === selectPromptModeIsAvailable) return true;
        if (selector === selectQueryString) return '';
        if (selector === selectIsQueryEditorDirty) return false;
        return '';
      });

      mockGetEffectiveLanguageForAutoComplete.mockReturnValue('PPL_Simplified');

      const { result } = renderHook(() => useQueryPanelEditor());

      // Mock objects for completion call
      const mockModel = {
        getValue: () => 'search source=logs',
        getOffsetAt: () => 15,
        getWordUntilPosition: () => ({ startColumn: 1, endColumn: 7 }),
      } as any;
      const mockPosition = { lineNumber: 1, column: 15 } as any;

      // Call the completion provider directly
      await act(async () => {
        await result.current.suggestionProvider.provideCompletionItems(
          mockModel,
          mockPosition,
          {},
          { isCancellationRequested: false }
        );
      });

      // Verify that getQuerySuggestions was called with correct parameters
      expect(mockServices.data.autocomplete.getQuerySuggestions).toHaveBeenCalledWith(
        expect.objectContaining({
          language: 'PPL_Simplified', // effectiveLanguage (transformed by getEffectiveLanguageForAutoComplete)
          baseLanguage: 'PPL', // original queryLanguage passed as baseLanguage
          query: 'search source=logs',
        })
      );
    });
  });

  describe('auto-scroll behavior', () => {
    it('should reveal cursor line when it is outside visible range', () => {
      mockEditor.getContentHeight.mockReturnValue(150);
      mockEditor.getPosition.mockReturnValue({ lineNumber: 25 });
      mockEditor.getVisibleRanges.mockReturnValue([{ startLineNumber: 10, endLineNumber: 20 }]);
      mockEditor.getModel.mockReturnValue({ getLineCount: () => 30 });

      const { result } = renderHook(() => useQueryPanelEditor());

      act(() => {
        result.current.editorDidMount(mockEditor);
      });

      const contentSizeChangeCallback = mockEditor.onDidContentSizeChange.mock.calls[0][0];
      act(() => {
        contentSizeChangeCallback();
      });

      // Cursor at line 25 is outside visible range (10-20), so should reveal
      expect(mockEditor.revealLine).toHaveBeenCalledWith(25);
    });

    it('should not reveal cursor line when it is within visible range', () => {
      mockEditor.getContentHeight.mockReturnValue(150);
      mockEditor.getPosition.mockReturnValue({ lineNumber: 15 });
      mockEditor.getVisibleRanges.mockReturnValue([{ startLineNumber: 10, endLineNumber: 20 }]);
      mockEditor.getModel.mockReturnValue({ getLineCount: () => 30 });

      const { result } = renderHook(() => useQueryPanelEditor());

      act(() => {
        result.current.editorDidMount(mockEditor);
      });

      const contentSizeChangeCallback = mockEditor.onDidContentSizeChange.mock.calls[0][0];
      act(() => {
        contentSizeChangeCallback();
      });

      // Cursor at line 15 is within visible range (10-20), so should NOT reveal
      expect(mockEditor.revealLine).not.toHaveBeenCalled();
    });

    it('should not auto-scroll when content height is within max height', () => {
      mockEditor.getContentHeight.mockReturnValue(50);
      mockEditor.getPosition.mockReturnValue({ lineNumber: 5 });
      mockEditor.getVisibleRanges.mockReturnValue([{ startLineNumber: 1, endLineNumber: 3 }]);

      const { result } = renderHook(() => useQueryPanelEditor());

      act(() => {
        result.current.editorDidMount(mockEditor);
      });

      const contentSizeChangeCallback = mockEditor.onDidContentSizeChange.mock.calls[0][0];
      act(() => {
        contentSizeChangeCallback();
      });

      // Content fits within max height, no scrolling needed
      expect(mockEditor.revealLine).not.toHaveBeenCalled();
    });

    it('should reveal cursor line when typing below visible range', () => {
      mockEditor.getContentHeight.mockReturnValue(200);
      mockEditor.getPosition.mockReturnValue({ lineNumber: 30 }); // Cursor at bottom
      mockEditor.getVisibleRanges.mockReturnValue([{ startLineNumber: 1, endLineNumber: 10 }]);
      mockEditor.getModel.mockReturnValue({ getLineCount: () => 30 });

      const { result } = renderHook(() => useQueryPanelEditor());

      act(() => {
        result.current.editorDidMount(mockEditor);
      });

      const contentSizeChangeCallback = mockEditor.onDidContentSizeChange.mock.calls[0][0];
      act(() => {
        contentSizeChangeCallback();
      });

      // Cursor at line 30 is below visible range (1-10), should reveal
      expect(mockEditor.revealLine).toHaveBeenCalledWith(30);
    });

    it('should reveal cursor line when typing above visible range', () => {
      mockEditor.getContentHeight.mockReturnValue(200);
      mockEditor.getPosition.mockReturnValue({ lineNumber: 5 }); // Cursor at top
      mockEditor.getVisibleRanges.mockReturnValue([{ startLineNumber: 15, endLineNumber: 25 }]);
      mockEditor.getModel.mockReturnValue({ getLineCount: () => 30 });

      const { result } = renderHook(() => useQueryPanelEditor());

      act(() => {
        result.current.editorDidMount(mockEditor);
      });

      const contentSizeChangeCallback = mockEditor.onDidContentSizeChange.mock.calls[0][0];
      act(() => {
        contentSizeChangeCallback();
      });

      // Cursor at line 5 is above visible range (15-25), should reveal
      expect(mockEditor.revealLine).toHaveBeenCalledWith(5);
    });

    it('should handle empty visible ranges gracefully', () => {
      mockEditor.getContentHeight.mockReturnValue(150);
      mockEditor.getPosition.mockReturnValue({ lineNumber: 10 });
      mockEditor.getVisibleRanges.mockReturnValue([]);

      const { result } = renderHook(() => useQueryPanelEditor());

      act(() => {
        result.current.editorDidMount(mockEditor);
      });

      const contentSizeChangeCallback = mockEditor.onDidContentSizeChange.mock.calls[0][0];

      // Should not throw when visible ranges is empty
      expect(() => {
        act(() => {
          contentSizeChangeCallback();
        });
      }).not.toThrow();

      // Should not reveal when no visible ranges
      expect(mockEditor.revealLine).not.toHaveBeenCalled();
    });
  });
});
