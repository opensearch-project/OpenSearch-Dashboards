/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TableVis } from './table_vis';
import { VisColumn, VisFieldType } from '../types';
import { TableColumnHeader } from './table_vis_filter';
import { EuiDataGrid } from '@elastic/eui';

interface EuiDataGridColumn {
  id: string;
  displayAsText: string;
  display?: JSX.Element;
  [key: string]: any;
}

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
      renderFooterCellValue,
    }: {
      'aria-label': string;
      columns: EuiDataGridColumn[];
      columnVisibility: { visibleColumns: string[] };
      rowCount: number;
      pagination: { pageSize: number; pageIndex: number };
      renderCellValue: (props: {
        rowIndex: number;
        columnId: string;
        setCellProps: (props: any) => void;
      }) => any;
      renderFooterCellValue?: (props: {
        columnId: string;
        setCellProps: (props: any) => void;
      }) => any;
    }) => (
      <div data-test-subj="mockEuiDataGrid" aria-label={ariaLabel}>
        <div data-test-subj="mockColumns">
          {JSON.stringify(columns.map((c) => ({ id: c.id, displayAsText: c.displayAsText })))}
        </div>
        <div data-test-subj="mockColumnDisplays">
          {columns.map((c, index) => (
            <div key={index} data-test-subj={`mockColumn-${c.id}`}>
              {c.display}
            </div>
          ))}
        </div>
        <div data-test-subj="mockVisibleColumns">
          {JSON.stringify(columnVisibility.visibleColumns)}
        </div>
        <div data-test-subj="mockRowCount">{rowCount}</div>
        <div data-test-subj="mockPageSize">{pagination.pageSize}</div>
        <div data-test-subj="mockPageIndex">{pagination.pageIndex}</div>
        <div data-test-subj="mockCellValue">
          {renderCellValue({ rowIndex: 0, columnId: 'column1', setCellProps: jest.fn() })}
        </div>
        <div data-test-subj="mockFooterCellValue">
          {typeof renderFooterCellValue === 'function'
            ? renderFooterCellValue({ columnId: 'column1', setCellProps: jest.fn() })
            : 'no-footer'}
        </div>
      </div>
    )
  ),
}));

// Mock TableColumnHeader component
jest.mock('./table_vis_filter', () => ({
  TableColumnHeader: jest.fn(
    ({ col, showColumnFilter, popoverOpen, setPopoverOpen, filters, setFilters, uniques }) => (
      <button
        data-test-subj={`mockTableColumnHeader-${col.column}`}
        data-popover-open={popoverOpen ? 'true' : 'false'}
        onClick={() => setPopoverOpen(!popoverOpen)}
      >
        {col.name}
        <div data-test-subj={`mockUniques-${col.column}`}>{JSON.stringify(uniques)}</div>
        <div data-test-subj={`mockFilters-${col.column}`}>
          {JSON.stringify(filters[col.column] || {})}
        </div>
      </button>
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
    { column1: 10, column2: 'value1-2' },
    { column1: 20, column2: 'value2-2' },
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
    expect(screen.getByTestId('mockCellValue').textContent).toBe('10');
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
    expect(screen.getByTestId('mockCellValue').textContent).toBe('10');
  });

  test('excludes columns with no unique values from columnUniques', () => {
    const emptyRows = [{ column1: null, column2: null }];
    render(<TableVis rows={emptyRows} columns={mockColumns} />);
    const uniquesColumn1 = JSON.parse(
      screen.getByTestId('mockUniques-column1').textContent || '[]'
    );
    const uniquesColumn2 = JSON.parse(
      screen.getByTestId('mockUniques-column2').textContent || '[]'
    );
    expect(uniquesColumn1).toEqual([]);
    expect(uniquesColumn2).toEqual([]);
  });

  test('computes column uniques correctly', () => {
    render(<TableVis rows={mockRows} columns={mockColumns} />);

    // Check if uniques are computed and passed to TableColumnHeader
    const uniquesColumn1 = JSON.parse(
      screen.getByTestId('mockUniques-column1').textContent || '[]'
    );
    const uniquesColumn2 = JSON.parse(
      screen.getByTestId('mockUniques-column2').textContent || '[]'
    );
    expect(uniquesColumn1).toEqual([10, 20]);
    expect(uniquesColumn2).toEqual(['value1-2', 'value2-2']);
  });

  test('handles popover open/close in TableColumnHeader', () => {
    render(
      <TableVis
        rows={mockRows}
        columns={mockColumns}
        styleOptions={{ pageSize: 10, showColumnFilter: true }}
      />
    );

    // Check initial popover state
    const headerColumn1 = screen.getByTestId('mockTableColumnHeader-column1');
    expect(headerColumn1).toHaveAttribute('data-popover-open', 'false');

    // Simulate opening popover
    fireEvent.click(headerColumn1);
    expect(headerColumn1).toHaveAttribute('data-popover-open', 'true');

    // Simulate closing popover
    fireEvent.click(headerColumn1);
    expect(headerColumn1).toHaveAttribute('data-popover-open', 'false');
  });

  test('applies filters and clears when showColumnFilter is false', () => {
    const { rerender } = render(
      <TableVis
        rows={mockRows}
        columns={mockColumns}
        styleOptions={{ pageSize: 10, showColumnFilter: true }}
      />
    );

    // Verify TableColumnHeader was called
    expect(TableColumnHeader).toHaveBeenCalled();

    // Apply a filter
    const setFilters = (TableColumnHeader as jest.Mock).mock.calls[0][0].setFilters;
    setFilters({ column1: { values: [10], operator: '=' } });

    // Check filtered row count
    expect(screen.getByTestId('mockRowCount').textContent).toBe('1');

    // Disable showColumnFilter
    rerender(
      <TableVis
        rows={mockRows}
        columns={mockColumns}
        styleOptions={{ pageSize: 10, showColumnFilter: false }}
      />
    );

    // Check if filters are cleared and row count is restored
    expect(screen.getByTestId('mockRowCount').textContent).toBe('2');
    const filtersColumn1 = JSON.parse(
      screen.getByTestId('mockFilters-column1').textContent || '{}'
    );
    expect(filtersColumn1).toEqual({});
  });

  test('filters rows with different operators', () => {
    render(
      <TableVis
        rows={mockRows}
        columns={mockColumns}
        styleOptions={{ pageSize: 10, showColumnFilter: true }}
      />
    );

    // Verify TableColumnHeader was called
    expect(TableColumnHeader).toHaveBeenCalled();

    const setFilters = (TableColumnHeader as jest.Mock).mock.calls[0][0].setFilters;

    // Test 'contains' operator
    setFilters({ column2: { search: 'value1', operator: 'contains' } });
    expect(screen.getByTestId('mockRowCount').textContent).toBe('1');

    // Test '=' operator
    setFilters({ column1: { values: [10], operator: '=' } });
    expect(screen.getByTestId('mockRowCount').textContent).toBe('1');

    // Test '!=' operator
    setFilters({ column1: { values: [10], operator: '!=' } });
    expect(screen.getByTestId('mockRowCount').textContent).toBe('1');

    // Test '>' operator
    setFilters({ column1: { search: '15', operator: '>' } });
    expect(screen.getByTestId('mockRowCount').textContent).toBe('1');

    // Test '<' operator
    setFilters({ column1: { search: '15', operator: '<' } });
    expect(screen.getByTestId('mockRowCount').textContent).toBe('1');

    // Test invalid numeric comparison (non-numeric value)
    setFilters({ column1: { search: 'invalid', operator: '>' } });
    expect(screen.getByTestId('mockRowCount').textContent).toBe('0');
  });

  test('renders footer with calculations', () => {
    const styleOptions = {
      pageSize: 10,
      showFooter: true,
      footerCalculations: [
        { fields: ['column1'], calculation: 'total' as const },
        { fields: ['column1'], calculation: 'average' as const },
      ],
    };
    render(<TableVis rows={mockRows} columns={mockColumns} styleOptions={styleOptions} />);

    // Check footer cell value
    const footerCellValue = screen.getByTestId('mockFooterCellValue').textContent;
    expect(footerCellValue).toBe('Average: 15');
  });

  test('handles empty footer calculations', () => {
    const styleOptions = {
      pageSize: 10,
      showFooter: true,
      footerCalculations: [],
    };
    render(<TableVis rows={mockRows} columns={mockColumns} styleOptions={styleOptions} />);

    // Check no footer is rendered
    expect(screen.getByTestId('mockFooterCellValue').textContent).toBe('no-footer');
  });

  test('applies global alignment to cells and footer', () => {
    // Test cell and footer alignment in a single render
    const styleOptions = {
      pageSize: 10,
      globalAlignment: 'center' as const,
      showFooter: true,
      footerCalculations: [{ fields: ['column1'], calculation: 'total' as const }],
    };
    render(<TableVis rows={mockRows} columns={mockColumns} styleOptions={styleOptions} />);

    const dataGridProps = (jest.mocked(EuiDataGrid) as jest.Mock).mock.calls[0][0];
    const { renderCellValue, renderFooterCellValue } = dataGridProps;

    // Test cell alignment
    const setCellProps = jest.fn();
    const cellValue = renderCellValue({
      rowIndex: 0,
      columnId: 'column1',
      setCellProps,
    });
    expect(cellValue).toBe(10);
    expect(setCellProps).toHaveBeenCalledWith({ style: { textAlign: 'center' } });

    // Test footer alignment
    const footerSetCellProps = jest.fn();
    expect(renderFooterCellValue).toBeDefined();
    const footerCellValue = renderFooterCellValue({
      columnId: 'column1',
      setCellProps: footerSetCellProps,
    });
    expect(footerCellValue).toBe('Total: 30');
    expect(footerSetCellProps).toHaveBeenCalledWith({ style: { textAlign: 'center' } });

    // Verify rendered footer value in DOM
    expect(screen.getByTestId('mockFooterCellValue').textContent).toBe('Total: 30');
  });

  test('applies type-based alignment when globalAlignment is auto', () => {
    const styleOptions = {
      pageSize: 10,
      globalAlignment: 'auto' as const,
      showFooter: true,
      footerCalculations: [{ fields: ['column1', 'column2'], calculation: 'total' as const }],
    };
    render(<TableVis rows={mockRows} columns={mockColumns} styleOptions={styleOptions} />);
    const dataGridProps = (jest.mocked(EuiDataGrid) as jest.Mock).mock.calls[0][0];
    const { renderCellValue, renderFooterCellValue } = dataGridProps;
    // Test cell alignment for numerical column
    const setCellPropsNum = jest.fn();
    const cellValueNum = renderCellValue({
      rowIndex: 0,
      columnId: 'column1',
      setCellProps: setCellPropsNum,
    });
    expect(cellValueNum).toBe(10);
    expect(setCellPropsNum).toHaveBeenCalledWith({ style: { textAlign: 'right' } });
    // Test cell alignment for categorical column
    const setCellPropsCat = jest.fn();
    const cellValueCat = renderCellValue({
      rowIndex: 0,
      columnId: 'column2',
      setCellProps: setCellPropsCat,
    });
    expect(cellValueCat).toBe('value1-2');
    expect(setCellPropsCat).toHaveBeenCalledWith({ style: { textAlign: 'left' } });
    // Test footer alignment for numerical column
    const footerSetCellPropsNum = jest.fn();
    const footerCellValueNum = renderFooterCellValue({
      columnId: 'column1',
      setCellProps: footerSetCellPropsNum,
    });
    expect(footerCellValueNum).toBe('Total: 30');
    expect(footerSetCellPropsNum).toHaveBeenCalledWith({ style: { textAlign: 'right' } });
    // Test footer alignment for categorical column
    const footerSetCellPropsCat = jest.fn();
    const footerCellValueCat = renderFooterCellValue({
      columnId: 'column2',
      setCellProps: footerSetCellPropsCat,
    });
    expect(footerCellValueCat).toBe('-'); // No numerical values for categorical column
    expect(footerSetCellPropsCat).toHaveBeenCalledWith({ style: { textAlign: 'left' } });
  });
});
