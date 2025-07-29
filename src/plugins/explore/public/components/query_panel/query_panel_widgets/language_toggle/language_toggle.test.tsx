/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { LanguageToggle } from './language_toggle';
import { EditorMode } from '../../../../application/utils/state_management/types';

// Mock all modules before importing the component
const mockDispatch = jest.fn();
const mockClearEditors = jest.fn();
const mockFocusOnEditor = jest.fn();
const mockEditorRef = {
  current: {
    getModel: jest.fn(() => ({
      getFullModelRange: jest.fn(() => 'mockRange'),
    })),
    setSelection: jest.fn(),
  },
};

// Mock the hooks
jest.mock('../../../../application/hooks', () => ({
  useClearEditors: () => mockClearEditors,
  useEditorFocus: () => mockFocusOnEditor,
  useEditorRef: () => mockEditorRef,
}));

// Mock the action creator
jest.mock('../../../../application/utils/state_management/slices', () => ({
  setEditorMode: jest.fn((mode) => ({ type: 'SET_EDITOR_MODE', payload: mode })),
}));

// Mock the selectors directly
jest.mock('../../../../application/utils/state_management/selectors', () => ({
  selectIsPromptEditorMode: jest.fn(),
  selectPromptModeIsAvailable: jest.fn(),
}));

// Mock redux hooks
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

// Import the mocked selectors
import {
  selectIsPromptEditorMode,
  selectPromptModeIsAvailable,
} from '../../../../application/utils/state_management/selectors';

const mockSelectIsPromptEditorMode = selectIsPromptEditorMode as jest.MockedFunction<
  typeof selectIsPromptEditorMode
>;
const mockSelectPromptModeIsAvailable = selectPromptModeIsAvailable as jest.MockedFunction<
  typeof selectPromptModeIsAvailable
>;

describe('LanguageToggle', () => {
  const renderWithProvider = (component: React.ReactElement) => {
    const mockStore = configureStore({
      reducer: { mock: (state = {}) => state },
    });
    return render(<Provider store={mockStore}>{component}</Provider>);
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Set default return values for selectors
    mockSelectIsPromptEditorMode.mockReturnValue(false);
    mockSelectPromptModeIsAvailable.mockReturnValue(true);
  });

  it('renders the language toggle button', () => {
    renderWithProvider(<LanguageToggle />);

    const button = screen.getByTestId('queryPanelFooterLanguageToggle');
    expect(button).toBeInTheDocument();
  });

  it('toggles popover visibility when button is clicked', () => {
    renderWithProvider(<LanguageToggle />);

    const button = screen.getByTestId('queryPanelFooterLanguageToggle');

    // Initially no menu items visible
    expect(screen.queryByText('PPL')).not.toBeInTheDocument();
    expect(screen.queryByText('Ask AI')).not.toBeInTheDocument();

    // Click to show
    fireEvent.click(button);
    expect(screen.getByText('PPL')).toBeInTheDocument();
    expect(screen.getByText('Ask AI')).toBeInTheDocument();
  });

  describe('Menu Items', () => {
    it('disables PPL option when not in prompt mode', () => {
      renderWithProvider(<LanguageToggle />);

      const button = screen.getByTestId('queryPanelFooterLanguageToggle');
      fireEvent.click(button);

      const pplOption = screen.getByText('PPL');
      expect(pplOption).toBeInTheDocument();
      expect(pplOption.closest('button')).toBeDisabled();
    });

    it('enables PPL option when in prompt mode', () => {
      mockSelectIsPromptEditorMode.mockReturnValue(true);
      mockSelectPromptModeIsAvailable.mockReturnValue(true);

      renderWithProvider(<LanguageToggle />);

      const button = screen.getByTestId('queryPanelFooterLanguageToggle');
      fireEvent.click(button);

      const pplOption = screen.getByText('PPL');
      expect(pplOption.closest('button')).not.toBeDisabled();
    });

    it('shows Ask AI option when prompt mode is available', () => {
      renderWithProvider(<LanguageToggle />);

      const button = screen.getByTestId('queryPanelFooterLanguageToggle');
      fireEvent.click(button);

      const aiOption = screen.getByText('Ask AI');
      expect(aiOption).toBeInTheDocument();
      expect(aiOption.closest('button')).not.toBeDisabled();
    });

    it('disables Ask AI option when in prompt mode', () => {
      mockSelectIsPromptEditorMode.mockReturnValue(true);
      mockSelectPromptModeIsAvailable.mockReturnValue(true);

      renderWithProvider(<LanguageToggle />);

      const button = screen.getByTestId('queryPanelFooterLanguageToggle');
      fireEvent.click(button);

      const aiOption = screen.getByText('Ask AI');
      expect(aiOption.closest('button')).toBeDisabled();
    });

    it('does not show Ask AI option when prompt mode is not available', () => {
      mockSelectIsPromptEditorMode.mockReturnValue(false);
      mockSelectPromptModeIsAvailable.mockReturnValue(false);

      renderWithProvider(<LanguageToggle />);

      const button = screen.getByTestId('queryPanelFooterLanguageToggle');
      fireEvent.click(button);

      expect(screen.getByText('PPL')).toBeInTheDocument();
      expect(screen.queryByText('Ask AI')).not.toBeInTheDocument();
    });
  });

  describe('Item Click Behavior', () => {
    it('switches to Query mode when PPL is clicked', async () => {
      // PPL is only clickable when in prompt mode
      mockSelectIsPromptEditorMode.mockReturnValue(true);
      mockSelectPromptModeIsAvailable.mockReturnValue(true);

      renderWithProvider(<LanguageToggle />);

      const button = screen.getByTestId('queryPanelFooterLanguageToggle');
      fireEvent.click(button);

      const pplOption = screen.getByText('PPL');
      fireEvent.click(pplOption);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_EDITOR_MODE',
        payload: EditorMode.Query,
      });

      // Wait for setTimeout to execute
      await waitFor(() => {
        expect(mockFocusOnEditor).toHaveBeenCalledTimes(1);
        expect(mockEditorRef.current.setSelection).toHaveBeenCalledWith('mockRange');
      });
    });

    it('switches to Prompt mode when Ask AI is clicked', async () => {
      renderWithProvider(<LanguageToggle />);

      const button = screen.getByTestId('queryPanelFooterLanguageToggle');
      fireEvent.click(button);

      const aiOption = screen.getByText('Ask AI');
      fireEvent.click(aiOption);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_EDITOR_MODE',
        payload: EditorMode.Prompt,
      });

      // Wait for setTimeout to execute
      await waitFor(() => {
        expect(mockFocusOnEditor).toHaveBeenCalledTimes(1);
        expect(mockEditorRef.current.setSelection).toHaveBeenCalledWith('mockRange');
      });
    });

    it('closes popover after clicking an enabled option', async () => {
      // Set up prompt mode so PPL is enabled
      mockSelectIsPromptEditorMode.mockReturnValue(true);
      mockSelectPromptModeIsAvailable.mockReturnValue(true);

      renderWithProvider(<LanguageToggle />);

      const button = screen.getByTestId('queryPanelFooterLanguageToggle');
      fireEvent.click(button);

      // Menu should be visible
      expect(screen.getByText('PPL')).toBeInTheDocument();

      // Click an enabled option
      const pplOption = screen.getByText('PPL');
      fireEvent.click(pplOption);

      // Menu should be closed (items not visible) - wait for state update
      await waitFor(() => {
        expect(screen.queryByText('PPL')).not.toBeInTheDocument();
      });
    });
  });
});
