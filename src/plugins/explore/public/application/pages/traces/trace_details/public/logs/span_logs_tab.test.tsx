/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpanLogsTab } from './span_logs_tab';
import { LogHit } from '../../server/ppl_request_logs';
import { Dataset } from '../../../../../../../../data/common';
import * as urlBuilder from './url_builder';

jest.mock('./logs_data_table', () => ({
  LogsDataTable: ({ logs, isLoading, compactMode }: any) => (
    <div data-test-subj="logs-data-table">
      <div data-test-subj="logs-count">{logs?.length ?? 0}</div>
      <div data-test-subj="loading-state">{isLoading ? 'loading' : 'loaded'}</div>
      <div data-test-subj="compact-mode">{compactMode ? 'true' : 'false'}</div>
      {(logs ?? []).map((log: any) => (
        <div key={log._id} data-test-subj={`log-${log._id}`}>
          {log.message}
        </div>
      ))}
    </div>
  ),
}));

jest.mock('./url_builder', () => ({
  buildExploreLogsUrl: jest.fn(() => 'https://example.com/logs?span=span-1'),
  getTimeRangeFromTraceData: jest.fn(() => ({
    from: '2023-01-01T09:30:00.000Z',
    to: '2023-01-01T10:30:00.000Z',
  })),
  filterLogsBySpanId: jest.fn((logs: any[], spanId: string) =>
    (logs || []).filter((l) => l.spanId === spanId || l?._source?.spanId === spanId)
  ),
}));

describe('SpanLogsTab', () => {
  const mockLogs: LogHit[] = [
    {
      _id: 'log-1',
      _source: {
        timestamp: '2023-01-01T10:00:00Z',
        message: 'First log message',
        level: 'info',
        spanId: 'span-1',
        traceId: 'trace-1',
      },
      timestamp: '2023-01-01T10:00:00Z',
      message: 'First log message',
      level: 'info',
      spanId: 'span-1',
      traceId: 'trace-1',
    },
    {
      _id: 'log-2',
      _source: {
        timestamp: '2023-01-01T10:01:00Z',
        message: 'Second log message',
        level: 'error',
        spanId: 'span-2',
        traceId: 'trace-1',
      },
      timestamp: '2023-01-01T10:01:00Z',
      message: 'Second log message',
      level: 'error',
      spanId: 'span-2',
      traceId: 'trace-1',
    },
  ];

  const mockLogDatasets: Dataset[] = [
    {
      id: 'logs-dataset-id',
      title: 'logs-*',
      timeFieldName: '@timestamp',
      type: 'INDEX_PATTERN',
    },
  ];

  const defaultProps = {
    traceId: 'trace-1',
    spanId: 'span-1',
    logDatasets: mockLogDatasets,
    logsData: mockLogs,
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic rendering & filtering', () => {
    it('renders and passes filtered logs to the table (by spanId)', () => {
      render(<SpanLogsTab {...defaultProps} />);

      // filterLogsBySpanId called with all logs and the spanId
      expect(urlBuilder.filterLogsBySpanId).toHaveBeenCalledWith(mockLogs, 'span-1');

      // Only 1 log has spanId=span-1
      expect(screen.getByTestId('logs-count')).toHaveTextContent('1');

      // compact mode is true for Span logs
      expect(screen.getByTestId('compact-mode')).toHaveTextContent('true');

      // Table is present
      expect(screen.getByTestId('logs-data-table')).toBeInTheDocument();
    });

    it('updates when spanId changes (re-filters)', () => {
      const { rerender } = render(<SpanLogsTab {...defaultProps} />);

      expect(screen.getByTestId('logs-count')).toHaveTextContent('1');

      rerender(<SpanLogsTab {...defaultProps} spanId="span-2" />);
      expect(urlBuilder.filterLogsBySpanId).toHaveBeenLastCalledWith(mockLogs, 'span-2');
      expect(screen.getByTestId('logs-count')).toHaveTextContent('1');
    });

    it('shows a loading panel with spinner when isLoading is true', () => {
      const { container } = render(<SpanLogsTab {...defaultProps} isLoading={true} />);

      // In loading state the table is not rendered
      expect(screen.queryByTestId('logs-data-table')).not.toBeInTheDocument();

      // EUI spinner exists (EuiLoadingSpinner renders a span with a spinner class)
      const spinnerEl = container.querySelector('.euiLoadingSpinner');
      expect(spinnerEl).toBeTruthy();
    });

    it('handles empty logs data gracefully', () => {
      render(<SpanLogsTab {...defaultProps} logsData={[]} />);

      expect(urlBuilder.filterLogsBySpanId).toHaveBeenCalledWith([], 'span-1');
      expect(screen.getByTestId('logs-count')).toHaveTextContent('0');
    });
  });

  describe('View in Discover Logs button', () => {
    it('renders the button', () => {
      render(<SpanLogsTab {...defaultProps} />);
      expect(screen.getByText('View in Discover Logs')).toBeInTheDocument();
      expect(screen.getByTestId('span-logs-view-in-explore-button')).toBeInTheDocument();
    });

    it('navigates to logs URL when datasets are available', () => {
      delete (window as any).location;
      (window as any).location = { href: '' };

      render(<SpanLogsTab {...defaultProps} />);

      fireEvent.click(screen.getByTestId('span-logs-view-in-explore-button'));

      expect(urlBuilder.getTimeRangeFromTraceData).toHaveBeenCalledWith(mockLogs);

      // URL builder called with the right payload
      expect(urlBuilder.buildExploreLogsUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          traceId: 'trace-1',
          spanId: 'span-1',
          logDataset: mockLogDatasets[0],
          timeRange: expect.any(Object),
        })
      );

      expect(window.location.href).toBe('https://example.com/logs?span=span-1');
    });

    it('handles when no log datasets are available', () => {
      render(<SpanLogsTab {...defaultProps} logDatasets={[]} />);

      fireEvent.click(screen.getByTestId('span-logs-view-in-explore-button'));

      expect(urlBuilder.buildExploreLogsUrl).not.toHaveBeenCalled();
    });

    it('logs error when URL generation throws', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (urlBuilder.buildExploreLogsUrl as jest.Mock).mockImplementationOnce(() => {
        throw new Error('URL generation failed');
      });

      render(<SpanLogsTab {...defaultProps} />);

      fireEvent.click(screen.getByTestId('span-logs-view-in-explore-button'));

      expect(errorSpy).toHaveBeenCalledWith('Failed to generate logs URL:', expect.any(Error));

      errorSpy.mockRestore();
    });
  });
});
