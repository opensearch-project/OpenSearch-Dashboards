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

jest.mock('../../../../application/context', () => ({
  useEditorContext: jest.fn(),
}));

jest.mock('../../../../application/components/index_pattern_context', () => ({
  useIndexPatternContext: jest.fn(),
}));

jest.mock('../../../../application/utils/state_management/selectors', () => ({
  selectEditorMode: jest.fn(),
  selectQueryLanguage: jest.fn(),
}));

jest.mock('../../../../application/utils/state_management/actions/query_editor', () => ({
  onEditorChangeActionCreator: jest.fn(),
  onEditorRunActionCreator: jest.fn(),
}));

jest.mock('../../../../application/utils/state_management/slices', () => ({
  toggleDualEditorMode: jest.fn(),
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
import { useEditorContext } from '../../../../application/context';
import { useIndexPatternContext } from '../../../../application/components/index_pattern_context';
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
import { toggleDualEditorMode } from '../../../../application/utils/state_management/slices';
import IActionDescriptor = monaco.editor.IActionDescriptor;

const mockUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>;
const mockUseOpenSearchDashboards = useOpenSearchDashboards as jest.MockedFunction<
  typeof useOpenSearchDashboards
>;
const mockUseEditorContext = useEditorContext as jest.MockedFunction<typeof useEditorContext>;
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
  let mockEditorContext: any;
  let mockSetEditorRef: jest.Mock;
  let mockEditor: any;
  let mockProvideCompletionItems: jest.Mock;

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockServices = {
      data: { query: {} },
      uiSettings: { get: jest.fn() },
    };
    mockEditorContext = {
      editorText: 'SELECT * FROM logs',
      setEditorText: jest.fn(),
      clearEditors: jest.fn(),
      clearEditorsAndSetText: jest.fn(),
      setBottomEditorText: jest.fn(),
      query: 'SELECT * FROM logs',
      prompt: '',
    };
    mockSetEditorRef = jest.fn();
    mockProvideCompletionItems = jest.fn().mockReturnValue({ suggestions: [] });

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
    mockUseEditorContext.mockReturnValue(mockEditorContext);

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
    const mockUseIndexPatternContext = useIndexPatternContext as jest.MockedFunction<
      typeof useIndexPatternContext
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

    mockUseIndexPatternContext.mockReturnValue({ indexPattern: { id: 'test' } } as any);
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

      expect(mockOnEditorChangeActionCreator).toHaveBeenCalledWith('new text', mockEditorContext);
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'EDITOR_CHANGE' });
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

    it('should setup content size change handler', () => {
      const { result } = renderUseSharedEditor();
      let contentSizeHandler: () => void;

      mockEditor.onDidContentSizeChange.mockImplementation((callback: any) => {
        contentSizeHandler = callback;
      });

      act(() => {
        result.current.editorDidMount(mockEditor);
      });

      // Test content size change with height < maxHeight
      mockEditor.getContentHeight.mockReturnValue(50);
      act(() => {
        contentSizeHandler();
      });

      expect(result.current.height).toBe(50);
      expect(mockEditor.layout).toHaveBeenCalledWith({ width: 400, height: 50 });
      expect(mockEditor.updateOptions).toHaveBeenCalledWith({
        scrollBeyondLastLine: false,
        scrollbar: { vertical: 'hidden' },
      });

      // Test content size change with height > maxHeight
      mockEditor.getContentHeight.mockReturnValue(150);
      act(() => {
        contentSizeHandler();
      });

      expect(result.current.height).toBe(100); // capped at maxHeight
      expect(mockEditor.layout).toHaveBeenCalledWith({ width: 400, height: 100 });
      expect(mockEditor.updateOptions).toHaveBeenCalledWith({
        scrollBeyondLastLine: false,
        scrollbar: { vertical: 'visible' },
      });
    });

    it('should return disposal function', () => {
      const { result } = renderUseSharedEditor();
      const mockFocusDispose = jest.fn();
      const mockBlurDispose = jest.fn();

      mockEditor.onDidFocusEditorText.mockReturnValue({ dispose: mockFocusDispose });
      mockEditor.onDidBlurEditorText.mockReturnValue({ dispose: mockBlurDispose });

      let disposalFunction: () => any = () => mockEditor;
      act(() => {
        disposalFunction = result.current.editorDidMount(mockEditor);
      });

      const returnedEditor = disposalFunction();

      expect(mockFocusDispose).toHaveBeenCalled();
      expect(mockBlurDispose).toHaveBeenCalled();
      expect(returnedEditor).toBe(mockEditor);
    });
  });

  describe('handleRun callback', () => {
    it('should dispatch onEditorRunActionCreator with current context', () => {
      const { result } = renderUseSharedEditor();

      // Get the handleRun function by accessing it through an action creator
      act(() => {
        result.current.editorDidMount(mockEditor);
      });

      // The handleRun function is passed to action creators
      expect(mockGetCommandEnterAction).toHaveBeenCalledWith(expect.any(Function));
      expect(mockGetEnterAction).toHaveBeenCalledWith(expect.any(Function));

      // Get the handleRun function from the mock calls
      const handleRunFromCommand = mockGetCommandEnterAction.mock.calls[0][0];
      const handleRunFromEnter = mockGetEnterAction.mock.calls[0][0];

      // Both should be the same function
      expect(handleRunFromCommand).toBe(handleRunFromEnter);

      // Test the handleRun function
      act(() => {
        handleRunFromCommand();
      });

      expect(mockOnEditorRunActionCreator).toHaveBeenCalledWith(mockServices, mockEditorContext);
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'EDITOR_RUN' });
    });

    it('should use latest editor context through ref', () => {
      const { result, rerender } = renderUseSharedEditor();

      act(() => {
        result.current.editorDidMount(mockEditor);
      });

      // Update editor context
      const newEditorContext = {
        editorText: 'new text',
        setEditorText: jest.fn(),
        clearEditors: jest.fn(),
        clearEditorsAndSetText: jest.fn(),
        setBottomEditorText: jest.fn(),
        query: 'new text',
        prompt: '',
      };
      mockUseEditorContext.mockReturnValue(newEditorContext);

      rerender({
        setEditorRef: mockSetEditorRef,
        provideCompletionItems: mockProvideCompletionItems,
      });

      // Get and call handleRun
      const handleRun = mockGetCommandEnterAction.mock.calls[0][0];
      act(() => {
        handleRun();
      });

      expect(mockOnEditorRunActionCreator).toHaveBeenCalledWith(mockServices, newEditorContext);
    });
  });

  describe('onWrapperClick', () => {
    beforeEach(() => {
      (toggleDualEditorMode as jest.MockedFunction<any>).mockReturnValue({
        type: 'TOGGLE_DUAL_EDITOR_MODE',
      });
    });

    it('should dispatch toggleDualEditorMode when top editor is clicked in DualQuery mode', () => {
      const { result } = renderUseSharedEditor({ editorPosition: 'top' }, (selector) => {
        if (selector === selectEditorMode) return EditorMode.DualQuery;
        if (selector === selectQueryLanguage) return 'SQL';
        return undefined;
      });

      act(() => {
        result.current.onWrapperClick();
      });

      expect(toggleDualEditorMode).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'TOGGLE_DUAL_EDITOR_MODE' });
    });

    it('should dispatch toggleDualEditorMode when bottom editor is clicked in DualPrompt mode', () => {
      const { result } = renderUseSharedEditor({ editorPosition: 'bottom' }, (selector) => {
        if (selector === selectEditorMode) return EditorMode.DualPrompt;
        if (selector === selectQueryLanguage) return 'SQL';
        return undefined;
      });

      act(() => {
        result.current.onWrapperClick();
      });

      expect(toggleDualEditorMode).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'TOGGLE_DUAL_EDITOR_MODE' });
    });

    it('should not dispatch toggleDualEditorMode when top editor is clicked in SingleQuery mode', () => {
      const { result } = renderUseSharedEditor({ editorPosition: 'top' }, (selector) => {
        if (selector === selectEditorMode) return EditorMode.SingleQuery;
        if (selector === selectQueryLanguage) return 'SQL';
        return undefined;
      });

      act(() => {
        result.current.onWrapperClick();
      });

      expect(toggleDualEditorMode).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should not dispatch toggleDualEditorMode when bottom editor is clicked in SingleQuery mode', () => {
      const { result } = renderUseSharedEditor({ editorPosition: 'bottom' }, (selector) => {
        if (selector === selectEditorMode) return EditorMode.SingleQuery;
        if (selector === selectQueryLanguage) return 'SQL';
        return undefined;
      });

      act(() => {
        result.current.onWrapperClick();
      });

      expect(toggleDualEditorMode).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should not dispatch toggleDualEditorMode when top editor is clicked in DualPrompt mode', () => {
      const { result } = renderUseSharedEditor({ editorPosition: 'top' }, (selector) => {
        if (selector === selectEditorMode) return EditorMode.DualPrompt;
        if (selector === selectQueryLanguage) return 'SQL';
        return undefined;
      });

      act(() => {
        result.current.onWrapperClick();
      });

      expect(toggleDualEditorMode).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should not dispatch toggleDualEditorMode when bottom editor is clicked in DualQuery mode', () => {
      const { result } = renderUseSharedEditor({ editorPosition: 'bottom' }, (selector) => {
        if (selector === selectEditorMode) return EditorMode.DualQuery;
        if (selector === selectQueryLanguage) return 'SQL';
        return undefined;
      });

      act(() => {
        result.current.onWrapperClick();
      });

      expect(toggleDualEditorMode).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });
});
