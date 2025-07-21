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
  useClearEditors: jest.fn(),
  useEditorFocus: jest.fn(),
  useEditorRef: jest.fn(),
  useEditorText: jest.fn(),
  useSetEditorText: jest.fn(),
  useChangeQueryEditor: jest.fn(),
  useSetEditorTextWithQuery: jest.fn(),
}));

jest.mock('../../../../application/context');
jest.mock('../../../../../../data/public');
jest.mock('../../../../application/utils/state_management/actions/query_editor');
jest.mock('../../../../application/utils/state_management/slices');
jest.mock('../../../../application/utils/state_management/selectors', () => ({
  selectIsPromptEditorMode: jest.fn(),
  selectPromptModeIsAvailable: jest.fn(),
  selectQueryLanguage: jest.fn(),
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
import {
  useClearEditors,
  useEditorFocus,
  useEditorRef,
  useEditorText,
  useSetEditorText,
} from '../../../../application/hooks';
import { useDatasetContext } from '../../../../application/context';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { getEffectiveLanguageForAutoComplete } from '../../../../../../data/public';
import { onEditorRunActionCreator } from '../../../../application/utils/state_management/actions/query_editor';
import { setEditorMode } from '../../../../application/utils/state_management/slices';
import { EditorMode } from '../../../../application/utils/state_management/types';

const mockUseSelector = jest.mocked(useSelector);
const mockUseDispatch = jest.mocked(useDispatch);
const mockUseClearEditors = jest.mocked(useClearEditors);
const mockUseEditorFocus = jest.mocked(useEditorFocus);
const mockUseEditorRef = jest.mocked(useEditorRef);
const mockUseEditorText = jest.mocked(useEditorText);
const mockUseSetEditorText = jest.mocked(useSetEditorText);
const mockUseDatasetContext = jest.mocked(useDatasetContext);
const mockUseOpenSearchDashboards = jest.mocked(useOpenSearchDashboards);
const mockGetEffectiveLanguageForAutoComplete = jest.mocked(getEffectiveLanguageForAutoComplete);

describe('useQueryPanelEditor', () => {
  let mockDispatch: jest.Mock;
  let mockClearEditors: jest.Mock;
  let mockSetEditorIsFocused: jest.Mock;
  let mockSetEditorText: jest.Mock;
  let mockEditor: any;
  let mockServices: any;
  let mockDataset: any;
  let mockEditorRef: any;

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockClearEditors = jest.fn();
    mockSetEditorIsFocused = jest.fn();
    mockSetEditorText = jest.fn();
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
        },
      },
      datasets: {
        get: jest.fn(() => Promise.resolve(mockDataset)),
      },
    };

    // Mock implementations
    mockUseDispatch.mockReturnValue(mockDispatch);
    mockUseClearEditors.mockReturnValue(mockClearEditors);
    mockUseEditorFocus.mockReturnValue({
      editorIsFocused: false,
      focusOnEditor: jest.fn(),
      setEditorIsFocused: mockSetEditorIsFocused,
    });
    mockUseEditorRef.mockReturnValue(mockEditorRef);
    mockUseEditorText.mockReturnValue('');
    mockUseSetEditorText.mockReturnValue(mockSetEditorText);
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

    // Default selector values
    mockUseSelector.mockImplementation((selector) => {
      if (selector.toString().includes('selectPromptModeIsAvailable')) return false;
      if (selector.toString().includes('selectQueryLanguage')) return 'PPL';
      if (selector.toString().includes('selectIsPromptEditorMode')) return false;
      return undefined;
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
        if (selector.toString().includes('selectIsPromptEditorMode')) return false;
        return false;
      });

      const { result } = renderHook(() => useQueryPanelEditor());

      expect(result.current.options).toBeDefined();
    });
  });

  describe('placeholder text', () => {
    it('should return disabled prompt placeholder when prompt mode is not available', () => {
      mockUseSelector.mockImplementation((selector: any) => {
        if (selector.toString().includes('selectPromptModeIsAvailable')) return false;
        if (selector.toString().includes('selectIsPromptEditorMode')) return false;
        return false;
      });

      const { result } = renderHook(() => useQueryPanelEditor());

      expect(result.current.placeholder).toContain('PPL');
    });
  });

  describe('showPlaceholder logic', () => {
    it('should show placeholder when text is empty and editor is focused', () => {
      mockUseEditorText.mockReturnValue('');
      mockUseEditorFocus.mockReturnValue({
        editorIsFocused: true,
        focusOnEditor: jest.fn(),
        setEditorIsFocused: mockSetEditorIsFocused,
      });

      const { result } = renderHook(() => useQueryPanelEditor());

      expect(result.current.showPlaceholder).toBe(true);
    });

    it('should not show placeholder when text is present', () => {
      mockUseEditorText.mockReturnValue('some text');
      mockUseEditorFocus.mockReturnValue({
        editorIsFocused: true,
        focusOnEditor: jest.fn(),
        setEditorIsFocused: mockSetEditorIsFocused,
      });

      const { result } = renderHook(() => useQueryPanelEditor());

      expect(result.current.showPlaceholder).toBe(false);
    });

    it('should not show placeholder when editor is not focused', () => {
      mockUseEditorText.mockReturnValue('');
      mockUseEditorFocus.mockReturnValue({
        editorIsFocused: false,
        focusOnEditor: jest.fn(),
        setEditorIsFocused: mockSetEditorIsFocused,
      });

      const { result } = renderHook(() => useQueryPanelEditor());

      expect(result.current.showPlaceholder).toBe(false);
    });
  });

  describe('onChange handler', () => {
    it('should dispatch setEditorText with new text', () => {
      const { result } = renderHook(() => useQueryPanelEditor());

      act(() => {
        result.current.onChange('new text');
      });

      expect(mockDispatch).toHaveBeenCalledWith(mockSetEditorText('new text'));
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
      mockUseEditorText.mockReturnValue('SELECT *');
      mockUseSelector.mockImplementation((selector: any) => {
        if (selector.toString().includes('selectIsPromptEditorMode')) return false;
        return false;
      });

      const mockOnDidFocusDisposable = { dispose: jest.fn() };
      mockEditor.onDidFocusEditorWidget.mockReturnValue(mockOnDidFocusDisposable);
      mockEditorRef.current = mockEditor;

      renderHook(() => useQueryPanelEditor());

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
      mockUseEditorText.mockReturnValue('');
      mockUseSelector.mockImplementation((selector: any) => {
        if (selector.toString().includes('selectIsPromptEditorMode')) return false;
        return false;
      });
      mockEditorRef.current = mockEditor;

      renderHook(() => useQueryPanelEditor());

      expect(mockEditor.onDidFocusEditorWidget).not.toHaveBeenCalled();
    });
  });

  describe('handleRun and handleEscape', () => {
    it('should dispatch onEditorRunActionCreator when handleRun is called', () => {
      mockUseEditorText.mockReturnValue('test query');

      const { result } = renderHook(() => useQueryPanelEditor());

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

    it('should clear editors and set query mode when handleEscape is called', () => {
      const { result } = renderHook(() => useQueryPanelEditor());

      act(() => {
        result.current.editorDidMount(mockEditor);
      });

      // Find the escape action and call its handler
      const escapeModule = jest.requireMock('./escape_action');
      const handleEscapeCall = escapeModule.getEscapeAction.mock.calls[0][1];

      act(() => {
        handleEscapeCall();
      });

      expect(mockClearEditors).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith(setEditorMode(EditorMode.Query));
    });
  });
});
