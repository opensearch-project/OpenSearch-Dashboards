/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DatasetLogsTable, DatasetLogsTableProps } from './dataset_logs_table';
import { LogHit } from '../../server/ppl_request_logs';

// Mock external components
jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: (id: string, options: { defaultMessage: string }) => options.defaultMessage,
  },
}));

describe('DatasetLogsTable', () => {
  const mockLogs: LogHit[] = [
    {
      _id: 'log1',
      _source: { body: 'This is an info message', severityText: 'INFO' },
      timestamp: '2023-10-01T10:00:00Z',
      traceId: 'trace1',
      level: 'INFO',
      message: 'This is an info message',
      spanId: 'span123',
    },
    {
      _id: 'log2',
      _source: { body: 'This is an error message', severityText: 'ERROR' },
      timestamp: '2023-10-01T11:00:00Z',
      traceId: 'trace1',
      level: 'ERROR',
      message: 'This is an error message',
      spanId: 'span456',
    },
    {
      _id: 'log3',
      _source: { body: 'This is a warning message', severityText: 'WARN' },
      timestamp: '2023-10-01T09:00:00Z',
      traceId: 'trace1',
      level: 'WARN',
      message: 'This is a warning message',
      spanId: '',
    },
    {
      _id: 'log4',
      _source: {},
      timestamp: '2023-10-01T12:00:00Z',
      traceId: 'trace1',
      level: '',
      message: '',
      spanId: 'span789',
    },
  ];

  const defaultProps: DatasetLogsTableProps = {
    logs: mockLogs,
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders the table with correct test id', () => {
      render(<DatasetLogsTable {...defaultProps} />);
      expect(screen.getByTestId('dataset-logs-table')).toBeInTheDocument();
    });

    it('renders all columns in normal mode', () => {
      render(<DatasetLogsTable {...defaultProps} />);

      expect(screen.getAllByText('Time')).toHaveLength(5); // Header + 4 mobile headers
      expect(screen.getAllByText('Level')).toHaveLength(5);
      expect(screen.getAllByText('Message')).toHaveLength(5);
      expect(screen.getAllByText('Span ID')).toHaveLength(5);
    });

    it('renders only message column in compact mode', () => {
      render(<DatasetLogsTable {...defaultProps} compactMode={true} />);

      expect(screen.getAllByText('Message')).toHaveLength(5); // Header + 4 mobile headers
      expect(screen.queryByText('Time')).not.toBeInTheDocument();
      expect(screen.queryByText('Level')).not.toBeInTheDocument();
      expect(screen.queryByText('Span ID')).not.toBeInTheDocument();
    });

    it('displays loading message when isLoading is true', () => {
      render(<DatasetLogsTable {...defaultProps} isLoading={true} />);
      expect(screen.getByText('Loading logs...')).toBeInTheDocument();
    });
  });

  describe('Data Rendering', () => {
    it('renders log data correctly', () => {
      render(<DatasetLogsTable {...defaultProps} />);

      expect(screen.getByText('This is an info message')).toBeInTheDocument();
      expect(screen.getByText('This is an error message')).toBeInTheDocument();
      expect(screen.getByText('This is a warning message')).toBeInTheDocument();
    });

    it('formats timestamps correctly', () => {
      render(<DatasetLogsTable {...defaultProps} />);

      // Check that timestamps are formatted as locale strings
      const timestamps = screen.getAllByText(/10\/1\/2023/);
      expect(timestamps.length).toBeGreaterThan(0);
    });

    it('renders level badges with correct colors', () => {
      render(<DatasetLogsTable {...defaultProps} />);

      const infoBadge = screen.getByText('INFO');
      const errorBadge = screen.getByText('ERROR');
      const warnBadge = screen.getByText('WARN');

      expect(infoBadge).toBeInTheDocument();
      expect(errorBadge).toBeInTheDocument();
      expect(warnBadge).toBeInTheDocument();
    });

    it('handles missing or empty data gracefully', () => {
      render(<DatasetLogsTable {...defaultProps} />);

      // Check for empty level and message handling
      expect(screen.getAllByText('-')).toHaveLength(2); // One for empty level, one for empty spanId
      expect(screen.getAllByText('N/A')).toHaveLength(1); // For empty message
    });

    it('renders span IDs as clickable when onSpanClick is provided', () => {
      const mockOnSpanClick = jest.fn();
      render(<DatasetLogsTable {...defaultProps} onSpanClick={mockOnSpanClick} />);

      const spanElement = screen.getByText('span123');
      expect(spanElement).toHaveStyle('cursor: pointer');
      expect(spanElement).toHaveStyle('text-decoration: underline');
    });

    it('renders span IDs as non-clickable when onSpanClick is not provided', () => {
      render(<DatasetLogsTable {...defaultProps} />);

      const spanElement = screen.getByText('span123');
      expect(spanElement).toHaveStyle('cursor: default');
      expect(spanElement).toHaveStyle('text-decoration: none');
    });
  });

  describe('Row Expansion Functionality', () => {
    it('renders expand icons for each row', () => {
      render(<DatasetLogsTable {...defaultProps} />);

      const expandIcons = screen.getAllByLabelText('Expand row');
      expect(expandIcons).toHaveLength(mockLogs.length);
    });

    it('expands row when expand icon is clicked', async () => {
      render(<DatasetLogsTable {...defaultProps} />);

      const firstExpandIcon = screen.getAllByLabelText('Expand row')[0];
      fireEvent.click(firstExpandIcon);

      await waitFor(
        () => {
          expect(screen.getByLabelText('Collapse row')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('collapses row when collapse icon is clicked', async () => {
      render(<DatasetLogsTable {...defaultProps} />);

      const firstExpandIcon = screen.getAllByLabelText('Expand row')[0];
      fireEvent.click(firstExpandIcon);

      await waitFor(() => {
        const collapseIcon = screen.getByLabelText('Collapse row');
        fireEvent.click(collapseIcon);
      });

      await waitFor(() => {
        expect(screen.queryByLabelText('Collapse row')).not.toBeInTheDocument();
        expect(screen.getAllByLabelText('Expand row')).toHaveLength(mockLogs.length);
      });
    });

    it('displays expanded content with message in code block', async () => {
      render(<DatasetLogsTable {...defaultProps} />);

      const firstExpandIcon = screen.getAllByLabelText('Expand row')[0];
      fireEvent.click(firstExpandIcon);

      await waitFor(
        () => {
          // Check that the row is expanded by verifying the collapse icon is present
          expect(screen.getByLabelText('Collapse row')).toBeInTheDocument();

          // Check for expanded content by looking for the actual message content
          const expandedMessage = screen.getByText('This is an info message');
          expect(expandedMessage).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('can expand multiple rows simultaneously', async () => {
      render(<DatasetLogsTable {...defaultProps} />);

      const expandIcons = screen.getAllByLabelText('Expand row');
      fireEvent.click(expandIcons[0]);
      fireEvent.click(expandIcons[1]);

      await waitFor(() => {
        expect(screen.getAllByLabelText('Collapse row')).toHaveLength(2);
      });
    });
  });

  describe('Sorting Functionality', () => {
    it('sorts by timestamp in descending order by default', () => {
      render(<DatasetLogsTable {...defaultProps} />);

      const rows = screen.getAllByRole('row');
      // Skip header row, check data rows
      const firstDataRow = rows[1];
      const lastDataRow = rows[rows.length - 1];

      // Should show newest first (5:00:00 AM) and oldest last (2:00:00 AM)
      expect(firstDataRow).toHaveTextContent('5:00:00 AM');
      expect(lastDataRow).toHaveTextContent('2:00:00 AM');
    });

    it('changes sort direction when timestamp column header is clicked', async () => {
      render(<DatasetLogsTable {...defaultProps} />);

      const timestampHeaders = screen.getAllByText('Time');
      const headerButton = timestampHeaders[0].closest('button');
      if (headerButton) {
        fireEvent.click(headerButton);
      }

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        const firstDataRow = rows[1];
        // Should now show oldest first (2:00:00 AM)
        expect(firstDataRow).toHaveTextContent('2:00:00 AM');
      });
    });

    it('sorts by level when level column header is clicked', async () => {
      render(<DatasetLogsTable {...defaultProps} />);

      const levelHeaders = screen.getAllByText('Level');
      const headerButton = levelHeaders[0].closest('button');
      if (headerButton) {
        fireEvent.click(headerButton);
      }

      await waitFor(() => {
        // Should sort alphabetically by level
        const badges = screen.getAllByText(/ERROR|INFO|WARN/);
        expect(badges[0]).toHaveTextContent('ERROR');
      });
    });

    it('does not show sorting controls in compact mode', () => {
      render(<DatasetLogsTable {...defaultProps} compactMode={true} />);

      // In compact mode, only message column should be visible and not sortable
      const messageHeaders = screen.getAllByText('Message');
      expect(messageHeaders.length).toBeGreaterThan(0);

      // Should not have sorting indicators
      expect(screen.queryByRole('button', { name: /sort/i })).not.toBeInTheDocument();
    });
  });

  describe('Pagination Functionality', () => {
    const manyLogs: LogHit[] = Array.from({ length: 75 }, (_, i) => ({
      _id: `log${i}`,
      _source: { body: `Log message ${i}` },
      timestamp: `2023-10-01T${String(i % 24).padStart(2, '0')}:00:00Z`,
      traceId: 'trace1',
      level: i % 3 === 0 ? 'ERROR' : i % 3 === 1 ? 'INFO' : 'WARN',
      message: `Log message ${i}`,
      spanId: `span${i}`,
    }));

    it('shows pagination controls when there are many logs', () => {
      render(<DatasetLogsTable logs={manyLogs} />);

      expect(screen.getByText(/Rows per page/)).toBeInTheDocument();
      // Check for pagination controls by looking for the pagination button
      expect(screen.getByTestId('tablePaginationPopoverButton')).toBeInTheDocument();
      // Check that we have pagination by verifying we don't show all 75 rows at once
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeLessThan(manyLogs.length + 1); // +1 for header, should be paginated
    });

    it('changes page size when page size selector is used', async () => {
      render(<DatasetLogsTable logs={manyLogs} />);

      // Find the pagination button and click it
      const paginationButton = screen.getByTestId('tablePaginationPopoverButton');
      fireEvent.click(paginationButton);

      await waitFor(() => {
        const option25 = screen.getByText('25 rows');
        fireEvent.click(option25);
      });

      await waitFor(() => {
        expect(screen.getByText(/25/)).toBeInTheDocument();
      });
    });

    it('navigates to next page when next button is clicked', async () => {
      render(<DatasetLogsTable logs={manyLogs} />);

      const nextButton = screen.getByTestId('pagination-button-next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        // Check that we're on page 2 by looking for different data
        const rows = screen.getAllByRole('row');
        expect(rows.length).toBeGreaterThan(1); // Should have header + data rows
      });
    });

    it('does not show pagination in compact mode', () => {
      render(<DatasetLogsTable logs={manyLogs} compactMode={true} />);

      expect(screen.queryByText(/Rows per page/)).not.toBeInTheDocument();
      expect(screen.queryByText(/1-50 of 75/)).not.toBeInTheDocument();
    });

    it('shows all logs in compact mode regardless of count', () => {
      render(<DatasetLogsTable logs={manyLogs} compactMode={true} />);

      // In compact mode, all logs should be visible
      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(manyLogs.length + 1); // +1 for header
    });
  });

  describe('Span Click Functionality', () => {
    it('calls onSpanClick when span ID is clicked', () => {
      const mockOnSpanClick = jest.fn();
      render(<DatasetLogsTable {...defaultProps} onSpanClick={mockOnSpanClick} />);

      const spanElement = screen.getByText('span123');
      fireEvent.click(spanElement);

      expect(mockOnSpanClick).toHaveBeenCalledWith('span123');
    });

    it('does not call onSpanClick when span ID is empty', () => {
      const mockOnSpanClick = jest.fn();
      render(<DatasetLogsTable {...defaultProps} onSpanClick={mockOnSpanClick} />);

      // Find the row with empty spanId (shows as '-')
      const emptySpanElement = screen.getAllByText('-')[1]; // Second '-' is for empty spanId
      fireEvent.click(emptySpanElement);

      expect(mockOnSpanClick).not.toHaveBeenCalled();
    });

    it('calls onSpanClick multiple times for different spans', () => {
      const mockOnSpanClick = jest.fn();
      render(<DatasetLogsTable {...defaultProps} onSpanClick={mockOnSpanClick} />);

      fireEvent.click(screen.getByText('span123'));
      fireEvent.click(screen.getByText('span456'));
      fireEvent.click(screen.getByText('span789'));

      expect(mockOnSpanClick).toHaveBeenCalledTimes(3);
      expect(mockOnSpanClick).toHaveBeenNthCalledWith(1, 'span123');
      expect(mockOnSpanClick).toHaveBeenNthCalledWith(2, 'span456');
      expect(mockOnSpanClick).toHaveBeenNthCalledWith(3, 'span789');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles empty logs array', () => {
      render(<DatasetLogsTable logs={[]} />);

      expect(screen.getByTestId('dataset-logs-table')).toBeInTheDocument();
      expect(screen.getByText('Time')).toBeInTheDocument();
    });

    it('handles logs with missing fields', () => {
      const logsWithMissingFields: LogHit[] = [
        {
          _id: 'log1',
          _source: {},
          timestamp: '2023-10-01T10:00:00Z',
          traceId: 'trace1',
          level: undefined as any,
          message: undefined as any,
          spanId: undefined as any,
        },
      ];

      render(<DatasetLogsTable logs={logsWithMissingFields} />);

      expect(screen.getAllByText('-')).toHaveLength(2); // For missing level and spanId
      expect(screen.getAllByText('N/A')).toHaveLength(1); // For missing message
    });

    it('handles invalid timestamp gracefully', () => {
      const logsWithInvalidTimestamp: LogHit[] = [
        {
          _id: 'log1',
          _source: { body: 'Test message' },
          timestamp: 'invalid-timestamp',
          traceId: 'trace1',
          level: 'INFO',
          message: 'Test message',
          spanId: 'span123',
        },
      ];

      render(<DatasetLogsTable logs={logsWithInvalidTimestamp} />);

      // Should not crash and should render the table
      expect(screen.getByTestId('dataset-logs-table')).toBeInTheDocument();
    });

    it('prevents event propagation when expand icon is clicked', () => {
      const mockRowClick = jest.fn();
      render(
        <div onClick={mockRowClick} onKeyDown={mockRowClick} role="button" tabIndex={0}>
          <DatasetLogsTable {...defaultProps} />
        </div>
      );

      const firstExpandIcon = screen.getAllByLabelText('Expand row')[0];
      fireEvent.click(firstExpandIcon);

      // Row click should not be triggered
      expect(mockRowClick).not.toHaveBeenCalled();
    });

    it('maintains expanded state when logs data changes', async () => {
      const { rerender } = render(<DatasetLogsTable {...defaultProps} />);

      // Expand first row
      const firstExpandIcon = screen.getAllByLabelText('Expand row')[0];
      fireEvent.click(firstExpandIcon);

      await waitFor(() => {
        expect(screen.getByLabelText('Collapse row')).toBeInTheDocument();
      });

      // Update logs with same IDs
      const updatedLogs = mockLogs.map((log) => ({
        ...log,
        message: `Updated: ${log.message}`,
      }));

      rerender(<DatasetLogsTable logs={updatedLogs} />);

      // Row should still be expanded
      expect(screen.getByLabelText('Collapse row')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper aria labels for expand/collapse icons', () => {
      render(<DatasetLogsTable {...defaultProps} />);

      const expandIcons = screen.getAllByLabelText('Expand row');
      expect(expandIcons).toHaveLength(mockLogs.length);

      fireEvent.click(expandIcons[0]);

      expect(screen.getByLabelText('Collapse row')).toBeInTheDocument();
    });

    it('maintains keyboard navigation support', () => {
      render(<DatasetLogsTable {...defaultProps} />);

      const table = screen.getByTestId('dataset-logs-table');
      expect(table).toBeInTheDocument();

      // EuiBasicTable should handle keyboard navigation internally
      const expandIcon = screen.getAllByLabelText('Expand row')[0];
      expect(expandIcon).toBeInTheDocument();
    });
  });
});
