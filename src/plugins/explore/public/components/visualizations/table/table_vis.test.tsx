/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { TableVis } from './table_vis';
import { VisColumn, VisFieldType } from '../types';

// Mock EuiDataGrid component
jest.mock('@elastic/eui', () => ({
  EuiDataGrid: jest.fn(
    ({
      'aria-label': ariaLabel,
      columns,
      columnVisibility,
      rowCount,
      pagination,
      renderCellValue,
    }) => (
      <div data-test-subj="mockEuiDataGrid" aria-label={ariaLabel}>
        <div data-test-subj="mockColumns">{JSON.stringify(columns)}</div>
        <div data-test-subj="mockVisibleColumns">
          {JSON.stringify(columnVisibility.visibleColumns)}
        </div>
        <div data-test-subj="mockRowCount">{rowCount}</div>
        <div data-test-subj="mockPageSize">{pagination.pageSize}</div>
        <div data-test-subj="mockPageIndex">{pagination.pageIndex}</div>
        <div data-test-subj="mockCellValue">
          {renderCellValue({ rowIndex: 0, columnId: 'column1' })}
        </div>
      </div>
    )
  ),
}));

describe('TableVis', () => {
  const mockColumns: VisColumn[] = [
    {
      id: 1,
      name: 'Column 1',
      column: 'column1',
      schema: VisFieldType.Numerical,
      validValuesCount: 2,
      uniqueValuesCount: 2,
    },
    {
      id: 2,
      name: 'Column 2',
      column: 'column2',
      schema: VisFieldType.Categorical,
      validValuesCount: 2,
      uniqueValuesCount: 2,
    },
  ];

  const mockRows = [
    { column1: 'value1-1', column2: 'value1-2' },
    { column1: 'value2-1', column2: 'value2-2' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with default props', () => {
    render(<TableVis rows={mockRows} columns={mockColumns} />);

    // Check if the component renders with the correct aria-label
    expect(screen.getByTestId('mockEuiDataGrid')).toHaveAttribute(
      'aria-label',
      'Table visualization'
    );

    // Check if columns are correctly passed to EuiDataGrid
    const columnsJson = screen.getByTestId('mockColumns').textContent;
    const parsedColumns = JSON.parse(columnsJson || '[]');
    expect(parsedColumns).toHaveLength(2);
    expect(parsedColumns[0].id).toBe('column1');
    expect(parsedColumns[0].displayAsText).toBe('Column 1');
    expect(parsedColumns[1].id).toBe('column2');
    expect(parsedColumns[1].displayAsText).toBe('Column 2');

    // Check if visible columns are set correctly
    const visibleColumnsJson = screen.getByTestId('mockVisibleColumns').textContent;
    const parsedVisibleColumns = JSON.parse(visibleColumnsJson || '[]');
    expect(parsedVisibleColumns).toEqual(['column1', 'column2']);

    // Check if row count is correct
    expect(screen.getByTestId('mockRowCount').textContent).toBe('2');

    // Check if default page size is applied
    expect(screen.getByTestId('mockPageSize').textContent).toBe('10');

    // Check if initial page index is 0
    expect(screen.getByTestId('mockPageIndex').textContent).toBe('0');

    // Check if cell value rendering works
    expect(screen.getByTestId('mockCellValue').textContent).toBe('value1-1');
  });

  test('renders with custom page size', () => {
    render(<TableVis rows={mockRows} columns={mockColumns} styleOptions={{ pageSize: 15 }} />);

    // Check if custom page size is applied
    expect(screen.getByTestId('mockPageSize').textContent).toBe('15');
  });

  test('handles cell value rendering for non-existent row', () => {
    const { rerender } = render(<TableVis rows={[]} columns={mockColumns} />);

    // With empty rows, cell value should be null
    expect(screen.getByTestId('mockCellValue').textContent).toBe('');

    // Rerender with rows
    rerender(<TableVis rows={mockRows} columns={mockColumns} />);
    expect(screen.getByTestId('mockCellValue').textContent).toBe('value1-1');
  });
});
