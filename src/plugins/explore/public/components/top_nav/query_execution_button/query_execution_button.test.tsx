/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
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
          visualizations: {
            styleOptions: undefined,
            chartType: undefined,
            axesMapping: {},
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
          editorMode: 'query' as any,
          lastExecutedTranslatedQuery: '',
          lastExecutedPrompt: '',
          queryExecutionButtonStatus: 'REFRESH' as const,
          dateRange: undefined,
          ...initialQueryEditorState,
        },
      },
    });
  };

  const renderWithProvider = (component: React.ReactElement, storeOptions = {}) => {
    const store = createMockStore(storeOptions);
    return render(<Provider store={store}>{component}</Provider>);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock validation function
    mockIsTimeRangeInvalid.mockReturnValue(false);
  });

  it('renders with correct props', () => {
    renderWithProvider(
      <QueryExecutionButton editorText="SELECT * FROM test" services={mockServices} />
    );

    expect(screen.getByTestId('exploreQueryExecutionButton')).toBeInTheDocument();
  });

  it('shows "Update" text when query has changed', async () => {
    renderWithProvider(
      <QueryExecutionButton editorText="SELECT * FROM test" services={mockServices} />
    );

    // Wait for the useEffect to update the Redux state
    await waitFor(() => {
      expect(screen.getByText('Update')).toBeInTheDocument();
    });
  });

  it('shows "Refresh" text when query has not changed', async () => {
    // Mock services to return the same query as editorText
    const servicesWithSameQuery = {
      ...mockServices,
      data: {
        ...mockServices.data,
        query: {
          ...mockServices.data.query,
          queryString: {
            getQuery: jest.fn(() => ({ query: '', language: 'kuery' })),
          },
        },
      },
    };

    renderWithProvider(<QueryExecutionButton editorText="" services={servicesWithSameQuery} />, {
      queryExecutionButtonStatus: 'REFRESH',
    });

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
  });

  it('shows "Update" when date range has changed', async () => {
    renderWithProvider(<QueryExecutionButton editorText="" services={mockServices} />, {
      dateRange: { from: 'now-30m', to: 'now' },
      queryExecutionButtonStatus: 'UPDATE',
    });

    await waitFor(() => {
      expect(screen.getByText('Update')).toBeInTheDocument();
    });
  });

  it('shows disabled button when date range is invalid', async () => {
    // Mock invalid date range
    mockIsTimeRangeInvalid.mockReturnValue(true);

    renderWithProvider(
      <QueryExecutionButton editorText="SELECT * FROM test" services={mockServices} />,
      {
        dateRange: { from: 'invalid', to: 'invalid' },
        queryExecutionButtonStatus: 'DISABLED',
      }
    );

    await waitFor(() => {
      const button = screen.getByTestId('exploreQueryExecutionButton');
      expect(button).toBeDisabled();
      // When disabled, button shows "Refresh" text (the default state)
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
  });

  it('shows disabled "Refresh" button when no changes and date range is invalid', async () => {
    // Mock invalid date range
    mockIsTimeRangeInvalid.mockReturnValue(true);

    const servicesWithSameQuery = {
      ...mockServices,
      data: {
        ...mockServices.data,
        query: {
          ...mockServices.data.query,
          queryString: {
            getQuery: jest.fn(() => ({ query: '', language: 'kuery' })),
          },
        },
      },
    };

    renderWithProvider(<QueryExecutionButton editorText="" services={servicesWithSameQuery} />, {
      dateRange: { from: 'invalid', to: 'invalid' },
      queryExecutionButtonStatus: 'DISABLED',
    });

    await waitFor(() => {
      const button = screen.getByTestId('exploreQueryExecutionButton');
      expect(button).toBeDisabled();
      // Should show "Refresh" text even when disabled
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
  });

  it('handles click events', () => {
    const mockOnClick = jest.fn();

    renderWithProvider(
      <QueryExecutionButton
        editorText="SELECT * FROM test"
        services={mockServices}
        onClick={mockOnClick}
      />
    );

    const button = screen.getByTestId('exploreQueryExecutionButton');
    button.click();

    expect(mockOnClick).toHaveBeenCalled();
  });

  it('dispatches button status to Redux on mount', async () => {
    const store = createMockStore();
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    render(
      <Provider store={store}>
        <QueryExecutionButton editorText="SELECT * FROM test" services={mockServices} />
      </Provider>
    );

    // Wait for the useEffect to run
    await waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'queryEditor/setQueryExecutionButtonStatus',
          payload: 'UPDATE',
        })
      );
    });
  });

  it('updates button status when editorText changes', async () => {
    const store = createMockStore();
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    const { rerender } = render(
      <Provider store={store}>
        <QueryExecutionButton editorText="" services={mockServices} />
      </Provider>
    );

    // Wait for initial dispatch
    await waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'queryEditor/setQueryExecutionButtonStatus',
          payload: 'REFRESH',
        })
      );
    });

    // Clear previous calls
    dispatchSpy.mockClear();

    // Change editorText
    rerender(
      <Provider store={store}>
        <QueryExecutionButton editorText="SELECT * FROM test" services={mockServices} />
      </Provider>
    );

    // Wait for new dispatch
    await waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'queryEditor/setQueryExecutionButtonStatus',
          payload: 'UPDATE',
        })
      );
    });
  });

  it('shows correct needsUpdate state for EuiSuperUpdateButton', async () => {
    renderWithProvider(
      <QueryExecutionButton editorText="SELECT * FROM test" services={mockServices} />,
      { queryExecutionButtonStatus: 'UPDATE' }
    );

    await waitFor(() => {
      const button = screen.getByTestId('exploreQueryExecutionButton');
      // Verify the button shows "Update" text when needsUpdate is true
      expect(screen.getByText('Update')).toBeInTheDocument();
      // Verify the button has the success color (green) when needsUpdate is true
      expect(button).toHaveClass('euiButton--success');
    });
  });
});
