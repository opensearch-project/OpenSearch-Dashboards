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
import { useCancelButtonTiming } from '../../../../../data/public/ui/hooks/use_cancel_button_timing';

// Mock the validation function
jest.mock('../utils/validate_time_range', () => ({
  isTimeRangeInvalid: jest.fn(() => false),
}));

jest.mock('../../../../../data/public/ui/hooks/use_cancel_button_timing', () => ({
  useCancelButtonTiming: jest.fn((shouldShow: boolean) => shouldShow),
}));

const mockIsTimeRangeInvalid = isTimeRangeInvalid as jest.MockedFunction<typeof isTimeRangeInvalid>;
const mockUseCancelButtonTiming = useCancelButtonTiming as jest.MockedFunction<
  typeof useCancelButtonTiming
>;

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
        // @ts-expect-error TS2741 TODO(ts-error): fixme
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
          hasUserInitiatedQuery: false,
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
    mockUseCancelButtonTiming.mockImplementation((shouldShow: boolean) => shouldShow);
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

  it('shows a filled primary button in Update state', () => {
    renderWithProvider(<QueryExecutionButton />, {
      isQueryEditorDirty: true,
    });

    const button = screen.getByTestId('exploreQueryExecutionButton');
    // Verify the button shows "Update" text when needsUpdate is true
    expect(screen.getByText('Update')).toBeInTheDocument();
    // Always primary: the state shows in the label, not the colour.
    expect(button).toHaveClass('euiButton--primary');
    expect(button).toHaveClass('euiButton--fill');
  });

  it('shows a filled primary button in Refresh state', () => {
    renderWithProvider(<QueryExecutionButton />);

    const button = screen.getByTestId('exploreQueryExecutionButton');
    expect(screen.getByText('Refresh')).toBeInTheDocument();
    expect(button).toHaveClass('euiButton--primary');
    expect(button).toHaveClass('euiButton--fill');
  });

  it('shows an unfilled button when the date range is invalid', () => {
    // Filled + disabled renders a solid grey block that reads as enabled, so the disabled
    // state stays hollow.
    mockIsTimeRangeInvalid.mockReturnValue(true);

    renderWithProvider(<QueryExecutionButton />, {
      dateRange: { from: 'invalid', to: 'invalid' },
    });

    const button = screen.getByTestId('exploreQueryExecutionButton');
    expect(button).toBeDisabled();
    expect(button).not.toHaveClass('euiButton--fill');
  });

  describe('Run and Stop', () => {
    const running = {
      overallQueryStatus: {
        status: QueryExecutionStatus.LOADING,
        elapsedMs: undefined,
        startTime: Date.now(),
      },
      hasUserInitiatedQuery: true,
    };

    it('reads Stop while a user-initiated query is running', () => {
      renderWithProvider(<QueryExecutionButton onCancel={jest.fn()} />, running);

      expect(screen.getByTestId('exploreQueryStopButton')).toHaveTextContent('Stop');
      expect(screen.queryByTestId('exploreQueryExecutionButton')).not.toBeInTheDocument();
      expect(screen.queryByTestId('exploreQueryCancelButton')).not.toBeInTheDocument();
    });

    it('calls onCancel, not onClick, when Stop is clicked', () => {
      const mockOnClick = jest.fn();
      const mockOnCancel = jest.fn();

      renderWithProvider(
        <QueryExecutionButton onClick={mockOnClick} onCancel={mockOnCancel} />,
        running
      );
      screen.getByTestId('exploreQueryStopButton').click();

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('does not offer Stop for a query the user did not start', () => {
      renderWithProvider(<QueryExecutionButton onCancel={jest.fn()} />, {
        ...running,
        hasUserInitiatedQuery: false,
      });

      expect(screen.getByTestId('exploreQueryExecutionButton')).toHaveTextContent('Refresh');
      expect(screen.queryByTestId('exploreQueryStopButton')).not.toBeInTheDocument();
    });

    it('returns to Refresh once the query has finished', () => {
      renderWithProvider(<QueryExecutionButton onCancel={jest.fn()} />, {
        overallQueryStatus: {
          status: QueryExecutionStatus.READY,
          elapsedMs: 100,
          startTime: Date.now() - 100,
        },
        hasUserInitiatedQuery: true,
      });

      expect(screen.getByTestId('exploreQueryExecutionButton')).toHaveTextContent('Refresh');
    });

    it('offers Stop even when the time range is invalid', () => {
      mockIsTimeRangeInvalid.mockReturnValue(true);
      const mockOnCancel = jest.fn();

      renderWithProvider(<QueryExecutionButton onCancel={mockOnCancel} />, {
        ...running,
        dateRange: { from: 'invalid', to: 'invalid' },
      });
      const stopButton = screen.getByTestId('exploreQueryStopButton');
      expect(stopButton).toBeEnabled();
      stopButton.click();

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('still publishes the run status while Stop is shown', () => {
      const store = createMockStore({ ...running, isQueryEditorDirty: true });
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      render(
        <OpenSearchDashboardsContextProvider services={mockServices}>
          <Provider store={store}>
            <QueryExecutionButton onCancel={jest.fn()} />
          </Provider>
        </OpenSearchDashboardsContextProvider>
      );

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'queryEditor/setQueryExecutionButtonStatus',
          payload: 'UPDATE',
        })
      );
    });
  });
});
