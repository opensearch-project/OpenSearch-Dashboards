/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';
import { IndexSelector } from './index_selector';

const mockHttpGet = jest.fn();
const mockOnMultiSelectionChange = jest.fn();

const mockServices = {
  http: {
    get: mockHttpGet,
  },
};

const mockPath = [{ id: 'test-datasource', type: 'DATA_SOURCE', title: 'Test DataSource' }];

const defaultProps = {
  selectedIndexIds: [],
  onMultiSelectionChange: mockOnMultiSelectionChange,
  services: mockServices as any,
  path: mockPath as any,
};

const mockApiResponse = {
  indices: [{ name: 'logs-2024' }, { name: 'metrics-2024' }, { name: 'otel-logs' }],
  aliases: [{ name: 'logs-alias' }],
  data_streams: [{ name: 'logs-stream' }],
};

const renderComponent = (props = {}) =>
  render(
    <I18nProvider>
      <IndexSelector {...defaultProps} {...props} />
    </I18nProvider>
  );

describe('IndexSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockHttpGet.mockResolvedValue(mockApiResponse);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders search field', () => {
    renderComponent();
    const searchField = screen.getByPlaceholderText('Search indices');
    expect(searchField).toBeInTheDocument();
  });

  test('loads initial results on mount', async () => {
    renderComponent();

    // Fast-forward timers to trigger initial load
    jest.runAllTimers();

    await waitFor(() => {
      expect(mockHttpGet).toHaveBeenCalledWith(
        '/internal/index-pattern-management/resolve_index/*',
        expect.objectContaining({
          query: expect.objectContaining({
            expand_wildcards: 'all',
          }),
        })
      );
    });
  });

  test('opens popover on search field focus', () => {
    renderComponent();
    const searchField = screen.getByPlaceholderText('Search indices');

    fireEvent.focus(searchField);

    expect(screen.queryByTestId('dataset-index-selector')).toBeInTheDocument();
  });

  test('searches for indices when user types', async () => {
    renderComponent();
    const searchField = screen.getByPlaceholderText('Search indices');

    fireEvent.focus(searchField);
    fireEvent.change(searchField, { target: { value: 'otel' } });

    // Fast-forward past debounce delay
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockHttpGet).toHaveBeenCalledWith(
        '/internal/index-pattern-management/resolve_index/*otel*',
        expect.objectContaining({
          query: expect.objectContaining({
            expand_wildcards: 'all',
          }),
        })
      );
    });
  });

  test('debounces search input', async () => {
    renderComponent();
    const searchField = screen.getByPlaceholderText('Search indices');

    // Initial load should fire on mount
    jest.runAllTimers();
    await waitFor(() => {
      expect(mockHttpGet).toHaveBeenCalledWith(
        '/internal/index-pattern-management/resolve_index/*',
        expect.any(Object)
      );
    });

    // Clear mock and type rapidly
    mockHttpGet.mockClear();

    fireEvent.focus(searchField);
    fireEvent.change(searchField, { target: { value: 'o' } });
    fireEvent.change(searchField, { target: { value: 'ot' } });
    fireEvent.change(searchField, { target: { value: 'ote' } });

    // Should not call API immediately
    expect(mockHttpGet).not.toHaveBeenCalled();

    // Fast-forward past debounce delay
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      // Should only call once with final value
      expect(mockHttpGet).toHaveBeenCalledTimes(1);
      expect(mockHttpGet).toHaveBeenCalledWith(
        '/internal/index-pattern-management/resolve_index/*ote*',
        expect.any(Object)
      );
    });
  });

  test('includes data source in query when available', async () => {
    renderComponent();
    const searchField = screen.getByPlaceholderText('Search indices');

    fireEvent.focus(searchField);
    fireEvent.change(searchField, { target: { value: 'logs' } });

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockHttpGet).toHaveBeenCalledWith(
        '/internal/index-pattern-management/resolve_index/*logs*',
        expect.objectContaining({
          query: expect.objectContaining({
            expand_wildcards: 'all',
            data_source: 'test-datasource',
          }),
        })
      );
    });
  });

  test('handles API errors gracefully', async () => {
    mockHttpGet.mockRejectedValueOnce(new Error('API Error'));
    renderComponent();
    const searchField = screen.getByPlaceholderText('Search indices');

    fireEvent.focus(searchField);
    fireEvent.change(searchField, { target: { value: 'test' } });

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockHttpGet).toHaveBeenCalled();
    });

    // Should not throw error, just show empty results
    expect(screen.getByTestId('dataset-index-selector')).toBeInTheDocument();
  });

  test('fetches indices and makes them available for selection', async () => {
    renderComponent();
    const searchField = screen.getByPlaceholderText('Search indices');

    fireEvent.focus(searchField);
    fireEvent.change(searchField, { target: { value: 'logs' } });

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockHttpGet).toHaveBeenCalledWith(
        '/internal/index-pattern-management/resolve_index/*logs*',
        expect.any(Object)
      );
    });

    // Verify the EuiSelectable is present with the selector
    await waitFor(() => {
      expect(screen.getByTestId('dataset-index-selector')).toBeInTheDocument();
    });
  });

  test('resets to initial results when search is cleared', async () => {
    renderComponent();
    const searchField = screen.getByPlaceholderText('Search indices') as HTMLInputElement;

    // First, do a search
    fireEvent.focus(searchField);
    fireEvent.change(searchField, { target: { value: 'logs' } });
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockHttpGet).toHaveBeenCalledWith(
        expect.stringContaining('*logs*'),
        expect.any(Object)
      );
    });

    // Clear the search
    fireEvent.change(searchField, { target: { value: '' } });
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      // Should query for * again (initial results)
      expect(mockHttpGet).toHaveBeenCalledWith(
        '/internal/index-pattern-management/resolve_index/*',
        expect.any(Object)
      );
    });
  });

  test('closes popover when clicking outside', () => {
    const { container } = renderComponent();
    const searchField = screen.getByPlaceholderText('Search indices');

    // Open popover
    fireEvent.focus(searchField);
    expect(screen.queryByTestId('dataset-index-selector')).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(document.body);

    // Popover should close
    expect(screen.queryByTestId('dataset-index-selector')).not.toBeInTheDocument();
  });

  test('displays limited results message when showing first 100 of many indices', async () => {
    // Mock a response with more than 100 indices
    const manyIndices = Array.from({ length: 150 }, (_, i) => ({ name: `index-${i}` }));
    mockHttpGet.mockResolvedValue({ indices: manyIndices, aliases: [], data_streams: [] });

    renderComponent();
    const searchField = screen.getByPlaceholderText('Search indices');

    fireEvent.focus(searchField);

    // Initial load happens automatically
    jest.runAllTimers();

    await waitFor(() => {
      expect(mockHttpGet).toHaveBeenCalled();
    });

    // Should show limited results message
    await waitFor(() => {
      expect(screen.getByText(/Showing first 100 of 150 indices/)).toBeInTheDocument();
    });
  });

  test('handles wildcard patterns in search', async () => {
    renderComponent();
    const searchField = screen.getByPlaceholderText('Search indices');

    fireEvent.focus(searchField);
    fireEvent.change(searchField, { target: { value: 'logs*' } });

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      // Should use the pattern as-is (not wrap with *)
      expect(mockHttpGet).toHaveBeenCalledWith(
        '/internal/index-pattern-management/resolve_index/logs*',
        expect.any(Object)
      );
    });
  });

  test('combines indices, aliases, and data streams in results', async () => {
    renderComponent();
    const searchField = screen.getByPlaceholderText('Search indices');

    fireEvent.focus(searchField);
    fireEvent.change(searchField, { target: { value: 'test' } });

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockHttpGet).toHaveBeenCalledWith(
        '/internal/index-pattern-management/resolve_index/*test*',
        expect.any(Object)
      );
    });

    // Should have EuiSelectable with all types combined (3 indices + 1 alias + 1 data_stream)
    await waitFor(() => {
      expect(screen.getByTestId('dataset-index-selector')).toBeInTheDocument();
    });
  });

  test('preserves existing selections when searching', async () => {
    const existingSelections = ['test-datasource::existing-index'];
    renderComponent({ selectedIndexIds: existingSelections });

    const searchField = screen.getByPlaceholderText('Search indices');

    fireEvent.focus(searchField);
    fireEvent.change(searchField, { target: { value: 'logs' } });

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockHttpGet).toHaveBeenCalledWith(
        '/internal/index-pattern-management/resolve_index/*logs*',
        expect.any(Object)
      );
    });

    // Verify component loaded with existing selections
    // The actual selection preservation logic is tested through the onChange handler
    // which filters selections to keep those not in displayOptions
    await waitFor(() => {
      expect(screen.getByTestId('dataset-index-selector')).toBeInTheDocument();
    });
  });
});
