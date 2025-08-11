/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { OpenSearchDashboardsContextProvider } from '../../../../../opensearch_dashboards_react/public';
import { QueryExecutionButton } from './query_execution_button';
import { QueryExecutionStatus } from '../../../application/utils/state_management/types';
import { rootReducer } from '../../../application/utils/state_management/store';
import { isTimeRangeInvalid } from '../utils/validate_time_range';

// Mock the validation function
jest.mock('../utils/validate_time_range', () => ({
  isTimeRangeInvalid: jest.fn(() => false),
}));

const mockIsTimeRangeInvalid = isTimeRangeInvalid as jest.MockedFunction<typeof isTimeRangeInvalid>;

describe('QueryExecutionButton', () => {
  const mockTimefilter = {
    getTime: jest.fn(() => ({ from: 'now-15m', to: 'now' })),
    getTimeUpdate$: jest.fn(() => ({
      subscribe: jest.fn(() => ({
        unsubscribe: jest.fn(),
      })),
    })),
  };

  const mockServices = {
    data: {
      query: {
        timefilter: {
          timefilter: mockTimefilter,
        },
        queryString: {
          getQuery: jest.fn(() => ({ query: '', language: 'kuery' })),
        },
      },
    },
  } as any;

  // Create a mock store with the required state structure
  const createMockStore = (initialQueryEditorState = {}) => {
    return configureStore({
      reducer: rootReducer,
      preloadedState: {
        query: {
          query: '',
          language: 'kuery',
          dataset: undefined,
        },
        ui: {
          activeTabId: '',
          showHistogram: true,
        },
        results: {},
        tab: {
          logs: {},
          patterns: {
            patternsField: undefined,
            usingRegexPatterns: false,
          },
        },
        legacy: {
          columns: ['_source'],
          sort: [],
          isDirty: false,
          savedQuery: undefined,
          lineCount: undefined,
          interval: 'auto',
          savedSearch: undefined,
        },
        queryEditor: {
          queryStatusMap: {},
          overallQueryStatus: {
            status: QueryExecutionStatus.UNINITIALIZED,
            elapsedMs: undefined,
            startTime: undefined,
          },
          promptModeIsAvailable: false,
          promptToQueryIsLoading: false,
          summaryAgentIsAvailable: false,
          editorMode: 'query' as any,
          lastExecutedTranslatedQuery: '',
          lastExecutedPrompt: '',
          queryExecutionButtonStatus: 'REFRESH' as const,
          dateRange: undefined,
          isQueryEditorDirty: false,
          ...initialQueryEditorState,
        },
      },
    });
  };

  const renderWithProvider = (component: React.ReactElement, storeOptions = {}) => {
    const store = createMockStore(storeOptions);
    return render(
      <OpenSearchDashboardsContextProvider services={mockServices}>
        <Provider store={store}>{component}</Provider>
      </OpenSearchDashboardsContextProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock validation function
    mockIsTimeRangeInvalid.mockReturnValue(false);
  });

  it('renders with correct props', () => {
    renderWithProvider(<QueryExecutionButton />);

    expect(screen.getByTestId('exploreQueryExecutionButton')).toBeInTheDocument();
  });

  it('shows "Update" text when query has changed', () => {
    renderWithProvider(<QueryExecutionButton />, {
      isQueryEditorDirty: true,
    });

    // Status is calculated directly during render
    expect(screen.getByText('Update')).toBeInTheDocument();
  });

  it('shows "Refresh" text when query has not changed', () => {
    renderWithProvider(<QueryExecutionButton />);

    // Status is calculated directly during render
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('shows "Update" when date range has changed', () => {
    renderWithProvider(<QueryExecutionButton />, {
      dateRange: { from: 'now-30m', to: 'now' },
    });

    // Status is calculated directly during render
    expect(screen.getByText('Update')).toBeInTheDocument();
  });

  it('shows disabled button when date range is invalid', () => {
    // Mock invalid date range
    mockIsTimeRangeInvalid.mockReturnValue(true);

    renderWithProvider(<QueryExecutionButton />, {
      dateRange: { from: 'invalid', to: 'invalid' },
    });

    const button = screen.getByTestId('exploreQueryExecutionButton');
    expect(button).toBeDisabled();
    // When disabled, button shows "Refresh" text (the default state)
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('shows disabled "Refresh" button when no changes and date range is invalid', () => {
    // Mock invalid date range
    mockIsTimeRangeInvalid.mockReturnValue(true);

    renderWithProvider(<QueryExecutionButton />, {
      dateRange: { from: 'invalid', to: 'invalid' },
    });

    const button = screen.getByTestId('exploreQueryExecutionButton');
    expect(button).toBeDisabled();
    // Should show "Refresh" text even when disabled
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const mockOnClick = jest.fn();

    renderWithProvider(<QueryExecutionButton onClick={mockOnClick} />);

    const button = screen.getByTestId('exploreQueryExecutionButton');
    button.click();

    expect(mockOnClick).toHaveBeenCalled();
  });

  it('dispatches button status to Redux during render', () => {
    const store = createMockStore();
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    render(
      <OpenSearchDashboardsContextProvider services={mockServices}>
        <Provider store={store}>
          <QueryExecutionButton />
        </Provider>
      </OpenSearchDashboardsContextProvider>
    );

    // Dispatch happens synchronously during render
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'queryEditor/setQueryExecutionButtonStatus',
        payload: 'REFRESH',
      })
    );
  });

  it('updates button status when editorText changes', () => {
    const store = createMockStore({
      isQueryEditorDirty: true,
    });
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    render(
      <OpenSearchDashboardsContextProvider services={mockServices}>
        <Provider store={store}>
          <QueryExecutionButton />
        </Provider>
      </OpenSearchDashboardsContextProvider>
    );

    // Dispatch happens synchronously during render with UPDATE status when isQueryEditorDirty is true
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'queryEditor/setQueryExecutionButtonStatus',
        payload: 'UPDATE',
      })
    );
  });

  it('shows correct needsUpdate state for EuiSuperUpdateButton', () => {
    renderWithProvider(<QueryExecutionButton />, {
      isQueryEditorDirty: true,
    });

    const button = screen.getByTestId('exploreQueryExecutionButton');
    // Verify the button shows "Update" text when needsUpdate is true
    expect(screen.getByText('Update')).toBeInTheDocument();
    // Verify the button has the primary color (blue) for consistent theming
    expect(button).toHaveClass('euiButton--primary');
  });
});
