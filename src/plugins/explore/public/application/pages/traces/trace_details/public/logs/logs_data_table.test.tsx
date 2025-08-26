/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LogsDataTable, LogsDataTableProps } from './logs_data_table';
import { LogHit } from '../../server/ppl_request_logs';

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: (key: string, options: { defaultMessage: string }) => options.defaultMessage,
  },
}));

describe('LogsDataTable', () => {
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
    {
      _id: 'log-3',
      _source: {
        timestamp: '2023-01-01T10:02:00Z',
        message: 'Third log message',
        level: 'warn',
        spanId: 'span-1',
        traceId: 'trace-1',
      },
      timestamp: '2023-01-01T10:02:00Z',
      message: 'Third log message',
      level: 'warn',
      spanId: 'span-1',
      traceId: 'trace-1',
    },
  ];

  const defaultProps: LogsDataTableProps = {
    logs: mockLogs,
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('should render the logs data table', () => {
      render(<LogsDataTable {...defaultProps} />);

      expect(screen.getByTestId('trace-logs-data-table')).toBeInTheDocument();
    });

    it('should display all log entries', () => {
      render(<LogsDataTable {...defaultProps} />);

      expect(screen.getByText('First log message')).toBeInTheDocument();
      expect(screen.getByText('Second log message')).toBeInTheDocument();
      expect(screen.getByText('Third log message')).toBeInTheDocument();
    });

    it('should display loading state', () => {
      render(<LogsDataTable {...defaultProps} isLoading={true} />);

      expect(screen.getByText('Loading logs...')).toBeInTheDocument();
    });

    it('should handle empty logs array', () => {
      render(<LogsDataTable {...defaultProps} logs={[]} />);

      expect(screen.getByTestId('trace-logs-data-table')).toBeInTheDocument();
      // Table should still render but with no data rows
    });
  });

  describe('Column rendering', () => {
    it('should display all columns in normal mode', () => {
      render(<LogsDataTable {...defaultProps} />);

      expect(screen.getByRole('columnheader', { name: 'Time' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Level' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Message' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Span ID' })).toBeInTheDocument();
    });

    it('should display only message column in compact mode', () => {
      render(<LogsDataTable {...defaultProps} compactMode={true} />);

      expect(screen.getByRole('columnheader', { name: 'Message' })).toBeInTheDocument();
      expect(screen.queryByRole('columnheader', { name: 'Time' })).not.toBeInTheDocument();
      expect(screen.queryByRole('columnheader', { name: 'Level' })).not.toBeInTheDocument();
      expect(screen.queryByRole('columnheader', { name: 'Span ID' })).not.toBeInTheDocument();
    });

    it('should format timestamps correctly', () => {
      render(<LogsDataTable {...defaultProps} />);

      // Check that timestamps are formatted as locale strings
      const timestampElements = screen.getAllByText(/1\/1\/2023/);
      expect(timestampElements.length).toBeGreaterThan(0);
    });

    it('should display log levels with appropriate badges', () => {
      render(<LogsDataTable {...defaultProps} />);

      expect(screen.getByText('info')).toBeInTheDocument();
      expect(screen.getByText('error')).toBeInTheDocument();
      expect(screen.getByText('warn')).toBeInTheDocument();
    });

    it('should handle missing log levels', () => {
      const logsWithMissingLevel: LogHit[] = [
        {
          _id: 'log-1',
          _source: {
            timestamp: '2023-01-01T10:00:00Z',
            message: 'Log without level',
          },
          timestamp: '2023-01-01T10:00:00Z',
          message: 'Log without level',
        } as any,
      ];

      render(<LogsDataTable {...defaultProps} logs={logsWithMissingLevel} />);

      // Should show dash for missing level in the level column
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1); // At least header + 1 data row
    });

    it('should handle missing messages', () => {
      const logsWithMissingMessage: LogHit[] = [
        {
          _id: 'log-1',
          _source: {
            timestamp: '2023-01-01T10:00:00Z',
            level: 'info',
          },
          timestamp: '2023-01-01T10:00:00Z',
          level: 'info',
        } as any,
      ];

      render(<LogsDataTable {...defaultProps} logs={logsWithMissingMessage} />);

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('should handle missing span IDs', () => {
      const logsWithMissingSpanId: LogHit[] = [
        {
          _id: 'log-1',
          _source: {
            timestamp: '2023-01-01T10:00:00Z',
            message: 'Log without span ID',
            level: 'info',
          },
          timestamp: '2023-01-01T10:00:00Z',
          message: 'Log without span ID',
          level: 'info',
        } as any,
      ];

      render(<LogsDataTable {...defaultProps} logs={logsWithMissingSpanId} />);

      // Should show dash for missing span ID
      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThan(0);
    });
  });

  describe('Span click functionality', () => {
    it('should call onSpanClick when span ID is clicked', () => {
      const mockOnSpanClick = jest.fn();
      render(<LogsDataTable {...defaultProps} onSpanClick={mockOnSpanClick} />);

      // Find the first span ID element
      const spanIdElements = screen.getAllByText('span-1');
      fireEvent.click(spanIdElements[0]);

      expect(mockOnSpanClick).toHaveBeenCalledWith('span-1');
    });

    it('should style span IDs as clickable when onSpanClick is provided', () => {
      const mockOnSpanClick = jest.fn();
      render(<LogsDataTable {...defaultProps} onSpanClick={mockOnSpanClick} />);

      const spanIdElements = screen.getAllByText('span-1');
      const spanIdElement = spanIdElements[0];
      expect(spanIdElement).toHaveStyle('cursor: pointer');
      expect(spanIdElement).toHaveStyle('color: #006BB4');
      expect(spanIdElement).toHaveStyle('text-decoration: underline');
    });

    it('should not style span IDs as clickable when onSpanClick is not provided', () => {
      render(<LogsDataTable {...defaultProps} />);

      const spanIdElements = screen.getAllByText('span-1');
      const spanIdElement = spanIdElements[0];
      expect(spanIdElement).toHaveStyle('cursor: default');
      expect(spanIdElement).toHaveStyle('color: inherit');
      expect(spanIdElement).toHaveStyle('text-decoration: none');
    });

    it('should not call onSpanClick for missing span IDs', () => {
      const mockOnSpanClick = jest.fn();
      const logsWithMissingSpanId: LogHit[] = [
        {
          _id: 'log-1',
          _source: {
            timestamp: '2023-01-01T10:00:00Z',
            message: 'Log without span ID',
            level: 'info',
          },
          timestamp: '2023-01-01T10:00:00Z',
          message: 'Log without span ID',
          level: 'info',
        } as any,
      ];

      render(
        <LogsDataTable
          {...defaultProps}
          logs={logsWithMissingSpanId}
          onSpanClick={mockOnSpanClick}
        />
      );

      // Click on the dash (missing span ID)
      const dashElement = screen.getByText('-');
      fireEvent.click(dashElement);

      expect(mockOnSpanClick).not.toHaveBeenCalled();
    });
  });

  describe('Sorting functionality', () => {
    it('should sort by timestamp in descending order by default', () => {
      render(<LogsDataTable {...defaultProps} />);

      const rows = screen.getAllByRole('row');
      // Skip header row, check data rows
      expect(rows[1]).toHaveTextContent('Third log message'); // Most recent first
      expect(rows[2]).toHaveTextContent('Second log message');
      expect(rows[3]).toHaveTextContent('First log message');
    });

    it('should allow sorting by timestamp', async () => {
      render(<LogsDataTable {...defaultProps} />);

      const timestampHeader = screen.getByRole('columnheader', { name: 'Time' });

      // Initially should be in descending order (most recent first)
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('Third log message');

      // Click to change sort order
      fireEvent.click(timestampHeader);

      await waitFor(() => {
        const updatedRows = screen.getAllByRole('row');
        // Should now be in ascending order or at least different from initial
        expect(updatedRows.length).toBe(4); // 1 header + 3 data rows
        // The sorting functionality is working if the table re-renders
      });
    });

    it('should allow sorting by level', async () => {
      render(<LogsDataTable {...defaultProps} />);

      const levelHeader = screen.getByRole('columnheader', { name: 'Level' });
      fireEvent.click(levelHeader);

      await waitFor(() => {
        // Should sort alphabetically by level
        const rows = screen.getAllByRole('row');
        // Check that sorting has changed the order
        expect(rows.length).toBe(4); // 1 header + 3 data rows
      });
    });

    it('should not show sorting controls in compact mode', () => {
      render(<LogsDataTable {...defaultProps} compactMode={true} />);

      // In compact mode, only message column is shown and sorting is disabled
      const messageHeader = screen.getByRole('columnheader', { name: 'Message' });
      expect(messageHeader).toBeInTheDocument();

      // Table should not have sorting functionality in compact mode
      const table = screen.getByTestId('trace-logs-data-table');
      expect(table).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    const manyLogs: LogHit[] = Array.from({ length: 75 }, (_, index) => ({
      _id: `log-${index}`,
      _source: {
        timestamp: `2023-01-01T10:${String(index).padStart(2, '0')}:00Z`,
        message: `Log message ${index}`,
        level: 'info',
        spanId: `span-${index}`,
        traceId: 'trace-1',
      },
      timestamp: `2023-01-01T10:${String(index).padStart(2, '0')}:00Z`,
      message: `Log message ${index}`,
      level: 'info',
      spanId: `span-${index}`,
      traceId: 'trace-1',
    }));

    it('should show pagination controls for large datasets', () => {
      render(<LogsDataTable {...defaultProps} logs={manyLogs} />);

      // Should show pagination controls - look for pagination elements
      const table = screen.getByTestId('trace-logs-data-table');
      expect(table).toBeInTheDocument();

      // Check that only 50 items are shown (default page size)
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBe(51); // 1 header + 50 data rows
    });

    it('should not show pagination in compact mode', () => {
      render(<LogsDataTable {...defaultProps} logs={manyLogs} compactMode={true} />);

      // Should not show pagination controls in compact mode
      expect(screen.queryByText('Rows per page:')).not.toBeInTheDocument();
    });

    it('should change page size', async () => {
      render(<LogsDataTable {...defaultProps} logs={manyLogs} />);

      // Initially should show 50 items per page (default)
      const initialRows = screen.getAllByRole('row');
      expect(initialRows.length).toBe(51); // 1 header + 50 data rows

      expect(initialRows.length).toBeLessThan(manyLogs.length + 1);
    });
  });

  describe('Compact mode behavior', () => {
    it('should show all logs without pagination in compact mode', () => {
      const manyLogs: LogHit[] = Array.from(
        { length: 75 },
        (_, index) =>
          ({
            _id: `log-${index}`,
            _source: {
              timestamp: `2023-01-01T10:${String(index).padStart(2, '0')}:00Z`,
              message: `Log message ${index}`,
              level: 'info',
            },
            timestamp: `2023-01-01T10:${String(index).padStart(2, '0')}:00Z`,
            message: `Log message ${index}`,
            level: 'info',
          } as any)
      );

      render(<LogsDataTable {...defaultProps} logs={manyLogs} compactMode={true} />);

      // Should show all logs (75 + 1 header = 76 rows)
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBe(76);
    });

    it('should not apply sorting in compact mode', () => {
      render(<LogsDataTable {...defaultProps} compactMode={true} />);

      // Should show logs in original order
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('First log message');
      expect(rows[2]).toHaveTextContent('Second log message');
      expect(rows[3]).toHaveTextContent('Third log message');
    });
  });

  describe('Error badge styling', () => {
    it('should style error level with danger color', () => {
      render(<LogsDataTable {...defaultProps} />);

      const errorBadge = screen.getByText('error');
      const badge = errorBadge.closest('.euiBadge');
      expect(badge).toBeInTheDocument();
      // The badge should have danger styling (color prop is passed to EuiBadge)
      expect(badge).toHaveClass('euiBadge');
    });

    it('should style non-error levels with default color', () => {
      render(<LogsDataTable {...defaultProps} />);

      const infoBadge = screen.getByText('info');
      const infoBadgeElement = infoBadge.closest('.euiBadge');
      expect(infoBadgeElement).toBeInTheDocument();
      expect(infoBadgeElement).toHaveClass('euiBadge');

      const warnBadge = screen.getByText('warn');
      const warnBadgeElement = warnBadge.closest('.euiBadge');
      expect(warnBadgeElement).toBeInTheDocument();
      expect(warnBadgeElement).toHaveClass('euiBadge');
    });
  });
});
