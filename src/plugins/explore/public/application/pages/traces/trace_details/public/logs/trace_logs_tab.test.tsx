/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TraceLogsTab } from './trace_logs_tab';
import { LogHit } from '../../server/ppl_request_logs';
import { Dataset } from '../../../../../../../../data/common';
import * as urlBuilder from './url_builder';

jest.mock('./dataset_logs_table', () => ({
  DatasetLogsTable: ({ logs, onSpanClick, isLoading }: any) => (
    <div data-test-subj="logs-data-table">
      <div data-test-subj="logs-count">{logs?.length || 0}</div>
      <div data-test-subj="loading-state">{isLoading ? 'loading' : 'loaded'}</div>
      {logs?.map((log: any) => (
        <div key={log._id} data-test-subj={`log-${log._id}`}>
          {log.message}
          {log.spanId && (
            <button onClick={() => onSpanClick && onSpanClick(log.spanId)}>{log.spanId}</button>
          )}
        </div>
      ))}
    </div>
  ),
}));

jest.mock('./url_builder', () => ({
  buildExploreLogsUrl: jest.fn(() => 'https://example.com/logs'),
  getTimeRangeFromTraceData: jest.fn(() => ({
    from: '2023-01-01T09:30:00.000Z',
    to: '2023-01-01T10:30:00.000Z',
  })),
}));

describe('TraceLogsTab', () => {
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
    logDatasets: mockLogDatasets,
    logsData: mockLogs,
    datasetLogs: {
      'logs-dataset-id': mockLogs,
    },
    isLoading: false,
    onSpanClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('should render the trace logs tab', () => {
      render(<TraceLogsTab {...defaultProps} />);

      expect(screen.getByTestId('logs-data-table')).toBeInTheDocument();
    });

    it('should show loading state when isLoading is true', () => {
      render(<TraceLogsTab {...defaultProps} isLoading={true} />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should handle missing trace ID', () => {
      render(<TraceLogsTab {...defaultProps} traceId="" />);

      expect(screen.getByTestId('logs-data-table')).toBeInTheDocument();
      expect(screen.getByTestId('logs-count')).toHaveTextContent('2');
    });

    it('should handle empty logs data', () => {
      // @ts-expect-error TS2322 TODO(ts-error): fixme
      render(<TraceLogsTab {...defaultProps} logsData={[]} datasetLogs={{}} />);

      expect(screen.getByText('No logs found for this dataset')).toBeInTheDocument();
      expect(screen.queryByTestId('logs-data-table')).not.toBeInTheDocument();
    });
  });

  describe('View in Discover Logs button', () => {
    it('should render View in Discover Logs button', () => {
      render(<TraceLogsTab {...defaultProps} />);

      expect(screen.getByText('View in Discover Logs')).toBeInTheDocument();
    });

    it('should handle button click when log datasets are available', () => {
      delete (window as any).location;
      (window as any).location = { href: '' };

      render(<TraceLogsTab {...defaultProps} />);

      const viewInLogsButton = screen.getByText('View in Discover Logs');
      fireEvent.click(viewInLogsButton);

      expect(window.location.href).toBe('https://example.com/logs');
    });

    it('should not show button when no log datasets are available', () => {
      render(<TraceLogsTab {...defaultProps} logDatasets={[]} />);

      expect(screen.queryByText('View in Discover Logs')).not.toBeInTheDocument();
      expect(urlBuilder.buildExploreLogsUrl).not.toHaveBeenCalled();
    });

    it('should handle URL generation errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (urlBuilder.buildExploreLogsUrl as jest.Mock).mockImplementationOnce(() => {
        throw new Error('URL generation failed');
      });

      render(<TraceLogsTab {...defaultProps} />);

      const viewInLogsButton = screen.getByText('View in Discover Logs');
      fireEvent.click(viewInLogsButton);

      expect(consoleSpy).toHaveBeenCalledWith('Failed to generate logs URL:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Span click functionality', () => {
    it('should call onSpanClick when span is clicked', () => {
      const mockOnSpanClick = jest.fn();

      render(<TraceLogsTab {...defaultProps} onSpanClick={mockOnSpanClick} />);

      const spanButton = screen.getByText('span-1');
      fireEvent.click(spanButton);

      expect(mockOnSpanClick).toHaveBeenCalledWith('span-1');
    });

    it('should not break when onSpanClick is not provided', () => {
      const { onSpanClick, ...propsWithoutCallback } = defaultProps;
      render(<TraceLogsTab {...propsWithoutCallback} />);

      expect(screen.getByTestId('logs-data-table')).toBeInTheDocument();
    });
  });

  describe('Props validation', () => {
    it('should handle null logs data gracefully', () => {
      // @ts-expect-error TS2322 TODO(ts-error): fixme
      render(<TraceLogsTab {...defaultProps} logsData={null as any} />);

      expect(screen.getByTestId('logs-data-table')).toBeInTheDocument();
    });

    it('should handle undefined logs data gracefully', () => {
      // @ts-expect-error TS2322 TODO(ts-error): fixme
      render(<TraceLogsTab {...defaultProps} logsData={undefined as any} />);

      expect(screen.getByTestId('logs-data-table')).toBeInTheDocument();
    });

    it('should handle empty logs data gracefully', () => {
      // @ts-expect-error TS2322 TODO(ts-error): fixme
      render(<TraceLogsTab {...defaultProps} logsData={[]} />);

      expect(screen.getByTestId('logs-data-table')).toBeInTheDocument();
    });
  });
});
