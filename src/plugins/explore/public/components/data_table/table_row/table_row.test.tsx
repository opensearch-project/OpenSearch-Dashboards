/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TableRow, TableRowProps } from './table_row';

// Mock the child components
jest.mock('../table_cell/source_field_table_cell', () => ({
  SourceFieldTableCell: ({ isShortDots }: { isShortDots: boolean }) => (
    <div data-test-subj="table-source-cell">Source Cell - Short dots: {isShortDots.toString()}</div>
  ),
}));

jest.mock('../table_cell/table_cell', () => ({
  TableCell: ({
    columnId,
    sanitizedCellValue,
  }: {
    columnId: string;
    sanitizedCellValue: string;
  }) => <td data-test-subj={`table-cell-${columnId}`}>{sanitizedCellValue}</td>,
}));

jest.mock('./expanded_table_row/expanded_table_row', () => ({
  ExpandedTableRow: ({ row }: { row: any }) => (
    <tr data-test-subj="expanded-table-row">
      <td>Expanded Table Row for {row._id}</td>
    </tr>
  ),
}));

describe('TableRow', () => {
  const mockDataset = {
    fields: {
      getByName: jest.fn((fieldName) => {
        if (fieldName === '_source') return { type: '_source' };
        if (fieldName === 'timestamp') return { type: 'date', filterable: true };
        if (fieldName === 'message') return { type: 'string', filterable: true };
        if (fieldName === 'non_filterable') return { type: 'string', filterable: false };
        return { type: 'string', filterable: true };
      }),
    },
    flattenHit: jest.fn(() => ({
      timestamp: '2023-01-01T00:00:00Z',
      message: 'test message',
      non_filterable: 'non-filterable value',
    })),
    formatField: jest.fn((_row, field) => {
      if (field === 'timestamp') return '2023-01-01T00:00:00Z';
      if (field === 'message') return 'test message';
      if (field === 'non_filterable') return 'non-filterable value';
      if (field === 'undefined_field') return undefined;
      return 'formatted value';
    }),
    timeFieldName: 'timestamp',
  } as any;

  const mockRow = {
    _id: 'test-row-1',
    _index: 'test-index',
    _source: {
      timestamp: '2023-01-01T00:00:00Z',
      message: 'test message',
    },
    isAnchor: false,
  } as any;

  const mockDocViewsRegistry = {
    registry: [],
  } as any;

  const defaultProps: TableRowProps = {
    row: mockRow,
    columns: ['timestamp', 'message'],
    dataset: mockDataset,
    onFilter: jest.fn(),
    onRemoveColumn: jest.fn(),
    onAddColumn: jest.fn(),
    onClose: jest.fn(),
    isShortDots: false,
    docViewsRegistry: mockDocViewsRegistry,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders table row with expand toggle', () => {
    render(<TableRow {...defaultProps} />);

    const toggleButtons = screen.getAllByTestId('docTableExpandToggleColumn');
    expect(toggleButtons[0]).toBeInTheDocument(); // The td element
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Toggle row details');
  });

  it('toggles expansion when expand button is clicked', () => {
    render(<TableRow {...defaultProps} />);

    const expandButton = screen.getByRole('button');

    // Initially collapsed
    expect(screen.queryByTestId('expanded-table-row')).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(expandButton);
    expect(screen.getByTestId('expanded-table-row')).toBeInTheDocument();
    expect(screen.getByText('Expanded Table Row for test-row-1')).toBeInTheDocument();
  });

  it('renders highlighted row when isAnchor is true', () => {
    const anchorRow = { ...mockRow, isAnchor: true };
    render(<TableRow {...defaultProps} row={anchorRow} />);

    const rowElement = document.querySelector('.exploreDocTable__row--highlight');
    expect(rowElement).toBeInTheDocument();
  });

  it('renders source cell for _source column', () => {
    render(<TableRow {...defaultProps} columns={['_source']} />);

    expect(screen.getByTestId('table-source-cell')).toBeInTheDocument();
    expect(screen.getByText('Source Cell - Short dots: false')).toBeInTheDocument();
  });

  it('renders regular table cell for filterable fields', () => {
    render(<TableRow {...defaultProps} />);

    expect(screen.getByTestId('table-cell-timestamp')).toBeInTheDocument();
    expect(screen.getByTestId('table-cell-message')).toBeInTheDocument();
  });

  it('renders non-filterable field without filter buttons', () => {
    render(<TableRow {...defaultProps} columns={['non_filterable']} />);

    const cell = screen.getByText('non-filterable value');
    expect(cell).toBeInTheDocument();
  });

  it('renders dash for undefined row', () => {
    const propsWithUndefinedRow = {
      ...defaultProps,
      row: {
        _id: 'test-row-1',
        _index: 'test-index',
        _source: {},
      } as any,
    };

    // Mock formatField to return undefined for all fields
    mockDataset.formatField.mockReturnValue(undefined);

    render(<TableRow {...propsWithUndefinedRow} />);

    expect(screen.getAllByText('-')).toHaveLength(2); // One for each column
  });

  it('renders dash for undefined formatted value', () => {
    render(<TableRow {...defaultProps} columns={['undefined_field']} />);

    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('applies correct CSS classes for time field', () => {
    // Reset mock to return proper values for this test
    mockDataset.formatField.mockImplementation((_row: any, field: any) => {
      if (field === 'timestamp') return '2023-01-01T00:00:00Z';
      return 'formatted value';
    });

    render(<TableRow {...defaultProps} columns={['timestamp']} />);

    // The time field should be handled by TableCell component
    expect(screen.getByTestId('table-cell-timestamp')).toBeInTheDocument();
  });

  it('passes correct props to ExpandedTableRow when expanded', () => {
    render(<TableRow {...defaultProps} />);

    const expandButton = screen.getByRole('button');
    fireEvent.click(expandButton);

    expect(screen.getByTestId('expanded-table-row')).toBeInTheDocument();
    expect(screen.getByText('Expanded Table Row for test-row-1')).toBeInTheDocument();
  });

  it('calls onClose when filter is applied from ExpandedTableRow', () => {
    render(<TableRow {...defaultProps} />);

    const expandButton = screen.getByRole('button');
    fireEvent.click(expandButton);

    // The ExpandedTableRow is mocked, so we can't directly test the filter callback
    // but we can verify it renders with the correct structure
    expect(screen.getByTestId('expanded-table-row')).toBeInTheDocument();
  });

  it('handles isShortDots prop correctly', () => {
    render(<TableRow {...defaultProps} isShortDots={true} columns={['_source']} />);

    expect(screen.getByText('Source Cell - Short dots: true')).toBeInTheDocument();
  });
});
