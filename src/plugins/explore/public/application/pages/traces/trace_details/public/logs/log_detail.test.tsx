/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { LogsDetails } from './log_detail';
import { PPLService } from '../../server/ppl_request_helpers';
import { fetchLogsData } from '../../server/ppl_request_logs';

// Mock dependencies
jest.mock('../../server/ppl_request_logs');
jest.mock('../utils/custom_datagrid', () => ({
  RenderCustomDataGrid: jest.fn(({ isTableDataLoading, rowCount }) => (
    <div data-test-subj="mock-data-grid">
      {isTableDataLoading ? (
        <div data-test-subj="loading-indicator">Loading...</div>
      ) : (
        `Showing ${rowCount} rows`
      )}
    </div>
  )),
}));

const mockFetchLogsData = fetchLogsData as jest.MockedFunction<typeof fetchLogsData>;

describe('LogsDetails', () => {
  const defaultProps = {
    traceId: 'test-trace-id',
    dataSourceId: 'test-source',
    pplService: {} as PPLService,
    availableWidth: 1200,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    mockFetchLogsData.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<LogsDetails {...defaultProps} />);

    // Wait for loading state to be set
    await waitFor(() => {
      expect(screen.getByTestId('mock-data-grid')).toHaveTextContent('Loading...');
    });
  });

  it('renders error state when fetch fails', async () => {
    const errorMessage = 'Failed to fetch logs';
    mockFetchLogsData.mockRejectedValue(new Error(errorMessage));

    render(<LogsDetails {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(`Error loading logs: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  it('renders logs data successfully', async () => {
    const mockResponse = {
      fields: [
        { name: '@timestamp', values: ['2025-01-01T00:00:00Z'] },
        { name: 'spanId', values: ['span1'] },
        { name: 'severityText', values: ['ERROR'] },
        { name: 'severityNumber', values: [2] },
        { name: 'body', values: ['Error message'] },
      ],
      size: 1,
    };

    mockFetchLogsData.mockResolvedValue(mockResponse);

    render(<LogsDetails {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Showing 1 rows')).toBeInTheDocument();
    });
  });

  it('shows total item count in panel title', async () => {
    const mockResponse = {
      fields: [
        { name: '@timestamp', values: ['2025-01-01T00:00:00Z', '2025-01-01T00:01:00Z'] },
        { name: 'spanId', values: ['span1', 'span2'] },
      ],
      size: 2,
    };

    mockFetchLogsData.mockResolvedValue(mockResponse);

    render(<LogsDetails {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('(2)')).toBeInTheDocument();
    });
  });

  it('handles missing required props', () => {
    const { rerender } = render(<LogsDetails {...defaultProps} pplService={undefined} />);
    expect(screen.getByText('Showing 0 rows')).toBeInTheDocument();

    rerender(<LogsDetails {...defaultProps} traceId="" />);
    expect(screen.getByText('Showing 0 rows')).toBeInTheDocument();

    rerender(<LogsDetails {...defaultProps} dataSourceId="" />);
    expect(screen.getByText('Showing 0 rows')).toBeInTheDocument();
  });

  it('renders view logs button', () => {
    render(<LogsDetails {...defaultProps} />);
    expect(screen.getByText('View associated Logs')).toBeInTheDocument();
  });

  it('debounces fetch requests', async () => {
    jest.useFakeTimers();
    mockFetchLogsData.mockResolvedValue({ fields: [], size: 0 });

    render(<LogsDetails {...defaultProps} />);

    // Fast-forward timers to trigger debounced fetch
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(mockFetchLogsData).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it('handles empty response data', async () => {
    mockFetchLogsData.mockResolvedValue({ fields: [], size: 0 });

    render(<LogsDetails {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Showing 0 rows')).toBeInTheDocument();
    });
  });

  it('updates when traceId changes', async () => {
    mockFetchLogsData.mockResolvedValue({ fields: [], size: 0 });

    const { rerender } = render(<LogsDetails {...defaultProps} />);

    await waitFor(() => {
      expect(mockFetchLogsData).toHaveBeenCalledWith(
        expect.objectContaining({ traceId: 'test-trace-id' })
      );
    });

    rerender(<LogsDetails {...defaultProps} traceId="new-trace-id" />);

    await waitFor(() => {
      expect(mockFetchLogsData).toHaveBeenCalledWith(
        expect.objectContaining({ traceId: 'new-trace-id' })
      );
    });
  });

  it('cleans up fetch timeout on unmount', () => {
    jest.useFakeTimers();
    mockFetchLogsData.mockResolvedValue({ fields: [], size: 0 });

    const { unmount } = render(<LogsDetails {...defaultProps} />);
    unmount();

    // Advance timers and verify no fetch occurs after unmount
    jest.advanceTimersByTime(300);
    expect(mockFetchLogsData).not.toHaveBeenCalled();

    jest.useRealTimers();
  });
});
