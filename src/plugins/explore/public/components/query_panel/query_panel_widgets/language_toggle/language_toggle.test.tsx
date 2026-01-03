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

// Mock useFlavorId hook
const mockUseFlavorId = jest.fn();
jest.mock('../../../../helpers/use_flavor_id', () => ({
  useFlavorId: () => mockUseFlavorId(),
}));

// Mock the useLanguageSwitch hook
jest.mock('../../../../application/hooks/editor_hooks/use_switch_language', () => ({
  useLanguageSwitch: () =>
    jest.fn((mode) => {
      mockDispatch({ type: 'SET_EDITOR_MODE', payload: mode });
      // Simulate the selection logic with setTimeout
      const range = mockEditorRef.current?.getModel()?.getFullModelRange();
      if (range) {
        setTimeout(() => mockEditorRef.current?.setSelection(range), 300);
      }
    }),
}));

// Mock the action creator
jest.mock('../../../../application/utils/state_management/slices', () => ({
  setEditorMode: jest.fn((mode) => ({ type: 'SET_EDITOR_MODE', payload: mode })),
}));

// Mock the selectors directly
jest.mock('../../../../application/utils/state_management/selectors', () => ({
  selectIsPromptEditorMode: jest.fn(),
  selectPromptModeIsAvailable: jest.fn(),
  selectQueryLanguage: jest.fn(),
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
  selectQueryLanguage,
} from '../../../../application/utils/state_management/selectors';

const mockSelectIsPromptEditorMode = selectIsPromptEditorMode as jest.MockedFunction<
  typeof selectIsPromptEditorMode
>;
const mockSelectPromptModeIsAvailable = selectPromptModeIsAvailable as jest.MockedFunction<
  typeof selectPromptModeIsAvailable
>;
const mockSelectQueryLanguage = selectQueryLanguage as jest.MockedFunction<
  typeof selectQueryLanguage
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
    mockSelectQueryLanguage.mockReturnValue('PPL');
    mockUseFlavorId.mockReturnValue('logs');
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
    expect(screen.queryByTestId('queryPanelFooterLanguageToggle-PPL')).not.toBeInTheDocument();
    expect(screen.queryByTestId('queryPanelFooterLanguageToggle-AI')).not.toBeInTheDocument();

    // Click to show
    fireEvent.click(button);
    expect(screen.getByTestId('queryPanelFooterLanguageToggle-PPL')).toBeInTheDocument();
    expect(screen.getByTestId('queryPanelFooterLanguageToggle-AI')).toBeInTheDocument();
  });

  describe('Menu Items', () => {
    it('disables PPL option when not in prompt mode', () => {
      renderWithProvider(<LanguageToggle />);

      const button = screen.getByTestId('queryPanelFooterLanguageToggle');
      fireEvent.click(button);

      const pplOption = screen.getByTestId('queryPanelFooterLanguageToggle-PPL');
      expect(pplOption).toBeDisabled();
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

    it('shows AI option when prompt mode is available', () => {
      renderWithProvider(<LanguageToggle />);

      const button = screen.getByTestId('queryPanelFooterLanguageToggle');
      fireEvent.click(button);

      const aiOption = screen.getByText('AI');
      expect(aiOption).toBeInTheDocument();
      expect(aiOption.closest('button')).not.toBeDisabled();
    });

    it('disables AI option when in prompt mode', () => {
      mockSelectIsPromptEditorMode.mockReturnValue(true);
      mockSelectPromptModeIsAvailable.mockReturnValue(true);

      renderWithProvider(<LanguageToggle />);

      const button = screen.getByTestId('queryPanelFooterLanguageToggle');
      fireEvent.click(button);

      const aiOption = screen.getByTestId('queryPanelFooterLanguageToggle-AI');
      expect(aiOption).toBeDisabled();
    });

    it('does not show AI option when prompt mode is not available', () => {
      mockSelectIsPromptEditorMode.mockReturnValue(false);
      mockSelectPromptModeIsAvailable.mockReturnValue(false);

      renderWithProvider(<LanguageToggle />);

      const button = screen.getByTestId('queryPanelFooterLanguageToggle');
      fireEvent.click(button);

      expect(screen.getByTestId('queryPanelFooterLanguageToggle-PPL')).toBeInTheDocument();
      expect(screen.queryByTestId('queryPanelFooterLanguageToggle-AI')).not.toBeInTheDocument();
    });
  });

  describe('Item Click Behavior', () => {
    it('switches to Query mode when PPL is clicked', async () => {
      jest.useFakeTimers();
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

      // Advance timers to trigger the setTimeout(focusOnEditor) call (0ms timeout)
      jest.advanceTimersByTime(0);
      expect(mockFocusOnEditor).toHaveBeenCalledTimes(1);

      // Advance timers to trigger the setTimeout in useLanguageSwitch (300ms timeout)
      jest.advanceTimersByTime(300);
      expect(mockEditorRef.current.setSelection).toHaveBeenCalledWith('mockRange');

      jest.useRealTimers();
    });

    it('switches to Prompt mode when AI is clicked', async () => {
      jest.useFakeTimers();
      renderWithProvider(<LanguageToggle />);

      const button = screen.getByTestId('queryPanelFooterLanguageToggle');
      fireEvent.click(button);

      const aiOption = screen.getByText('AI');
      fireEvent.click(aiOption);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_EDITOR_MODE',
        payload: EditorMode.Prompt,
      });

      // Advance timers to trigger the setTimeout(focusOnEditor) call (0ms timeout)
      jest.advanceTimersByTime(0);
      expect(mockFocusOnEditor).toHaveBeenCalledTimes(1);

      // Advance timers to trigger the setTimeout in useLanguageSwitch (300ms timeout)
      jest.advanceTimersByTime(300);
      expect(mockEditorRef.current.setSelection).toHaveBeenCalledWith('mockRange');

      jest.useRealTimers();
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

  describe('Metrics Flavor', () => {
    it('should not render when flavor is metrics', () => {
      mockUseFlavorId.mockReturnValue('metrics');

      const { container } = renderWithProvider(<LanguageToggle />);

      expect(container.firstChild).toBeNull();
      expect(screen.queryByTestId('queryPanelFooterLanguageToggle')).not.toBeInTheDocument();
    });

    it('should render when flavor is logs', () => {
      mockUseFlavorId.mockReturnValue('logs');

      renderWithProvider(<LanguageToggle />);

      expect(screen.getByTestId('queryPanelFooterLanguageToggle')).toBeInTheDocument();
    });

    it('should render when flavor is traces', () => {
      mockUseFlavorId.mockReturnValue('traces');

      renderWithProvider(<LanguageToggle />);

      expect(screen.getByTestId('queryPanelFooterLanguageToggle')).toBeInTheDocument();
    });

    it('should render when flavor is null', () => {
      mockUseFlavorId.mockReturnValue(null);

      renderWithProvider(<LanguageToggle />);

      expect(screen.getByTestId('queryPanelFooterLanguageToggle')).toBeInTheDocument();
    });
  });
});
