/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { AskAIButton } from './ask_ai_button';
import { rootReducer } from '../../../../application/utils/state_management/store';
import { EditorMode } from '../../../../application/utils/state_management/types';
import * as hooks from '../../../../application/hooks';

// Mock the hooks
jest.mock('../../../../application/hooks', () => ({
  useEditorFocus: jest.fn(),
  useLanguageSwitch: jest.fn(),
}));

const mockUseEditorFocus = hooks.useEditorFocus as jest.MockedFunction<typeof hooks.useEditorFocus>;
const mockUseLanguageSwitch = hooks.useLanguageSwitch as jest.MockedFunction<
  typeof hooks.useLanguageSwitch
>;

const renderWithProviders = (component: React.ReactElement, initialState = {}) => {
  const defaultState = {
    query: {
      query: 'source=hello',
      language: 'PPL',
      dataset: { id: 'test-dataset', type: 'INDEX_PATTERN' },
    },
    queryEditor: {
      editorMode: EditorMode.Query,
      promptModeIsAvailable: true,
      queryStatus: {
        status: 'UNINITIALIZED',
        elapsedMs: undefined,
        startTime: undefined,
        body: undefined,
      },
      lastExecutedPrompt: '',
    },
    ui: {
      showDatasetFields: false,
      prompt: '',
    },
    results: {},
    tab: {},
    legacy: {
      interval: 'auto',
      columns: [],
      sort: [],
    },
    ...initialState,
  };

  const store = configureStore({
    reducer: rootReducer,
    preloadedState: defaultState as any,
  });

  return render(<Provider store={store}>{component}</Provider>);
};

describe('AskAIButton', () => {
  const mockFocusOnEditor = jest.fn();
  const mockSwitchEditorMode = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseEditorFocus.mockReturnValue(mockFocusOnEditor);
    mockUseLanguageSwitch.mockReturnValue(mockSwitchEditorMode);
  });

  it('should render the button when prompt mode is available and editor is not in prompt mode', () => {
    const initialState = {
      queryEditor: {
        editorMode: EditorMode.Query,
        promptModeIsAvailable: true,
      },
    };

    renderWithProviders(<AskAIButton />, initialState);

    expect(
      screen.getByRole('button', { name: /ask ai with natural language/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Ask AI with Natural Language')).toBeInTheDocument();
  });

  it('should not render when prompt mode is not available', () => {
    const initialState = {
      queryEditor: {
        editorMode: EditorMode.Query,
        promptModeIsAvailable: false,
      },
    };

    renderWithProviders(<AskAIButton />, initialState);

    expect(
      screen.queryByRole('button', { name: /ask ai with natural language/i })
    ).not.toBeInTheDocument();
  });

  it('should not render when editor is already in prompt mode', () => {
    const initialState = {
      queryEditor: {
        editorMode: EditorMode.Prompt,
        promptModeIsAvailable: true,
      },
    };

    renderWithProviders(<AskAIButton />, initialState);

    expect(
      screen.queryByRole('button', { name: /ask ai with natural language/i })
    ).not.toBeInTheDocument();
  });

  describe('Click Behavior', () => {
    it('should call switchEditorMode with Prompt mode when clicked', () => {
      const initialState = {
        queryEditor: {
          editorMode: EditorMode.Query,
          promptModeIsAvailable: true,
        },
      };

      renderWithProviders(<AskAIButton />, initialState);

      const button = screen.getByRole('button', { name: /ask ai with natural language/i });
      fireEvent.click(button);

      expect(mockSwitchEditorMode).toHaveBeenCalledWith(EditorMode.Prompt);
      expect(mockSwitchEditorMode).toHaveBeenCalledTimes(1);
    });

    it('should call focusOnEditor with setTimeout when clicked', () => {
      jest.useFakeTimers();

      const initialState = {
        queryEditor: {
          editorMode: EditorMode.Query,
          promptModeIsAvailable: true,
        },
      };

      renderWithProviders(<AskAIButton />, initialState);

      const button = screen.getByRole('button', { name: /ask ai with natural language/i });
      fireEvent.click(button);

      // Fast-forward time to trigger setTimeout
      jest.runAllTimers();

      expect(mockFocusOnEditor).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });
  });

  describe('Hook Integration', () => {
    it('should use useEditorFocus hook', () => {
      const initialState = {
        queryEditor: {
          editorMode: EditorMode.Query,
          promptModeIsAvailable: true,
        },
      };

      renderWithProviders(<AskAIButton />, initialState);

      expect(mockUseEditorFocus).toHaveBeenCalledTimes(1);
    });

    it('should use useLanguageSwitch hook', () => {
      const initialState = {
        queryEditor: {
          editorMode: EditorMode.Query,
          promptModeIsAvailable: true,
        },
      };

      renderWithProviders(<AskAIButton />, initialState);

      expect(mockUseLanguageSwitch).toHaveBeenCalledTimes(1);
    });
  });
});
