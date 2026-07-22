/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Mock @ag-ui/client and @ag-ui/core before any imports that use them
jest.mock('@ag-ui/client', () => ({
  parseSSEStream: jest.fn(),
  runHttpRequest: jest.fn(),
}));

jest.mock('@ag-ui/core', () => ({
  EventType: {
    RUN_STARTED: 'RUN_STARTED',
    RUN_FINISHED: 'RUN_FINISHED',
    RUN_ERROR: 'RUN_ERROR',
    TEXT_MESSAGE_START: 'TEXT_MESSAGE_START',
    TEXT_MESSAGE_CONTENT: 'TEXT_MESSAGE_CONTENT',
    TEXT_MESSAGE_END: 'TEXT_MESSAGE_END',
    TOOL_CALL_START: 'TOOL_CALL_START',
    TOOL_CALL_ARGS: 'TOOL_CALL_ARGS',
    TOOL_CALL_END: 'TOOL_CALL_END',
  },
}));

jest.mock('../../../../../../data/public', () => {
  const actual = jest.createMockFromModule<any>('../../../../../../data/public');
  const overrides = { 'some-rule': { enabled: false } };
  return {
    ...actual,
    attachPPLContexts: jest.fn(),
    cleanupPPLContexts: jest.fn(),
    syncPPLValidationContext: jest.fn(),
    syncPPLLintContext: jest.fn(),
    // Simplified mock; full behavior covered in lint_context_builder.test.ts.
    buildPPLLintContext: jest.fn((dataset, _lintFields, services) => ({
      useRuntimeGrammar: false,
      dataSourceId: dataset?.dataSource?.id,
      dataSourceVersion: dataset?.dataSource?.version,
      overrides: services.uiSettings ? overrides : undefined,
      http: services.http,
    })),
    UI_SETTINGS: { QUERY_ENHANCEMENTS_PPL_LINT_RULES: 'query:enhancements:pplLint:rules' },
    shouldUseRuntimeGrammar: jest.fn(() => false),
    pplGrammarCache: {
      subscribeToGrammarUpdates: jest.fn(() => jest.fn()),
      subscribeToVersionResolved: jest.fn(() => jest.fn()),
    },
    runPPLAnalyzeInBackground: jest.fn(),
  };
});
jest.mock('./command_enter_action');
jest.mock('./shift_enter_action');
jest.mock('./tab_action');
jest.mock('./enter_action');
jest.mock('./spacebar_action');
jest.mock('./escape_action');
jest.mock('./use_prompt_is_typing', () => ({
  usePromptIsTyping: jest.fn(),
}));
jest.mock('./use_multi_query_decorations', () => ({
  useMultiQueryDecorations: jest.fn(() => ({
    updateDecorations: jest.fn(),
    clearDecorations: jest.fn(),
  })),
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
    Position: jest.fn((lineNumber: number, column: number) => ({ lineNumber, column })),
    editor: {
      TrackedRangeStickiness: {
        NeverGrowsWhenTypingAtEdges: 1,
      },
    },
  },
  setPPLValidationContext: jest.fn(),
  clearPPLValidationContext: jest.fn(),
  revalidatePPLModel: jest.fn(),
}));

// Now import after mocking
import { act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { monaco, revalidatePPLModel } from '@osd/monaco';
import { useQueryPanelEditor } from './use_query_panel_editor';
import {
  getEffectiveLanguageForAutoComplete,
  attachPPLContexts,
  buildPPLLintContext,
  syncPPLLintContext,
} from '../../../../../../data/public';
import { EditorMode } from '../../../../application/utils/state_management/types';
import { usePromptIsTyping } from './use_prompt_is_typing';
import { QueryEditorProps } from '../types';

const mockGetEffectiveLanguageForAutoComplete = jest.mocked(getEffectiveLanguageForAutoComplete);
const mockUsePromptIsTyping = jest.mocked(usePromptIsTyping);

describe('useQueryPanelEditor', () => {
  let mockEditor: any;
  let mockServices: any;
  let mockDataset: any;
  let mockEditorRef: any;
  let mockHandleChangeForPromptIsTyping: jest.Mock;
  let mockOnRun: jest.Mock;
  let mockSwitchEditorMode: jest.Mock;
  let mockHandleEditorChange: jest.Mock;

  // Builds a full QueryEditorProps object; override any field per-test.
  const buildProps = (overrides: Partial<QueryEditorProps> = {}): QueryEditorProps => ({
    services: mockServices,
    queryState: {
      query: '',
      language: 'PPL',
      dataset: undefined,
    },
    queryEditorState: {
      editorMode: EditorMode.Query,
      promptModeIsAvailable: false,
      isQueryEditorDirty: false,
    },
    onRun: mockOnRun,
    switchEditorMode: mockSwitchEditorMode,
    handleEditorChange: mockHandleEditorChange,
    editorRef: mockEditorRef,
    focusShortcutId: 'test_focus_query_bar',
    getEditorContainerHeight: () => 100,
    ...overrides,
  });

  beforeEach(() => {
    mockHandleChangeForPromptIsTyping = jest.fn();
    mockOnRun = jest.fn();
    mockSwitchEditorMode = jest.fn();
    mockHandleEditorChange = jest.fn();
    mockEditorRef = { current: null };

    mockEditor = {
      onDidFocusEditorText: jest.fn(() => ({ dispose: jest.fn() })),
      onDidBlurEditorText: jest.fn(() => ({ dispose: jest.fn() })),
      onDidFocusEditorWidget: jest.fn(() => ({ dispose: jest.fn() })),
      onDidContentSizeChange: jest.fn(),
      onDidChangeModelContent: jest.fn(() => ({ dispose: jest.fn() })),
      addAction: jest.fn(),
      trigger: jest.fn(),
      focus: jest.fn(),
      getContentHeight: jest.fn(() => 50),
      getDomNode: jest.fn(() => ({
        parentElement: { clientHeight: 100 },
        closest: jest.fn(() => ({ clientHeight: 100 })),
      })),
      getLayoutInfo: jest.fn(() => ({ width: 800 })),
      layout: jest.fn(),
      updateOptions: jest.fn(),
      getOffsetAt: jest.fn(() => 10),
      getValue: jest.fn(() => 'test query'),
      getWordUntilPosition: jest.fn(() => ({ startColumn: 1, endColumn: 5 })),
      getModel: jest.fn(() => ({ getLineCount: jest.fn(), getValue: jest.fn(() => '') })),
      revealLine: jest.fn(),
      getPosition: jest.fn(() => ({ lineNumber: 1 })),
      getVisibleRanges: jest.fn(() => [{ startLineNumber: 1, endLineNumber: 10 }]),
      createDecorationsCollection: jest.fn(() => ({ clear: jest.fn(), set: jest.fn() })),
    };

    mockDataset = {
      id: 'test-dataset',
      title: 'Test Dataset',
    };

    mockServices = {
      http: { fetch: jest.fn() },
      keyboardShortcut: {
        useKeyboardShortcut: jest.fn(),
      },
      appName: 'explore',
      data: {
        dataViews: {
          get: jest.fn(() => Promise.resolve(mockDataset)),
        },
        query: {
          queryString: {
            getQuery: jest.fn(() => ({ dataset: { id: 'test-id', type: 'INDEX_PATTERN' } })),
            getLanguageService: jest.fn(() => ({
              getLanguage: jest.fn((languageId: string) => ({ title: languageId })),
            })),
          },
          timefilter: {
            timefilter: {
              getTime: jest.fn(() => ({ from: 'now-15m', to: 'now' })),
            },
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
      uiSettings: {
        get: jest.fn(),
        getUpdate$: jest.fn(() => ({ subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })) })),
      },
    };

    mockGetEffectiveLanguageForAutoComplete.mockReturnValue('PPL');
    mockUsePromptIsTyping.mockReturnValue({
      promptIsTyping: false,
      handleChangeForPromptIsTyping: mockHandleChangeForPromptIsTyping,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('basic hook behavior', () => {
    it('should return query editor options when in query mode', () => {
      const { result } = renderHook(() => useQueryPanelEditor(buildProps()));

      expect(result.current.options).toBeDefined();
    });
  });

  describe('placeholder text', () => {
    it('should return disabled prompt placeholder when prompt mode is not available', () => {
      const { result } = renderHook(() =>
        useQueryPanelEditor(
          buildProps({
            queryEditorState: {
              editorMode: EditorMode.Query,
              promptModeIsAvailable: false,
              isQueryEditorDirty: false,
            },
          })
        )
      );

      expect(result.current.placeholder).toContain('PPL');
    });
  });

  describe('showPlaceholder logic', () => {
    it('should show placeholder when text is empty', () => {
      const { result } = renderHook(() => useQueryPanelEditor(buildProps()));

      expect(result.current.showPlaceholder).toBe(true);
    });

    it('should not show placeholder when text is present', () => {
      const { result } = renderHook(() => useQueryPanelEditor(buildProps()));

      act(() => {
        result.current.onChange('some text');
      });

      expect(result.current.value).toBe('some text');
      expect(result.current.showPlaceholder).toBe(false);
    });
  });

  describe('onChange handler', () => {
    it('should update local text state when onChange is called', () => {
      const { result } = renderHook(() => useQueryPanelEditor(buildProps()));

      expect(result.current.value).toBe('');

      act(() => {
        result.current.onChange('new text');
      });

      expect(result.current.value).toBe('new text');
    });

    it('should call handleChangeForPromptIsTyping when in prompt mode', () => {
      const localMockHandleChangeForPromptIsTyping = jest.fn();

      mockUsePromptIsTyping.mockReturnValue({
        promptIsTyping: false,
        handleChangeForPromptIsTyping: localMockHandleChangeForPromptIsTyping,
      });

      const { result } = renderHook(() =>
        useQueryPanelEditor(
          buildProps({
            queryEditorState: {
              editorMode: EditorMode.Prompt,
              promptModeIsAvailable: false,
              isQueryEditorDirty: false,
            },
          })
        )
      );

      expect(result.current.isPromptMode).toBe(true);

      act(() => {
        result.current.onChange('new text');
      });

      expect(result.current.value).toBe('new text');
      expect(localMockHandleChangeForPromptIsTyping).toHaveBeenCalledTimes(1);
    });

    it('should not call handleChangeForPromptIsTyping when not in prompt mode', () => {
      const { result } = renderHook(() => useQueryPanelEditor(buildProps()));

      act(() => {
        result.current.onChange('new text');
      });

      expect(result.current.value).toBe('new text');
      expect(mockHandleChangeForPromptIsTyping).not.toHaveBeenCalled();
    });

    it('should call handleEditorChange to mark dirty on first change', () => {
      const { result } = renderHook(() => useQueryPanelEditor(buildProps()));

      act(() => {
        result.current.onChange('new text');
      });

      expect(mockHandleEditorChange).toHaveBeenCalledWith({ isQueryEditorDirty: true });
    });
  });

  describe('onEditorClick handler', () => {
    it('should focus the editor when clicked', () => {
      mockEditorRef.current = mockEditor;

      const { result } = renderHook(() => useQueryPanelEditor(buildProps()));

      act(() => {
        result.current.onEditorClick();
      });

      expect(mockEditor.focus).toHaveBeenCalled();
    });

    it('should not throw when editor ref is null', () => {
      mockEditorRef.current = null;

      const { result } = renderHook(() => useQueryPanelEditor(buildProps()));

      expect(() => {
        act(() => {
          result.current.onEditorClick();
        });
      }).not.toThrow();
    });
  });

  describe('editorDidMount', () => {
    it('should set up editor with all actions and event listeners', () => {
      const { result } = renderHook(() => useQueryPanelEditor(buildProps()));

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

      const { result } = renderHook(() => useQueryPanelEditor(buildProps()));

      act(() => {
        result.current.editorDidMount(mockEditor);
      });

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

      const { result } = renderHook(() => useQueryPanelEditor(buildProps()));

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

    it('clears the shared editor ref when the editor unmounts', () => {
      mockEditorRef.current = mockEditor;

      const { unmount } = renderHook(() => useQueryPanelEditor());

      unmount();

      expect(mockEditorRef.current).toBeNull();
    });
  });

  describe('PPL lint context (Fix 1: datasetRef + overrides)', () => {
    const mdsDataset = {
      id: 'ds-dataset',
      title: 'MDS Dataset',
      type: 'INDEX_PATTERN',
      dataSource: { id: 'mds-1', title: 'local', type: 'OpenSearch', version: '3.8.0' },
    } as any;

    beforeEach(() => {
      // queryString.getQuery() returns a dataset-less query (stale-closure scenario).
      mockServices.data.query.queryString.getQuery = jest.fn(() => ({ dataset: undefined }));
    });

    const captureContexts = () => {
      const { result } = renderHook(() =>
        useQueryPanelEditor(
          buildProps({
            queryState: { query: '', language: 'PPL', dataset: mdsDataset },
          })
        )
      );
      act(() => {
        result.current.editorDidMount(mockEditor);
      });
      const calls = (attachPPLContexts as jest.Mock).mock.calls;
      const lastCall = calls[calls.length - 1];
      return {
        getValidationContext: lastCall[2] as () => any,
        getLintContext: lastCall[3] as () => any,
      };
    };

    it('getLintContext reads dataSourceId from the dataset, not queryString', () => {
      const ctx = captureContexts().getLintContext();
      expect(ctx.dataSourceId).toBe('mds-1');
      expect(ctx.dataSourceVersion).toBe('3.8.0');
    });

    it('getLintContext delegates to buildPPLLintContext with the live dataset', () => {
      captureContexts().getLintContext();
      // The live dataset (from datasetRef), not the dataset-less queryString.getQuery().
      expect(buildPPLLintContext).toHaveBeenCalledWith(
        mdsDataset,
        expect.any(Object),
        mockServices
      );
    });

    it('getValidationContext reads dataSourceId from the dataset, not queryString', () => {
      expect(captureContexts().getValidationContext().dataSourceId).toBe('mds-1');
    });

    it('getLintContext includes overrides built from uiSettings', () => {
      const ctx = captureContexts().getLintContext();
      expect(ctx.overrides).toEqual({ 'some-rule': { enabled: false } });
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
      const mockOnDidFocusDisposable = { dispose: jest.fn() };
      mockEditor.onDidFocusEditorWidget.mockReturnValue(mockOnDidFocusDisposable);
      mockEditorRef.current = mockEditor;

      renderHook(() => useQueryPanelEditor(buildProps()));

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

    it('should trigger autosuggestion immediately when text is empty', () => {
      mockEditorRef.current = mockEditor;

      renderHook(() => useQueryPanelEditor(buildProps()));

      // Should set up focus event listener and trigger suggestions immediately when text is empty
      expect(mockEditor.onDidFocusEditorWidget).toHaveBeenCalled();
      expect(mockEditor.trigger).toHaveBeenCalledWith(
        'keyboard',
        'editor.action.triggerSuggest',
        {}
      );
    });
  });

  describe('handleRun and handleEscape', () => {
    it('should call onRun with the editor text when handleRun is called', () => {
      const { result } = renderHook(() => useQueryPanelEditor(buildProps()));

      // Set text in local state
      act(() => {
        result.current.onChange('test query');
      });

      // Register editor actions
      act(() => {
        result.current.editorDidMount(mockEditor);
      });

      // Find the command+enter action and call its handler
      const commandEnterModule = jest.requireMock('./command_enter_action');
      const handleRunCall = commandEnterModule.getCommandEnterAction.mock.calls[0][0];

      act(() => {
        handleRunCall();
      });

      expect(mockOnRun).toHaveBeenCalledWith('test query');
    });

    it('should call switchEditorMode with Query mode when escape action fires', () => {
      const { result } = renderHook(() => useQueryPanelEditor(buildProps()));

      act(() => {
        result.current.onChange('some text');
      });

      expect(result.current.value).toBe('some text');

      act(() => {
        result.current.editorDidMount(mockEditor);
      });

      // Find the escape action and call its handler (2nd arg is the switch-to-query callback)
      const escapeModule = jest.requireMock('./escape_action');
      const handleEscapeCall = escapeModule.getEscapeAction.mock.calls[0][1];

      act(() => {
        handleEscapeCall();
      });

      // Local text is preserved
      expect(result.current.value).toBe('some text');
      expect(mockSwitchEditorMode).toHaveBeenCalledWith(EditorMode.Query);
    });
  });

  describe('prompt typing integration', () => {
    it('should return promptIsTyping value from usePromptIsTyping hook', () => {
      mockUsePromptIsTyping.mockReturnValue({
        promptIsTyping: true,
        handleChangeForPromptIsTyping: mockHandleChangeForPromptIsTyping,
      });

      const { result } = renderHook(() => useQueryPanelEditor(buildProps()));

      expect(result.current.promptIsTyping).toBe(true);
    });

    it('should return false for promptIsTyping when not typing', () => {
      mockUsePromptIsTyping.mockReturnValue({
        promptIsTyping: false,
        handleChangeForPromptIsTyping: mockHandleChangeForPromptIsTyping,
      });

      const { result } = renderHook(() => useQueryPanelEditor(buildProps()));

      expect(result.current.promptIsTyping).toBe(false);
    });
  });

  describe('PPL language switching', () => {
    it('should return PPL languageId when in query mode', () => {
      const { result } = renderHook(() =>
        useQueryPanelEditor(
          buildProps({
            queryState: { query: '', language: 'PPL', dataset: undefined },
            queryEditorState: {
              editorMode: EditorMode.Query,
              promptModeIsAvailable: true,
              isQueryEditorDirty: false,
            },
          })
        )
      );

      expect(result.current.languageId).toBe('PPL');
      expect(result.current.isPromptMode).toBe(false);
    });

    it('should return AI languageId when in AI/prompt mode', () => {
      const { result } = renderHook(() =>
        useQueryPanelEditor(
          buildProps({
            queryState: { query: '', language: 'PPL', dataset: undefined },
            queryEditorState: {
              editorMode: EditorMode.Prompt,
              promptModeIsAvailable: true,
              isQueryEditorDirty: false,
            },
          })
        )
      );

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
      mockGetEffectiveLanguageForAutoComplete.mockReturnValue('AI');

      const { result } = renderHook(() =>
        useQueryPanelEditor(
          buildProps({
            queryState: { query: '', language: 'PPL', dataset: undefined },
            queryEditorState: {
              editorMode: EditorMode.Prompt,
              promptModeIsAvailable: true,
              isQueryEditorDirty: false,
            },
          })
        )
      );

      const mockModel = {
        getValue: () => 'show me logs',
        getOffsetAt: () => 10,
        getWordUntilPosition: () => ({ startColumn: 1, endColumn: 5 }),
      } as any;
      const mockPosition = { lineNumber: 1, column: 10 } as any;

      await act(async () => {
        await result.current.suggestionProvider.provideCompletionItems(
          mockModel,
          mockPosition,
          // @ts-expect-error TS2345 TODO(ts-error): fixme
          {},
          { isCancellationRequested: false }
        );
      });

      expect(mockServices.data.autocomplete.getQuerySuggestions).toHaveBeenCalledWith(
        expect.objectContaining({
          language: 'AI', // effectiveLanguage for AI mode
          baseLanguage: 'PPL', // original queryLanguage passed as baseLanguage
          query: 'show me logs',
        })
      );
    });

    it('should call getQuerySuggestions with baseLanguage=PPL and language=PPL_Simplified in PPL mode', async () => {
      mockGetEffectiveLanguageForAutoComplete.mockReturnValue('PPL_Simplified');

      const { result } = renderHook(() => useQueryPanelEditor(buildProps()));

      const mockModel = {
        getValue: () => 'search source=logs',
        getOffsetAt: () => 15,
        getWordUntilPosition: () => ({ startColumn: 1, endColumn: 7 }),
      } as any;
      const mockPosition = { lineNumber: 1, column: 15 } as any;

      await act(async () => {
        await result.current.suggestionProvider.provideCompletionItems(
          mockModel,
          mockPosition,
          // @ts-expect-error TS2345 TODO(ts-error): fixme
          {},
          { isCancellationRequested: false }
        );
      });

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

      const { result } = renderHook(() => useQueryPanelEditor(buildProps()));

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

      const { result } = renderHook(() => useQueryPanelEditor(buildProps()));

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

      const { result } = renderHook(() => useQueryPanelEditor(buildProps()));

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

      const { result } = renderHook(() => useQueryPanelEditor(buildProps()));

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

      const { result } = renderHook(() => useQueryPanelEditor(buildProps()));

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

      const { result } = renderHook(() => useQueryPanelEditor(buildProps()));

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

  // B3: rule setting change must immediately revalidate, not wait for next keystroke.
  describe('re-lints on a pplLint rule setting change (B3)', () => {
    let subscribeCallback: ((event: { key: string }) => void) | undefined;

    beforeEach(() => {
      subscribeCallback = undefined;
      mockServices.uiSettings = {
        get: jest.fn(),
        getUpdate$: jest.fn(() => ({
          subscribe: (cb: (event: { key: string }) => void) => {
            subscribeCallback = cb;
            return { unsubscribe: jest.fn() };
          },
        })),
      };
    });

    it('re-syncs the lint context and revalidates when the pplLint:rules key changes', () => {
      const { result } = renderHook(() => useQueryPanelEditor(buildProps()));
      act(() => {
        result.current.editorDidMount(mockEditor);
      });
      (syncPPLLintContext as jest.Mock).mockClear();
      (revalidatePPLModel as jest.Mock).mockClear();

      act(() => {
        subscribeCallback?.({ key: 'query:enhancements:pplLint:rules' });
      });

      expect(syncPPLLintContext).toHaveBeenCalledTimes(1);
      expect(revalidatePPLModel).toHaveBeenCalledTimes(1);
    });

    it('ignores unrelated uiSettings keys', () => {
      const { result } = renderHook(() => useQueryPanelEditor(buildProps()));
      act(() => {
        result.current.editorDidMount(mockEditor);
      });
      (syncPPLLintContext as jest.Mock).mockClear();
      (revalidatePPLModel as jest.Mock).mockClear();

      act(() => {
        subscribeCallback?.({ key: 'theme:darkMode' });
      });

      expect(syncPPLLintContext).not.toHaveBeenCalled();
      expect(revalidatePPLModel).not.toHaveBeenCalled();
    });
  });
});
