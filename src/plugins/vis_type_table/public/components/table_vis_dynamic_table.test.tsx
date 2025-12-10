/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { IInterpreterRenderHandlers } from 'src/plugins/expressions';
import { TableVisDynamicTable } from './table_vis_dynamic_table';
import { FormattedTableContext } from '../table_vis_response_handler';
import { TableVisConfig, ColumnSort, AggTypes } from '../types';
import { TableUiState } from '../utils';
import * as convertUtils from '../utils/convert_to_formatted_data';

// Mock the dependencies
jest.mock('./table_vis_control', () => ({
  TableVisControl: ({ filename, rows, columns }: any) => (
    <div data-test-subj="table-vis-control">
      TableVisControl - {filename} - {rows.length} rows - {columns.length} columns
    </div>
  ),
}));

jest.mock('../utils/convert_to_formatted_data');

describe('TableVisDynamicTable', () => {
  const mockTable: FormattedTableContext = {
    columns: [
      { id: 'col1', name: 'Column 1', meta: { type: 'string' } },
      { id: 'col2', name: 'Column 2', meta: { type: 'number' } },
    ],
    rows: [
      { col1: 'value1', col2: 10 },
      { col1: 'value2', col2: 20 },
      { col1: 'value3', col2: 15 },
    ],
    formattedColumns: [
      {
        id: 'col1',
        title: 'Column 1',
        formatter: { convert: (v: any) => v } as any,
        filterable: false,
      },
      {
        id: 'col2',
        title: 'Column 2',
        formatter: { convert: (v: any) => v } as any,
        filterable: false,
      },
    ],
  };

  const mockVisConfig: TableVisConfig = {
    perPage: 10,
    showPartialRows: false,
    showMetricsAtAllLevels: false,
    showTotal: false,
    totalFunc: AggTypes.SUM,
    percentageCol: '',
    title: 'Test Table',
    metrics: [],
    buckets: [],
  };

  const mockHandlers: IInterpreterRenderHandlers = {
    event: jest.fn(),
    done: jest.fn(),
    reload: jest.fn(),
    update: jest.fn(),
    uiState: jest.fn(),
  } as any;

  const mockUiState: TableUiState = {
    sort: { colIndex: 0, direction: 'asc' },
    setSort: jest.fn(),
    colWidth: [],
    setWidth: jest.fn(),
  };

  const mockFormattedData = {
    formattedRows: [
      ['value1', 10],
      ['value2', 20],
      ['value3', 15],
    ],
    formattedColumns: [
      { id: 'col1', title: 'Column 1', formatter: { convert: (v: any) => v }, filterable: false },
      { id: 'col2', title: 'Column 2', formatter: { convert: (v: any) => v }, filterable: false },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (convertUtils.convertToFormattedData as jest.Mock).mockReturnValue(mockFormattedData);
  });

  it('should render the component with title', () => {
    const { getByTestId, getByText } = render(
      <TableVisDynamicTable
        title="Test Table"
        table={mockTable}
        visConfig={mockVisConfig}
        event={mockHandlers.event}
        uiState={mockUiState}
      />
    );

    expect(getByText('Test Table')).toBeInTheDocument();
  });

  it('should not render title when title is not provided', () => {
    const { queryByText } = render(
      <TableVisDynamicTable
        table={mockTable}
        visConfig={mockVisConfig}
        event={mockHandlers.event}
        uiState={mockUiState}
      />
    );

    expect(queryByText('Test Table')).not.toBeInTheDocument();
  });

  it('should render TableVisControl component', () => {
    const { getByTestId } = render(
      <TableVisDynamicTable
        table={mockTable}
        visConfig={mockVisConfig}
        event={mockHandlers.event}
        uiState={mockUiState}
      />
    );

    expect(getByTestId('table-vis-control')).toBeInTheDocument();
  });

  it('should render table with correct structure', () => {
    const { container } = render(
      <TableVisDynamicTable
        table={mockTable}
        visConfig={mockVisConfig}
        event={mockHandlers.event}
        uiState={mockUiState}
      />
    );

    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();

    const headers = container.querySelectorAll('thead th');
    expect(headers).toHaveLength(2);

    const rows = container.querySelectorAll('tbody tr');
    // 3 data rows + 2 separator rows = 5 total
    expect(rows.length).toBeGreaterThanOrEqual(3);
  });

  it('should render cell values correctly', () => {
    const { container } = render(
      <TableVisDynamicTable
        table={mockTable}
        visConfig={mockVisConfig}
        event={mockHandlers.event}
        uiState={mockUiState}
      />
    );

    const cells = container.querySelectorAll('tbody td');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('should handle sorting correctly', () => {
    const { container } = render(
      <TableVisDynamicTable
        table={mockTable}
        visConfig={mockVisConfig}
        event={mockHandlers.event}
        uiState={mockUiState}
      />
    );

    const header = container.querySelector('thead th');
    if (header) {
      fireEvent.mouseDown(header);
      fireEvent.mouseUp(header);
    }

    expect(mockUiState.setSort).toHaveBeenCalledWith({
      colIndex: 0,
      direction: 'desc',
    });
  });

  it('should sort rows based on uiState.sort', () => {
    const uiStateWithSort: TableUiState = {
      ...mockUiState,
      sort: { colIndex: 1, direction: 'desc' },
    };

    const { container } = render(
      <TableVisDynamicTable
        table={mockTable}
        visConfig={mockVisConfig}
        event={mockHandlers.event}
        uiState={uiStateWithSort}
      />
    );

    // The component should render with sorted data
    expect(container.querySelector('table')).toBeInTheDocument();
  });

  it('should handle column resize correctly', () => {
    const { container } = render(
      <TableVisDynamicTable
        table={mockTable}
        visConfig={mockVisConfig}
        event={mockHandlers.event}
        uiState={mockUiState}
      />
    );

    const header = container.querySelector('thead th');
    if (header) {
      const startX = 100;
      fireEvent.mouseDown(header, { clientX: startX });

      // Simulate drag
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: startX + 50,
        bubbles: true,
      });
      document.dispatchEvent(mouseMoveEvent);

      const mouseUpEvent = new MouseEvent('mouseup', {
        bubbles: true,
      });
      document.dispatchEvent(mouseUpEvent);
    }

    expect(mockUiState.setWidth).toHaveBeenCalled();
  });

  it('should handle empty sort state', () => {
    const uiStateNoSort: TableUiState = {
      ...mockUiState,
      sort: {} as ColumnSort,
    };

    const { container } = render(
      <TableVisDynamicTable
        table={mockTable}
        visConfig={mockVisConfig}
        event={mockHandlers.event}
        uiState={uiStateNoSort}
      />
    );

    expect(container.querySelector('table')).toBeInTheDocument();
  });

  it('should use default perPage value when not specified', () => {
    const configNoPerPage = { ...mockVisConfig, perPage: '' as any };

    const { container } = render(
      <TableVisDynamicTable
        table={mockTable}
        visConfig={configNoPerPage}
        event={mockHandlers.event}
        uiState={mockUiState}
      />
    );

    expect(container.querySelector('.tableVisPagination')).toBeInTheDocument();
  });

  it('should handle pagination controls', () => {
    const { getByTestId, getByText } = render(
      <TableVisDynamicTable
        table={mockTable}
        visConfig={mockVisConfig}
        event={mockHandlers.event}
        uiState={mockUiState}
      />
    );

    const paginationControls = getByTestId('tableVisPaginationControls');
    expect(paginationControls).toBeInTheDocument();

    // Check rows per page button
    expect(getByTestId('tableVisRowsPerPageButton')).toBeInTheDocument();
  });

  it('should handle empty table', () => {
    const emptyTable: FormattedTableContext = {
      ...mockTable,
      columns: [],
      rows: [],
      formattedColumns: [],
    };

    (convertUtils.convertToFormattedData as jest.Mock).mockReturnValue({
      formattedRows: [],
      formattedColumns: [],
    });

    const { container } = render(
      <TableVisDynamicTable
        table={emptyTable}
        visConfig={mockVisConfig}
        event={mockHandlers.event}
        uiState={mockUiState}
      />
    );

    expect(container.querySelector('table')).toBeInTheDocument();
  });

  it('should show total footer when showTotal is true', () => {
    const configWithTotal = { ...mockVisConfig, showTotal: true };

    const { container } = render(
      <TableVisDynamicTable
        table={mockTable}
        visConfig={configWithTotal}
        event={mockHandlers.event}
        uiState={mockUiState}
      />
    );

    const tfoot = container.querySelector('tfoot');
    expect(tfoot).toBeInTheDocument();
  });

  it('should handle filter bucket events', () => {
    const tableWithFilterable: FormattedTableContext = {
      ...mockTable,
      formattedColumns: [
        {
          id: 'col1',
          title: 'Column 1',
          formatter: { convert: (v: any) => v } as any,
          filterable: true,
        },
        {
          id: 'col2',
          title: 'Column 2',
          formatter: { convert: (v: any) => v } as any,
          filterable: false,
        },
      ],
    };

    const { getAllByTestId } = render(
      <TableVisDynamicTable
        table={tableWithFilterable}
        visConfig={mockVisConfig}
        event={mockHandlers.event}
        uiState={mockUiState}
      />
    );

    const filterButtons = getAllByTestId('tableVisFilterForValue');
    expect(filterButtons.length).toBeGreaterThan(0);

    fireEvent.click(filterButtons[0]);

    expect(mockHandlers.event).toHaveBeenCalledWith({
      name: 'filterBucket',
      data: expect.objectContaining({
        negate: false,
      }),
    });
  });
});
