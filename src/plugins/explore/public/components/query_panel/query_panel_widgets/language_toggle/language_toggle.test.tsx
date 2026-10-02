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
import { Dataset } from '../../../../../../data/common';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { LanguageToggle } from './language_toggle';
import { EditorMode } from '../../../../application/utils/state_management/types';
import {
  SourceTypeRegistryService,
  setSourceTypeRegistry,
} from '../../../../services/source_type_registry';

jest.mock('../../../../helpers/use_flavor_id', () => ({
  useFlavorId: () => 'logs',
}));

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
const mockGetQuery = jest.fn((): { dataset?: { id: string; type: string } } => ({
  dataset: undefined,
}));
const mockSetUserQueryLanguage = jest.fn();
const mockSetQuery = jest.fn();
const mockIsLanguageSupportedForDataset = jest.fn();
// Default getUpdates$ subscription is a no-op so existing tests are unaffected.
const mockUnsubscribe = jest.fn();
let mockGetUpdates$ = jest.fn(() => ({
  subscribe: () => ({ unsubscribe: mockUnsubscribe }),
}));
// Dataset-type lookup. Default: no registered type (getType -> undefined), matching the base
// panel. Tests override to declare a type's own supportedLanguages (the source of truth).
let mockGetType: jest.Mock = jest.fn((_type?: string) => undefined);
// The registered tabs' languages, used as the no-active-tab fallback base (the union of what
// Explore exposes). Default mirrors the logs-flavor tabs.
let mockGetAllTabs = jest.fn(() => [{ supportedLanguages: ['PPL', 'SQL', 'FakeQL'] }]);
let mockSqlSupportEnabled = true;
const mockAddWarning = jest.fn();
jest.mock('../../../../services/services', () => ({
  getServices: () => ({
    sqlSupportEnabled: mockSqlSupportEnabled,
    notifications: { toasts: { addWarning: mockAddWarning, addError: jest.fn() } },
    docLinks: {
      links: {
        noDocumentation: {
          sqlPplIndex: {
            base: 'https://docs.test/sql-and-ppl/',
            ppl: 'https://docs.test/sql-and-ppl/ppl/index/',
            sql: 'https://docs.test/sql-and-ppl/sql/index/',
          },
        },
      },
    },
    tabRegistry: {
      getTab: mockGetTab,
      getAllTabs: () => mockGetAllTabs(),
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
          getDatasetService: () => ({
            getType: (type?: string) => mockGetType(type),
            getDefault: () => undefined,
            cacheDataset: jest.fn(),
          }),
          getInitialQueryByDataset: (dataset: { language?: string }) => ({
            language: dataset.language ?? 'PPL',
            query: 'seeded query',
          }),
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
  selectDataset: jest.fn(),
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
  selectDataset,
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
const mockSelectDataset = selectDataset as jest.MockedFunction<typeof selectDataset>;
const testDataset = (id: string, type: string): Dataset => ({ id, title: id, type });

describe('LanguageToggle', () => {
  const renderWithProvider = (component: React.ReactElement) => {
    const mockStore = configureStore({
      // A trivial reducer whose state object identity changes on any dispatched action,
      // so tests can force `useSelector` to re-read the selector mocks (e.g. selectDataset)
      // by dispatching a no-op — mirroring how a real dataset switch re-renders the toggle.
      reducer: { mock: (state = {}, _action) => ({ ...state }) },
    });
    return { ...render(<Provider store={mockStore}>{component}</Provider>), mockStore };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Set default return values for selectors
    mockSelectIsPromptEditorMode.mockReturnValue(false);
    mockSelectPromptModeIsAvailable.mockReturnValue(true);
    mockSelectQueryLanguage.mockReturnValue('PPL');
    mockSelectActiveTabId.mockReturnValue('logs');
    mockSelectDataset.mockReturnValue(undefined);
    setSourceTypeRegistry(new SourceTypeRegistryService());
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
    // Default: no dataset type registered.
    mockGetType = jest.fn((_type?: string) => undefined);
    mockGetAllTabs = jest.fn(() => [{ supportedLanguages: ['PPL', 'SQL', 'FakeQL'] }]);
  });

  it('renders the language toggle button', () => {
    renderWithProvider(<LanguageToggle />);

    const button = screen.getByTestId('queryPanelFooterLanguageToggle');
    expect(button).toBeInTheDocument();
  });

  it('renders the documentation link only once the picker is opened', () => {
    mockSelectQueryLanguage.mockReturnValue('SQL');
    mockGetLanguage.mockReturnValue({ title: 'SQL' });
    renderWithProvider(<LanguageToggle />);

    expect(screen.queryByTestId('exploreQueryPanelLearnMore')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle'));

    // Which url it resolves to is the link's own concern, covered in its unit test.
    expect(screen.getByTestId('exploreQueryPanelLearnMore')).toBeInTheDocument();
  });

  it('hides the documentation link in prompt mode, where no language chip is selected', () => {
    mockSelectIsPromptEditorMode.mockReturnValue(true);
    renderWithProvider(<LanguageToggle />);

    fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle'));

    expect(screen.getByTestId('queryPanelFooterLanguageToggle-AI')).toHaveAttribute(
      'aria-current',
      'true'
    );
    expect(screen.queryByTestId('exploreQueryPanelLearnMore')).not.toBeInTheDocument();
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
    it('marks the current PPL option as current, and leaves it enabled', () => {
      renderWithProvider(<LanguageToggle />);

      const button = screen.getByTestId('queryPanelFooterLanguageToggle');
      fireEvent.click(button);

      // Selection is conveyed semantically rather than by disabling the control,
      // which would announce as unavailable and leave the tab order.
      const pplOption = screen.getByTestId('queryPanelFooterLanguageToggle-PPL');
      expect(pplOption).toHaveAttribute('aria-current', 'true');
      expect(pplOption).not.toBeDisabled();
    });

    it('does nothing when the already-current language is clicked', () => {
      renderWithProvider(<LanguageToggle />);

      fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle'));
      mockDispatch.mockClear();
      fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle-PPL'));

      expect(mockDispatch).not.toHaveBeenCalled();
      expect(mockSetQuery).not.toHaveBeenCalled();
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

    it('marks the AI option as current in prompt mode, and leaves it enabled', () => {
      mockSelectIsPromptEditorMode.mockReturnValue(true);
      mockSelectPromptModeIsAvailable.mockReturnValue(true);

      renderWithProvider(<LanguageToggle />);

      const button = screen.getByTestId('queryPanelFooterLanguageToggle');
      fireEvent.click(button);

      const aiOption = screen.getByTestId('queryPanelFooterLanguageToggle-AI');
      expect(aiOption).toHaveAttribute('aria-current', 'true');
      expect(aiOption).not.toBeDisabled();
    });

    it('does nothing when the AI chip is clicked while already in prompt mode', () => {
      mockSelectIsPromptEditorMode.mockReturnValue(true);
      mockSelectPromptModeIsAvailable.mockReturnValue(true);

      renderWithProvider(<LanguageToggle />);

      fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle'));
      mockDispatch.mockClear();
      fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle-AI'));

      expect(mockDispatch).not.toHaveBeenCalled();
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

    it('falls back to the dataset type languages when no tab is active (post dataset switch)', async () => {
      // dataset_change_middleware resets activeTabId to EXPLORE_NO_TAB_ID ('') on every dataset
      // switch and never re-runs detectAndSetOptimalTab, so the toggle must not depend on a
      // populated tab. It should reflect the active source via the dataset type's own languages.
      mockSqlSupportEnabled = true;
      mockSelectActiveTabId.mockReturnValue('');
      mockGetTab.mockReturnValue(undefined);
      mockGetLanguage.mockImplementation((lang: string) => ({ title: lang }));
      mockGetQuery.mockReturnValue({ dataset: { id: 'fake-1', type: 'FAKE' } });
      mockSelectDataset.mockReturnValue(testDataset('fake-1', 'FAKE'));
      mockIsLanguageSupportedForDataset.mockReturnValue(true);
      // The registered source's dataset type declares only its own language.
      mockGetType = jest.fn(() => ({
        supportedLanguages: () => ['FakeQL'],
      }));

      renderWithProvider(<LanguageToggle />);
      fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle'));

      await waitFor(() => {
        expect(screen.getByTestId('queryPanelFooterLanguageToggle-FakeQL')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('queryPanelFooterLanguageToggle-PPL')).not.toBeInTheDocument();
    });

    it('does not leak Explore-unsupported languages (DQL/Lucene) in the no-tab fallback', async () => {
      // Index patterns declare DQL/Lucene/PPL/SQL, but Explore has no tab for DQL or Lucene.
      // With no active tab, the fallback must intersect the dataset type's list with the tab
      // union so only Explore-exposed languages appear.
      mockSqlSupportEnabled = true;
      mockSelectActiveTabId.mockReturnValue('');
      mockGetTab.mockReturnValue(undefined);
      mockGetLanguage.mockImplementation((lang: string) => ({ title: lang }));
      mockGetQuery.mockReturnValue({ dataset: { id: 'os', type: 'INDEX_PATTERN' } });
      mockSelectDataset.mockReturnValue(testDataset('os', 'INDEX_PATTERN'));
      mockIsLanguageSupportedForDataset.mockReturnValue(true);
      mockGetType = jest.fn(() => ({
        supportedLanguages: () => ['DQL', 'Lucene', 'PPL', 'SQL'],
      }));

      renderWithProvider(<LanguageToggle />);
      fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle'));

      await waitFor(() => {
        expect(screen.getByTestId('queryPanelFooterLanguageToggle-PPL')).toBeInTheDocument();
      });
      expect(screen.getByTestId('queryPanelFooterLanguageToggle-SQL')).toBeInTheDocument();
      expect(screen.queryByTestId('queryPanelFooterLanguageToggle-DQL')).not.toBeInTheDocument();
      expect(screen.queryByTestId('queryPanelFooterLanguageToggle-Lucene')).not.toBeInTheDocument();
    });

    it('shows PPL and SQL for an OpenSearch dataset right after a dataset switch', async () => {
      // No active tab yet; with only OpenSearch registered, the list matches the Logs tab's.
      mockSqlSupportEnabled = true;
      mockSelectActiveTabId.mockReturnValue('');
      mockGetTab.mockReturnValue(undefined);
      mockGetAllTabs = jest.fn(() => [
        { supportedLanguages: ['PPL', 'SQL'] },
        { supportedLanguages: ['PPL'] },
      ]);
      mockGetLanguage.mockImplementation((lang: string) => ({ title: lang }));
      mockSelectDataset.mockReturnValue(testDataset('os', 'INDEX_PATTERN'));
      mockIsLanguageSupportedForDataset.mockReturnValue(true);
      mockGetType = jest.fn(() => ({
        supportedLanguages: () => ['kuery', 'lucene', 'PPL', 'SQL'],
      }));

      renderWithProvider(<LanguageToggle />);
      fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle'));

      await waitFor(() => {
        expect(screen.getByTestId('queryPanelFooterLanguageToggle-SQL')).toBeInTheDocument();
      });
      expect(screen.getByTestId('queryPanelFooterLanguageToggle-PPL')).toBeInTheDocument();
      expect(screen.queryByTestId('queryPanelFooterLanguageToggle-kuery')).not.toBeInTheDocument();
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

    it('should re-run the language gating when the active dataset changes', async () => {
      mockSqlSupportEnabled = true;
      mockGetTab.mockReturnValue({ supportedLanguages: ['PPL', 'SQL'] });
      mockGetLanguage.mockImplementation((lang: string) => ({ title: lang }));
      mockGetQuery.mockReturnValue({ dataset: { id: 'os-cluster', type: 'INDEX_PATTERN' } });
      mockSelectDataset.mockReturnValue(testDataset('os-cluster', 'INDEX_PATTERN'));

      // Initially every language is supported.
      mockIsLanguageSupportedForDataset.mockReturnValue(true);

      const { mockStore } = renderWithProvider(<LanguageToggle />);
      const button = screen.getByTestId('queryPanelFooterLanguageToggle');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('queryPanelFooterLanguageToggle-SQL')).toBeInTheDocument();
      });

      // Switch to a dataset that no longer supports SQL. The effect keys off the redux
      // `selectDataset` value, so return a new dataset and dispatch to force useSelector to
      // re-read — mirroring a real dataset switch.
      mockIsLanguageSupportedForDataset.mockImplementation((langConfig: { title: string }) => {
        return langConfig.title !== 'SQL';
      });
      mockSelectDataset.mockReturnValue(testDataset('other-cluster', 'INDEX_PATTERN'));
      act(() => {
        mockStore.dispatch({ type: 'noop' });
      });

      await waitFor(() => {
        expect(screen.queryByTestId('queryPanelFooterLanguageToggle-SQL')).not.toBeInTheDocument();
      });
      expect(screen.getByTestId('queryPanelFooterLanguageToggle-PPL')).toBeInTheDocument();
    });
  });

  describe('Picker Layout', () => {
    it('renders the source type section with OpenSearch as the selected entry', () => {
      renderWithProvider(<LanguageToggle />);

      fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle'));

      const sourceType = screen.getByTestId('queryPanelFooterSourceType-OpenSearch');
      expect(sourceType).toHaveTextContent('OpenSearch');
      expect(sourceType).toHaveClass('exploreLanguagePicker__sourceType--selected');
    });

    it('marks only the current language chip as selected', async () => {
      mockGetTab.mockReturnValue({ supportedLanguages: ['PPL', 'SQL'] });
      mockGetLanguage.mockImplementation((lang: string) => ({ title: lang }));

      renderWithProvider(<LanguageToggle />);

      fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle'));

      await waitFor(() => {
        expect(screen.getByTestId('queryPanelFooterLanguageToggle-SQL')).toBeInTheDocument();
      });
      expect(screen.getByTestId('queryPanelFooterLanguageToggle-PPL')).toHaveClass(
        'exploreLanguagePicker__chip--selected'
      );
      expect(screen.getByTestId('queryPanelFooterLanguageToggle-SQL')).not.toHaveClass(
        'exploreLanguagePicker__chip--selected'
      );
    });

    it('marks the AI chip as selected in prompt mode and leaves the language chips unselected', () => {
      mockSelectIsPromptEditorMode.mockReturnValue(true);

      renderWithProvider(<LanguageToggle />);

      fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle'));

      expect(screen.getByTestId('queryPanelFooterLanguageToggle-AI')).toHaveClass(
        'exploreLanguagePicker__chip--selected'
      );
      expect(screen.getByTestId('queryPanelFooterLanguageToggle-PPL')).not.toHaveClass(
        'exploreLanguagePicker__chip--selected'
      );
    });

    it('does not render the AI chip when hideAI is set, even if prompt mode is available', () => {
      mockSelectPromptModeIsAvailable.mockReturnValue(true);

      renderWithProvider(<LanguageToggle hideAI />);

      fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle'));

      expect(screen.getByTestId('queryPanelFooterLanguageToggle-PPL')).toBeInTheDocument();
      expect(screen.queryByTestId('queryPanelFooterLanguageToggle-AI')).not.toBeInTheDocument();
    });

    it('labels both columns as groups so the headings are announced as group names', () => {
      renderWithProvider(<LanguageToggle />);

      fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle'));

      expect(screen.getByRole('group', { name: 'Source type' })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'Query language' })).toBeInTheDocument();
    });

    it('exposes the trigger as a disclosure rather than a menu button', () => {
      renderWithProvider(<LanguageToggle />);

      // The panel is a labelled group of buttons, not a menu, so aria-haspopup
      // (whose `true` value means "menu") must not be claimed.
      const trigger = screen.getByTestId('queryPanelFooterLanguageToggle');
      expect(trigger).not.toHaveAttribute('aria-haspopup');
    });

    it('reflects the popover open state on the trigger', () => {
      renderWithProvider(<LanguageToggle />);

      const trigger = screen.getByTestId('queryPanelFooterLanguageToggle');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveTextContent('PPL');

      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Registered source types', () => {
    const fakeDataset = { id: 'fake-1', title: 'fake-1', type: 'FAKE', language: 'FakeQL' };
    const registerFakeSource = (
      resolveDefaultDataset: () => Promise<typeof fakeDataset | undefined>,
      flavors?: any[]
    ) => {
      const registry = new SourceTypeRegistryService();
      registry.register({
        id: 'fake',
        label: 'Fake',
        datasetTypes: ['FAKE'],
        flavors,
        resolveDefaultDataset,
      });
      setSourceTypeRegistry(registry);
    };

    it('lists every source type for the flavor as a selectable entry', () => {
      registerFakeSource(async () => fakeDataset);
      renderWithProvider(<LanguageToggle />);
      fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle'));

      expect(screen.getByTestId('queryPanelFooterSourceType-OpenSearch')).toHaveAttribute(
        'aria-current',
        'true'
      );
      expect(screen.getByTestId('queryPanelFooterSourceType-Fake')).not.toHaveAttribute(
        'aria-current'
      );
    });

    it('shows the OpenSearch logo while OpenSearch is active', () => {
      registerFakeSource(async () => fakeDataset);
      renderWithProvider(<LanguageToggle />);

      expect(screen.getByTestId('queryPanelFooterSourceTypeIcon')).toHaveAttribute(
        'data-euiicon-type',
        'logoOpenSearch'
      );
    });

    it("shows the active dataset type's icon for a registered source", () => {
      registerFakeSource(async () => fakeDataset);
      mockGetQuery.mockReturnValue({ dataset: { id: 'fake-1', type: 'FAKE' } });
      mockSelectDataset.mockReturnValue(testDataset('fake-1', 'FAKE'));
      mockGetType = jest.fn(() => ({
        meta: { icon: { type: 'logsApp' } },
        supportedLanguages: () => ['FakeQL'],
      }));

      renderWithProvider(<LanguageToggle />);

      expect(screen.getByTestId('queryPanelFooterSourceTypeIcon')).toHaveAttribute(
        'data-euiicon-type',
        'logsApp'
      );
    });

    it("prefers the source type's own icon", () => {
      const registry = new SourceTypeRegistryService();
      registry.register({
        id: 'fake',
        label: 'Fake',
        icon: 'cloudSunny',
        datasetTypes: ['FAKE'],
        resolveDefaultDataset: async () => fakeDataset,
      });
      setSourceTypeRegistry(registry);
      mockGetQuery.mockReturnValue({ dataset: { id: 'fake-1', type: 'FAKE' } });
      mockSelectDataset.mockReturnValue(testDataset('fake-1', 'FAKE'));
      mockGetType = jest.fn(() => ({
        meta: { icon: { type: 'logsApp' } },
        supportedLanguages: () => ['FakeQL'],
      }));

      renderWithProvider(<LanguageToggle />);

      expect(screen.getByTestId('queryPanelFooterSourceTypeIcon')).toHaveAttribute(
        'data-euiicon-type',
        'cloudSunny'
      );
    });

    it('hides source types registered for other flavors', () => {
      registerFakeSource(async () => fakeDataset, ['traces']);
      renderWithProvider(<LanguageToggle />);
      fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle'));

      expect(screen.queryByTestId('queryPanelFooterSourceType-Fake')).not.toBeInTheDocument();
    });

    it("switches to the source's default dataset with an empty editor", async () => {
      const resolve = jest.fn(async () => fakeDataset);
      registerFakeSource(resolve);
      renderWithProvider(<LanguageToggle />);
      fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle'));
      fireEvent.click(screen.getByTestId('queryPanelFooterSourceType-Fake'));

      await waitFor(() => {
        expect(mockSetQuery).toHaveBeenCalledWith({
          language: 'FakeQL',
          query: '',
          dataset: fakeDataset,
        });
      });
      expect(resolve).toHaveBeenCalledWith({
        data: expect.anything(),
        flavor: 'logs',
      });
      // The editor and the stored user language follow the switch, as a dataset pick does.
      expect(mockClearEditors).toHaveBeenCalled();
      expect(mockSetUserQueryLanguage).toHaveBeenCalledWith('FakeQL');
    });

    it('offers only sources with visual builder support in a builder-only workspace', () => {
      const registry = new SourceTypeRegistryService();
      registry.register({
        id: 'fake',
        label: 'Fake',
        datasetTypes: ['FAKE'],
        resolveDefaultDataset: async () => fakeDataset,
        languageSettings: { FakeQL: {} }, // code-only: no visual builder
      });
      setSourceTypeRegistry(registry);
      renderWithProvider(<LanguageToggle builderOnly />);
      fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle'));

      expect(screen.queryByTestId('queryPanelFooterSourceType-Fake')).not.toBeInTheDocument();
      expect(screen.getByTestId('queryPanelFooterSourceType-OpenSearch')).toBeInTheDocument();
    });

    it('warns instead of switching when the source has no dataset', async () => {
      registerFakeSource(async () => undefined);
      renderWithProvider(<LanguageToggle />);
      fireEvent.click(screen.getByTestId('queryPanelFooterLanguageToggle'));
      fireEvent.click(screen.getByTestId('queryPanelFooterSourceType-Fake'));

      await waitFor(() => {
        expect(mockAddWarning).toHaveBeenCalledWith({
          title: 'No Fake dataset found to query',
        });
      });
      expect(mockSetQuery).not.toHaveBeenCalled();
    });
  });
});
