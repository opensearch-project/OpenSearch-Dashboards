/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TableRowContent } from './table_row_content';

// Mock child components
jest.mock('../table_cell/table_cell', () => ({
  TableCell: ({ columnId, sanitizedCellValue }: any) => (
    <td data-test-subj={`table-cell-${columnId}`}>{sanitizedCellValue}</td>
  ),
}));

jest.mock('../table_cell/empty_table_cell', () => ({
  EmptyTableCell: ({ colName }: any) => <td data-test-subj={`empty-cell-${colName}`}>-</td>,
}));

jest.mock('../table_cell/source_field_table_cell', () => ({
  SourceFieldTableCell: ({ colName }: any) => (
    <td data-test-subj={`source-cell-${colName}`}>Source Content</td>
  ),
}));

jest.mock('../table_cell/non_filterable_table_cell', () => ({
  NonFilterableTableCell: ({ colName, sanitizedCellValue }: any) => (
    <td data-test-subj={`non-filterable-cell-${colName}`}>{sanitizedCellValue}</td>
  ),
}));

jest.mock('dompurify', () => ({
  sanitize: jest.fn((str) => `sanitized_${str}`),
}));

describe('TableRowContent', () => {
  const mockDataset = {
    fields: { getByName: jest.fn() },
    flattenHit: jest.fn(),
    formatField: jest.fn(),
    timeFieldName: 'timestamp',
  };

  const mockRow = {
    _id: 'test-row-1',
    _index: 'test-index',
    _source: { field1: 'value1' },
    isAnchor: false,
  };

  const mockOnToggleExpand = jest.fn();

  const defaultProps = {
    row: mockRow,
    columns: ['field1', 'field2'],
    dataset: mockDataset,
    onFilter: jest.fn(),
    isShortDots: false,
    isExpanded: false,
    onToggleExpand: mockOnToggleExpand,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDataset.flattenHit.mockReturnValue({
      field1: 'flattened_value1',
      field2: 'flattened_value2',
    });
  });

  it('renders table row with expand toggle', () => {
    render(
      <table>
        <tbody>
          <TableRowContent {...(defaultProps as any)} />
        </tbody>
      </table>
    );

    const expandButton = screen.getByRole('button');
    expect(expandButton).toBeInTheDocument();
  });

  it('calls onToggleExpand when expand button is clicked', () => {
    render(
      <table>
        <tbody>
          <TableRowContent {...(defaultProps as any)} />
        </tbody>
      </table>
    );

    const expandButton = screen.getByRole('button');
    fireEvent.click(expandButton);

    expect(mockOnToggleExpand).toHaveBeenCalledTimes(1);
  });

  it('renders source field cell for _source type', () => {
    mockDataset.fields.getByName.mockReturnValue({ type: '_source' });

    render(
      <table>
        <tbody>
          <TableRowContent {...(defaultProps as any)} columns={['_source']} />
        </tbody>
      </table>
    );

    expect(screen.getByTestId('source-cell-_source')).toBeInTheDocument();
  });

  it('renders empty cells when formatField returns undefined', () => {
    mockDataset.fields.getByName.mockReturnValue({ type: 'string', filterable: true });
    mockDataset.formatField.mockReturnValue(undefined);

    render(
      <table>
        <tbody>
          <TableRowContent {...(defaultProps as any)} />
        </tbody>
      </table>
    );

    expect(screen.getByTestId('empty-cell-field1')).toBeInTheDocument();
    expect(screen.getByTestId('empty-cell-field2')).toBeInTheDocument();
  });

  it('renders regular table cells for filterable fields', () => {
    mockDataset.fields.getByName.mockReturnValue({ type: 'string', filterable: true });
    mockDataset.formatField.mockReturnValue('test_value');

    render(
      <table>
        <tbody>
          <TableRowContent {...(defaultProps as any)} />
        </tbody>
      </table>
    );

    expect(screen.getByTestId('table-cell-field1')).toBeInTheDocument();
    expect(screen.getByTestId('table-cell-field2')).toBeInTheDocument();
  });
});
