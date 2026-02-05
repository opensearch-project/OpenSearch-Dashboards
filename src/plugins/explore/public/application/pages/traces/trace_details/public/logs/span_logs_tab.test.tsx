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

jest.mock('./url_builder', () => ({
  buildExploreLogsUrl: jest.fn(() => 'https://example.com/logs?span=span-1'),
  getTimeRangeFromTraceData: jest.fn(() => ({
    from: '2023-01-01T09:30:00.000Z',
    to: '2023-01-01T10:30:00.000Z',
  })),
  filterLogsBySpanId: jest.fn((logs, spanId) =>
    // @ts-expect-error TS7006 TODO(ts-error): fixme
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

  const mockDatasetLogs = {
    'logs-dataset-id': mockLogs,
  };

  const defaultProps = {
    traceId: 'trace-1',
    spanId: 'span-1',
    logDatasets: mockLogDatasets,
    datasetLogs: mockDatasetLogs,
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic rendering & filtering', () => {
    it('renders the component with dataset accordion', () => {
      render(<SpanLogsTab {...defaultProps} />);

      // Component renders with dataset accordion
      expect(screen.getByTestId('dataset-accordion-logs-dataset-id')).toBeInTheDocument();

      // Title is present
      expect(screen.getByText('Related logs for span')).toBeInTheDocument();

      // Dataset name is displayed
      expect(screen.getByText('logs-*')).toBeInTheDocument();

      // Description is rendered
      expect(screen.getByText('View logs related to this specific span')).toBeInTheDocument();

      // Dataset accordion container is present
      expect(screen.getByTestId('dataset-accordion-logs-dataset-id')).toBeInTheDocument();

      // "View in Discover Logs" button is rendered
      expect(screen.getByText('View in Discover Logs')).toBeInTheDocument();

      // Component is not showing the loading state
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();

      // Component is not showing the "no datasets" message
      expect(screen.queryByText('No logs found for this dataset')).not.toBeInTheDocument();
    });

    it('shows a loading panel with spinner when isLoading is true', () => {
      const { container } = render(<SpanLogsTab {...defaultProps} isLoading={true} />);

      // EUI spinner exists (EuiLoadingSpinner renders a span with a spinner class)
      const spinnerEl = container.querySelector('.euiLoadingSpinner');
      expect(spinnerEl).toBeTruthy();
    });

    it('handles empty logs data gracefully', () => {
      render(<SpanLogsTab {...defaultProps} datasetLogs={{}} />);

      // Component still renders but with no datasets
      expect(screen.getByText('Related logs for span')).toBeInTheDocument();
      expect(screen.getByText('No logs found for this dataset')).toBeInTheDocument();
    });
  });

  describe('View in Discover Logs button', () => {
    it('renders the button', () => {
      render(<SpanLogsTab {...defaultProps} />);
      expect(screen.getByText('View in Discover Logs')).toBeInTheDocument();
      expect(
        screen.getByTestId('span-logs-view-in-explore-button-logs-dataset-id')
      ).toBeInTheDocument();
    });

    it('navigates to logs URL when datasets are available', () => {
      delete (window as any).location;
      (window as any).location = { href: '' };

      render(<SpanLogsTab {...defaultProps} />);

      fireEvent.click(screen.getByTestId('span-logs-view-in-explore-button-logs-dataset-id'));

      // getTimeRangeFromTraceData is called with the filtered logs for this dataset
      const expectedFilteredLogs = [mockLogs[0]]; // Only log with span-1
      expect(urlBuilder.getTimeRangeFromTraceData).toHaveBeenCalledWith(expectedFilteredLogs);

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
  });
});
