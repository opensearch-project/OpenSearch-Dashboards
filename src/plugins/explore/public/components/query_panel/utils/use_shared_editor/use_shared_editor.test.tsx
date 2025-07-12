/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { monaco } from '@osd/monaco';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useSharedEditor } from './use_shared_editor';

// Mock dependencies
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
}));

jest.mock('../../../../application/hooks', () => ({
  useOnEditorRunContext: jest.fn(),
  useSetEditorText: jest.fn(),
  useToggleDualEditorMode: jest.fn(),
}));

jest.mock('../../../../application/context', () => ({
  useDatasetContext: jest.fn(),
}));

jest.mock('../../../../application/utils/state_management/selectors', () => ({
  selectEditorMode: jest.fn(),
  selectQueryLanguage: jest.fn(),
}));

jest.mock('../../../../application/utils/state_management/actions/query_editor', () => ({
  onEditorChangeActionCreator: jest.fn(),
  onEditorRunActionCreator: jest.fn(),
}));

jest.mock('../../../../../../data/public', () => ({
  getEffectiveLanguageForAutoComplete: jest.fn(),
}));

jest.mock('./command_enter_action', () => ({
  getCommandEnterAction: jest.fn(),
}));

jest.mock('./shift_enter_action', () => ({
  getShiftEnterAction: jest.fn(),
}));

jest.mock('./tab_action', () => ({
  getTabAction: jest.fn(),
}));

jest.mock('./enter_action', () => ({
  getEnterAction: jest.fn(),
}));

import { useDispatch, useSelector } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { useDatasetContext } from '../../../../application/context';
import {
  selectEditorMode,
  selectQueryLanguage,
} from '../../../../application/utils/state_management/selectors';
import { getEffectiveLanguageForAutoComplete } from '../../../../../../data/public';
import {
  onEditorChangeActionCreator,
  onEditorRunActionCreator,
} from '../../../../application/utils/state_management/actions/query_editor';
import { getCommandEnterAction } from './command_enter_action';
import { getShiftEnterAction } from './shift_enter_action';
import { getTabAction } from './tab_action';
import { getEnterAction } from './enter_action';
import { EditorMode } from '../../../../application/utils/state_management/types';
import {
  useOnEditorRunContext,
  useSetEditorText,
  useToggleDualEditorMode,
} from '../../../../application/hooks';
import IActionDescriptor = monaco.editor.IActionDescriptor;

const mockUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>;
const mockUseOpenSearchDashboards = useOpenSearchDashboards as jest.MockedFunction<
  typeof useOpenSearchDashboards
>;
const mockUseOnEditorRunContext = useOnEditorRunContext as jest.MockedFunction<
  typeof useOnEditorRunContext
>;
const mockUseSetEditorText = useSetEditorText as jest.MockedFunction<typeof useSetEditorText>;
const mockUseToggleDualEditorMode = useToggleDualEditorMode as jest.MockedFunction<
  typeof useToggleDualEditorMode
>;
const mockOnEditorChangeActionCreator = onEditorChangeActionCreator as jest.MockedFunction<
  typeof onEditorChangeActionCreator
>;
const mockOnEditorRunActionCreator = onEditorRunActionCreator as jest.MockedFunction<
  typeof onEditorRunActionCreator
>;
const mockGetCommandEnterAction = getCommandEnterAction as jest.MockedFunction<
  typeof getCommandEnterAction
>;
const mockGetShiftEnterAction = getShiftEnterAction as jest.MockedFunction<
  typeof getShiftEnterAction
>;
const mockGetTabAction = getTabAction as jest.MockedFunction<typeof getTabAction>;
const mockGetEnterAction = getEnterAction as jest.MockedFunction<typeof getEnterAction>;

describe('useSharedEditor', () => {
  let mockDispatch: jest.Mock;
  let mockServices: any;
  let mockSetEditorRef: jest.Mock;
  let mockEditor: any;
  let mockToggleDualEditorMode: jest.Mock;
  let mockSetEditorText: jest.Mock;
  let mockOnEditorRunContext: any;

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockServices = {
      data: {
        query: { queryString: { getQuery: jest.fn() } },
        autocomplete: { getQuerySuggestions: jest.fn().mockResolvedValue([]) },
      },
      indexPatterns: { get: jest.fn() },
      uiSettings: { get: jest.fn() },
    };
    mockSetEditorRef = jest.fn();
    mockToggleDualEditorMode = jest.fn();
    mockSetEditorText = jest.fn();
    mockOnEditorRunContext = { query: 'SELECT * FROM logs', prompt: '' };

    mockEditor = {
      onDidFocusEditorText: jest.fn().mockReturnValue({ dispose: jest.fn() }),
      onDidBlurEditorText: jest.fn().mockReturnValue({ dispose: jest.fn() }),
      onDidContentSizeChange: jest.fn(),
      addAction: jest.fn(),
      getContentHeight: jest.fn().mockReturnValue(32),
      getLayoutInfo: jest.fn().mockReturnValue({ width: 400 }),
      layout: jest.fn(),
      updateOptions: jest.fn(),
    };

    mockUseDispatch.mockReturnValue(mockDispatch);
    mockUseOpenSearchDashboards.mockReturnValue({ services: mockServices } as any);
    mockUseOnEditorRunContext.mockReturnValue(mockOnEditorRunContext);
    mockUseSetEditorText.mockReturnValue(mockSetEditorText);
    mockUseToggleDualEditorMode.mockReturnValue(mockToggleDualEditorMode);

    mockGetCommandEnterAction.mockReturnValue({ id: 'command-enter' } as IActionDescriptor);
    mockGetShiftEnterAction.mockReturnValue({ id: 'shift-enter' } as IActionDescriptor);
    mockGetTabAction.mockReturnValue({ id: 'tab' } as IActionDescriptor);
    mockGetEnterAction.mockReturnValue({ id: 'enter' } as IActionDescriptor);

    mockOnEditorChangeActionCreator.mockReturnValue({ type: 'EDITOR_CHANGE' } as any);
    mockOnEditorRunActionCreator.mockReturnValue({ type: 'EDITOR_RUN' } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderUseSharedEditor = (props = {}, selectorMock?: (selector: any) => any) => {
    const defaultProps = {
      setEditorRef: mockSetEditorRef,
      editorPosition: 'top' as const,
    };
    const store = configureStore({
      reducer: () => ({}),
    });

    // Mock additional required dependencies
    const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
    const mockUseDatasetContext = useDatasetContext as jest.MockedFunction<
      typeof useDatasetContext
    >;
    const mockGetEffectiveLanguageForAutoComplete = getEffectiveLanguageForAutoComplete as jest.MockedFunction<
      typeof getEffectiveLanguageForAutoComplete
    >;

    mockUseSelector.mockImplementation(
      selectorMock ||
        ((selector) => {
          if (selector === selectEditorMode) return EditorMode.SingleQuery;
          if (selector === selectQueryLanguage) return 'SQL';
          return undefined;
        })
    );

    mockUseDatasetContext.mockReturnValue({ indexPattern: { id: 'test' } } as any);
    mockGetEffectiveLanguageForAutoComplete.mockReturnValue('SQL');

    return renderHook(() => useSharedEditor({ ...defaultProps, ...props }), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });
  };

  it('should return correct initial values and functions', () => {
    const { result } = renderUseSharedEditor();

    expect(result.current).toEqual({
      isFocused: false,
      height: 32,
      useLatestTheme: true,
      editorDidMount: expect.any(Function),
      onChange: expect.any(Function),
      onWrapperClick: expect.any(Function),
      languageConfiguration: {
        autoClosingPairs: [
          { open: '(', close: ')' },
          { open: '[', close: ']' },
          { open: '{', close: '}' },
          { open: '"', close: '"' },
          { open: "'", close: "'" },
        ],
      },
    });
  });

  it('should accept setEditorRef and editorPosition props', () => {
    const customSetEditorRef = jest.fn();
    const { result } = renderUseSharedEditor({
      setEditorRef: customSetEditorRef,
      editorPosition: 'bottom',
    });

    act(() => {
      result.current.editorDidMount(mockEditor);
    });

    expect(customSetEditorRef).toHaveBeenCalledWith(mockEditor);
  });

  describe('completion provider', () => {
    let disposeMock: jest.Mock;
    let registerCompletionItemProviderMock: jest.Mock;
    let originalRegisterCompletionItemProvider: typeof monaco.languages.registerCompletionItemProvider;

    beforeEach(() => {
      disposeMock = jest.fn();
      registerCompletionItemProviderMock = jest.fn().mockReturnValue({
        dispose: disposeMock,
      });
      originalRegisterCompletionItemProvider = monaco.languages.registerCompletionItemProvider;
      monaco.languages.registerCompletionItemProvider = registerCompletionItemProviderMock;
    });

    afterEach(() => {
      monaco.languages.registerCompletionItemProvider = originalRegisterCompletionItemProvider;
    });

    it('should register completion provider', () => {
      const { unmount } = renderUseSharedEditor();
      expect(registerCompletionItemProviderMock).toHaveBeenCalled();

      unmount();
      expect(disposeMock).toHaveBeenCalled();
    });
  });

  describe('onChange', () => {
    it('should dispatch editor change action', () => {
      const { result } = renderUseSharedEditor();

      act(() => {
        result.current.onChange('new text');
      });

      expect(mockOnEditorChangeActionCreator).toHaveBeenCalledWith('new text', mockSetEditorText);
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'EDITOR_CHANGE' });
    });
  });

  describe('onWrapperClick', () => {
    it('should call toggleDualEditorMode when top editor is clicked in DualQuery mode', () => {
      const { result } = renderUseSharedEditor({ editorPosition: 'top' }, (selector) => {
        if (selector === selectEditorMode) return EditorMode.DualQuery;
        if (selector === selectQueryLanguage) return 'SQL';
        return undefined;
      });

      act(() => {
        result.current.onWrapperClick();
      });

      expect(mockToggleDualEditorMode).toHaveBeenCalled();
    });

    it('should call toggleDualEditorMode when bottom editor is clicked in DualPrompt mode', () => {
      const { result } = renderUseSharedEditor({ editorPosition: 'bottom' }, (selector) => {
        if (selector === selectEditorMode) return EditorMode.DualPrompt;
        if (selector === selectQueryLanguage) return 'SQL';
        return undefined;
      });

      act(() => {
        result.current.onWrapperClick();
      });

      expect(mockToggleDualEditorMode).toHaveBeenCalled();
    });

    it('should not call toggleDualEditorMode when top editor is clicked in SingleQuery mode', () => {
      const { result } = renderUseSharedEditor({ editorPosition: 'top' }, (selector) => {
        if (selector === selectEditorMode) return EditorMode.SingleQuery;
        if (selector === selectQueryLanguage) return 'SQL';
        return undefined;
      });

      act(() => {
        result.current.onWrapperClick();
      });

      expect(mockToggleDualEditorMode).not.toHaveBeenCalled();
    });
  });

  describe('editorDidMount', () => {
    it('should call setEditorRef with editor', () => {
      const { result } = renderUseSharedEditor();

      act(() => {
        result.current.editorDidMount(mockEditor);
      });

      expect(mockSetEditorRef).toHaveBeenCalledWith(mockEditor);
    });

    it('should add all editor actions', () => {
      const { result } = renderUseSharedEditor();

      act(() => {
        result.current.editorDidMount(mockEditor);
      });

      expect(mockEditor.addAction).toHaveBeenCalledTimes(4);
      expect(mockGetCommandEnterAction).toHaveBeenCalled();
      expect(mockGetShiftEnterAction).toHaveBeenCalled();
      expect(mockGetTabAction).toHaveBeenCalled();
      expect(mockGetEnterAction).toHaveBeenCalled();
    });

    it('should setup focus and blur event handlers', () => {
      const { result } = renderUseSharedEditor();
      const mockFocusHandler = jest.fn();
      const mockBlurHandler = jest.fn();

      mockEditor.onDidFocusEditorText.mockImplementation((callback: any) => {
        mockFocusHandler.mockImplementation(callback);
        return { dispose: jest.fn() };
      });

      mockEditor.onDidBlurEditorText.mockImplementation((callback: any) => {
        mockBlurHandler.mockImplementation(callback);
        return { dispose: jest.fn() };
      });

      act(() => {
        result.current.editorDidMount(mockEditor);
      });

      expect(result.current.isFocused).toBe(false);

      // Simulate focus
      act(() => {
        mockFocusHandler();
      });
      expect(result.current.isFocused).toBe(true);

      // Simulate blur
      act(() => {
        mockBlurHandler();
      });
      expect(result.current.isFocused).toBe(false);
    });
  });

  describe('handleRun callback', () => {
    it('should dispatch onEditorRunActionCreator with current context', () => {
      const { result } = renderUseSharedEditor();

      act(() => {
        result.current.editorDidMount(mockEditor);
      });

      // The handleRun function is passed to action creators
      expect(mockGetCommandEnterAction).toHaveBeenCalledWith(expect.any(Function));
      expect(mockGetEnterAction).toHaveBeenCalledWith(expect.any(Function));

      // Get the handleRun function from the mock calls
      const handleRunFromCommand = mockGetCommandEnterAction.mock.calls[0][0];

      // Test the handleRun function
      act(() => {
        handleRunFromCommand();
      });

      expect(mockOnEditorRunActionCreator).toHaveBeenCalledWith(
        mockServices,
        mockOnEditorRunContext
      );
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'EDITOR_RUN' });
    });
  });
});
