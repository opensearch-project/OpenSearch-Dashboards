/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Mock @ag-ui/client before any imports that use it
jest.mock('@ag-ui/client', () => ({
  parseSSEStream: jest.fn(),
  runHttpRequest: jest.fn(),
}));

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Subject } from 'rxjs';
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

// Mock getServices to provide language title
const mockGetLanguage = jest.fn();
const mockGetTab = jest.fn();
const mockGetQuery = jest.fn(() => ({ dataset: undefined }));
const mockSetUserQueryLanguage = jest.fn();
const mockSetQuery = jest.fn();
const mockIsLanguageSupportedForDataset = jest.fn();
// Default getUpdates$ subscription is a no-op so existing tests are unaffected.
const mockUnsubscribe = jest.fn();
let mockGetUpdates$ = jest.fn(() => ({
  subscribe: () => ({ unsubscribe: mockUnsubscribe }),
}));
let mockSqlSupportEnabled = true;
jest.mock('../../../../services/services', () => ({
  getServices: () => ({
    sqlSupportEnabled: mockSqlSupportEnabled,
    tabRegistry: {
      getTab: mockGetTab,
    },
    data: {
      query: {
        queryString: {
          getLanguageService: () => ({
            getLanguage: mockGetLanguage,
            setUserQueryLanguage: mockSetUserQueryLanguage,
            isLanguageSupportedForDataset: mockIsLanguageSupportedForDataset,
          }),
          getQuery: mockGetQuery,
          setQuery: mockSetQuery,
          getUpdates$: () => mockGetUpdates$(),
        },
      },
    },
  }),
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

// Mock the action creators from the slices module
jest.mock('../../../../application/utils/state_management/slices', () => ({
  setEditorMode: jest.fn((mode) => ({ type: 'SET_EDITOR_MODE', payload: mode })),
  setQueryWithHistory: jest.fn((payload) => ({ type: 'SET_QUERY_WITH_HISTORY', payload })),
}));

// Mock the selectors directly
jest.mock('../../../../application/utils/state_management/selectors', () => ({
  selectIsPromptEditorMode: jest.fn(),
  selectPromptModeIsAvailable: jest.fn(),
  selectQueryLanguage: jest.fn(),
  selectActiveTabId: jest.fn(),
}));

// Mock onEditorRunActionCreator
jest.mock(
  '../../../../application/utils/state_management/actions/query_editor/on_editor_run/on_editor_run',
  () => ({
    onEditorRunActionCreator: jest.fn(() => ({ type: 'ON_EDITOR_RUN' })),
  })
);

// Mock redux hooks
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

// Import the mocked selectors
import {
  selectActiveTabId,
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
const mockSelectActiveTabId = selectActiveTabId as jest.MockedFunction<typeof selectActiveTabId>;

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
    mockSelectActiveTabId.mockReturnValue('logs');
    mockGetLanguage.mockReturnValue({ title: 'PPL' });
    mockGetTab.mockReturnValue({ supportedLanguages: ['PPL'] });
    mockSqlSupportEnabled = true;
    mockGetQuery.mockReturnValue({ dataset: undefined });
    // By default every language is supported for the current dataset so existing
    // tests are unaffected by the per-dataset gating.
    mockIsLanguageSupportedForDataset.mockReturnValue(true);
    // Default getUpdates$ subscription is a no-op (does not re-run the effect).
    mockGetUpdates$ = jest.fn(() => ({
      subscribe: () => ({ unsubscribe: mockUnsubscribe }),
    }));
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

  describe('Language Title from Service', () => {
    it('should show PromQL when using PROMQL language', () => {
      mockSelectQueryLanguage.mockReturnValue('PROMQL');
      mockGetLanguage.mockReturnValue({ title: 'PromQL' });

      renderWithProvider(<LanguageToggle />);

      expect(screen.getByTestId('queryPanelFooterLanguageToggle')).toBeInTheDocument();

      const button = screen.getByTestId('queryPanelFooterLanguageToggle');
      fireEvent.click(button);

      // Should show PromQL option (title from language service)
      expect(screen.getByTestId('queryPanelFooterLanguageToggle-PromQL')).toBeInTheDocument();
      expect(screen.queryByTestId('queryPanelFooterLanguageToggle-PPL')).not.toBeInTheDocument();
    });

    it('should show PPL when using PPL language', () => {
      mockSelectQueryLanguage.mockReturnValue('PPL');
      mockGetLanguage.mockReturnValue({ title: 'PPL' });

      renderWithProvider(<LanguageToggle />);

      expect(screen.getByTestId('queryPanelFooterLanguageToggle')).toBeInTheDocument();

      const button = screen.getByTestId('queryPanelFooterLanguageToggle');
      fireEvent.click(button);

      // Should show PPL option
      expect(screen.getByTestId('queryPanelFooterLanguageToggle-PPL')).toBeInTheDocument();
      expect(screen.queryByTestId('queryPanelFooterLanguageToggle-PromQL')).not.toBeInTheDocument();
    });

    it('should fallback to language ID when title is not available', async () => {
      mockSelectQueryLanguage.mockReturnValue('UNKNOWN');
      mockGetLanguage.mockReturnValue(undefined);
      mockGetTab.mockReturnValue({ supportedLanguages: ['UNKNOWN'] });

      renderWithProvider(<LanguageToggle />);

      expect(screen.getByTestId('queryPanelFooterLanguageToggle')).toBeInTheDocument();

      const button = screen.getByTestId('queryPanelFooterLanguageToggle');
      fireEvent.click(button);

      // Should show the language ID as fallback
      await waitFor(() => {
        expect(screen.getByTestId('queryPanelFooterLanguageToggle-UNKNOWN')).toBeInTheDocument();
      });
    });
  });

  describe('SQL Feature Flag', () => {
    it('should show SQL option when feature flag is enabled and tab supports SQL', async () => {
      mockSqlSupportEnabled = true;
      mockGetTab.mockReturnValue({ supportedLanguages: ['PPL', 'SQL'] });
      mockGetLanguage.mockImplementation((lang: string) => ({ title: lang }));

      renderWithProvider(<LanguageToggle />);
      const button = screen.getByTestId('queryPanelFooterLanguageToggle');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('queryPanelFooterLanguageToggle-SQL')).toBeInTheDocument();
      });
      expect(screen.getByTestId('queryPanelFooterLanguageToggle-PPL')).toBeInTheDocument();
    });

    it('should HIDE SQL option when feature flag is disabled, even if tab supports SQL', async () => {
      mockSqlSupportEnabled = false;
      mockGetTab.mockReturnValue({ supportedLanguages: ['PPL', 'SQL'] });
      mockGetLanguage.mockImplementation((lang: string) => ({ title: lang }));

      renderWithProvider(<LanguageToggle />);
      const button = screen.getByTestId('queryPanelFooterLanguageToggle');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('queryPanelFooterLanguageToggle-PPL')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('queryPanelFooterLanguageToggle-SQL')).not.toBeInTheDocument();
    });

    it('should not show SQL when tab does not support it, regardless of feature flag', async () => {
      mockSqlSupportEnabled = true;
      mockGetTab.mockReturnValue({ supportedLanguages: ['PPL'] }); // No SQL
      mockGetLanguage.mockImplementation((lang: string) => ({ title: lang }));

      renderWithProvider(<LanguageToggle />);
      const button = screen.getByTestId('queryPanelFooterLanguageToggle');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('queryPanelFooterLanguageToggle-PPL')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('queryPanelFooterLanguageToggle-SQL')).not.toBeInTheDocument();
    });

    it('should fallback to PPL only when tab is not resolved, even with feature flag enabled', async () => {
      mockSqlSupportEnabled = true;
      mockGetTab.mockReturnValue(undefined); // Tab not resolved
      mockGetLanguage.mockImplementation((lang: string) => ({ title: lang }));

      renderWithProvider(<LanguageToggle />);
      const button = screen.getByTestId('queryPanelFooterLanguageToggle');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('queryPanelFooterLanguageToggle-PPL')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('queryPanelFooterLanguageToggle-SQL')).not.toBeInTheDocument();
    });

    it('should fallback to PPL only when tab is not resolved and feature flag is disabled', async () => {
      mockSqlSupportEnabled = false;
      mockGetTab.mockReturnValue(undefined); // Tab not resolved
      mockGetLanguage.mockImplementation((lang: string) => ({ title: lang }));

      renderWithProvider(<LanguageToggle />);
      const button = screen.getByTestId('queryPanelFooterLanguageToggle');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('queryPanelFooterLanguageToggle-PPL')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('queryPanelFooterLanguageToggle-SQL')).not.toBeInTheDocument();
    });
  });

  describe('Per-Dataset Language Gating', () => {
    it('should EXCLUDE SQL and PPL when the dataset does not support them (e.g. Elasticsearch below min version)', async () => {
      mockSqlSupportEnabled = true;
      mockGetTab.mockReturnValue({ supportedLanguages: ['PPL', 'SQL'] });
      mockGetLanguage.mockImplementation((lang: string) => ({ title: lang }));
      // Simulate a legacy Elasticsearch dataset that supports neither SQL nor PPL.
      mockGetQuery.mockReturnValue({ dataset: { id: 'es-legacy', type: 'INDEX_PATTERN' } });
      mockIsLanguageSupportedForDataset.mockImplementation((langConfig: { title: string }) => {
        return langConfig.title !== 'SQL' && langConfig.title !== 'PPL';
      });

      renderWithProvider(<LanguageToggle />);
      const button = screen.getByTestId('queryPanelFooterLanguageToggle');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('queryPanelFooterLanguageToggle-AI')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('queryPanelFooterLanguageToggle-SQL')).not.toBeInTheDocument();
      expect(screen.queryByTestId('queryPanelFooterLanguageToggle-PPL')).not.toBeInTheDocument();
    });

    it('should keep a language whose config is not resolved (getLanguage returns undefined)', async () => {
      mockSqlSupportEnabled = true;
      mockGetTab.mockReturnValue({ supportedLanguages: ['PPL'] });
      // No language config -> gating must not drop the language.
      mockGetLanguage.mockReturnValue(undefined);
      mockGetQuery.mockReturnValue({ dataset: { id: 'es-legacy', type: 'INDEX_PATTERN' } });
      // Even though this would return false, it should never be consulted for an
      // unresolved language config.
      mockIsLanguageSupportedForDataset.mockReturnValue(false);

      renderWithProvider(<LanguageToggle />);
      const button = screen.getByTestId('queryPanelFooterLanguageToggle');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('queryPanelFooterLanguageToggle-PPL')).toBeInTheDocument();
      });
    });

    it('should keep SQL/PPL when the dataset supports them', async () => {
      mockSqlSupportEnabled = true;
      mockGetTab.mockReturnValue({ supportedLanguages: ['PPL', 'SQL'] });
      mockGetLanguage.mockImplementation((lang: string) => ({ title: lang }));
      mockGetQuery.mockReturnValue({ dataset: { id: 'os-cluster', type: 'INDEX_PATTERN' } });
      mockIsLanguageSupportedForDataset.mockReturnValue(true);

      renderWithProvider(<LanguageToggle />);
      const button = screen.getByTestId('queryPanelFooterLanguageToggle');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('queryPanelFooterLanguageToggle-SQL')).toBeInTheDocument();
      });
      expect(screen.getByTestId('queryPanelFooterLanguageToggle-PPL')).toBeInTheDocument();
    });

    it('should HIDE SQL via feature flag independently of dataset gating', async () => {
      mockSqlSupportEnabled = false;
      mockGetTab.mockReturnValue({ supportedLanguages: ['PPL', 'SQL'] });
      mockGetLanguage.mockImplementation((lang: string) => ({ title: lang }));
      mockGetQuery.mockReturnValue({ dataset: { id: 'os-cluster', type: 'INDEX_PATTERN' } });
      // Dataset would allow SQL, but the feature flag must still filter it out.
      mockIsLanguageSupportedForDataset.mockReturnValue(true);

      renderWithProvider(<LanguageToggle />);
      const button = screen.getByTestId('queryPanelFooterLanguageToggle');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('queryPanelFooterLanguageToggle-PPL')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('queryPanelFooterLanguageToggle-SQL')).not.toBeInTheDocument();
    });

    it('should re-run the language gating when queryString emits an update', async () => {
      mockSqlSupportEnabled = true;
      mockGetTab.mockReturnValue({ supportedLanguages: ['PPL', 'SQL'] });
      mockGetLanguage.mockImplementation((lang: string) => ({ title: lang }));
      mockGetQuery.mockReturnValue({ dataset: { id: 'os-cluster', type: 'INDEX_PATTERN' } });
      // Wire a real Subject so emitting re-runs updateSupportedLanguages.
      const updates$ = new Subject<void>();
      mockGetUpdates$ = jest.fn(() => updates$);

      // Initially every language is supported.
      mockIsLanguageSupportedForDataset.mockReturnValue(true);

      renderWithProvider(<LanguageToggle />);
      const button = screen.getByTestId('queryPanelFooterLanguageToggle');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('queryPanelFooterLanguageToggle-SQL')).toBeInTheDocument();
      });

      // Switch the dataset to one that no longer supports SQL, then emit an update.
      mockIsLanguageSupportedForDataset.mockImplementation((langConfig: { title: string }) => {
        return langConfig.title !== 'SQL';
      });
      act(() => {
        updates$.next();
      });

      await waitFor(() => {
        expect(screen.queryByTestId('queryPanelFooterLanguageToggle-SQL')).not.toBeInTheDocument();
      });
      expect(screen.getByTestId('queryPanelFooterLanguageToggle-PPL')).toBeInTheDocument();
    });
  });
});
