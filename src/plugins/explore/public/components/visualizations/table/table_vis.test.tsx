/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TableVis } from './table_vis';
import { VisColumn, VisFieldType } from '../types';
import { TableColumnHeader } from './table_vis_filter';
import { EuiDataGrid } from '@elastic/eui';
import { DataLink } from './data_link_options';
import * as CellValueModule from './cell_value';

interface EuiDataGridColumn {
  id: string;
  displayAsText: string;
  display?: JSX.Element;
  [key: string]: any;
}

interface ContextMenuItem {
  name: string;
  href: string;
  target?: string;
  rel?: string;
}

interface CustomEuiContextMenuPanelDescriptor {
  id: number;
  items?: ContextMenuItem[];
}

// Mock EuiDataGrid component
jest.mock('@elastic/eui', () => {
  const actualEui = jest.requireActual('@elastic/eui');
  return {
    ...actualEui,
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
        }) => JSX.Element;
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
          <div data-test-subj="mockCellValues">
            {columns.map((col) =>
              Array.from({ length: Math.min(rowCount, pagination.pageSize) }).map((_, rowIndex) => (
                <div
                  key={`${rowIndex}-${col.id}`}
                  data-test-subj={`cellValue-${rowIndex}-${col.id}`}
                >
                  {renderCellValue({ rowIndex, columnId: col.id, setCellProps: jest.fn() })}
                </div>
              ))
            )}
          </div>
          <div data-test-subj="mockFooterCellValue">
            {typeof renderFooterCellValue === 'function'
              ? columns.map((col) => (
                  <div key={col.id} data-test-subj={`footerCell-${col.id}`}>
                    {renderFooterCellValue({ columnId: col.id, setCellProps: jest.fn() })}
                  </div>
                ))
              : 'no-footer'}
          </div>
        </div>
      )
    ),
    EuiPopover: jest.fn(({ button, isOpen, closePopover, children }) => (
      <div data-test-subj="mockEuiPopover" data-is-open={isOpen}>
        <div data-test-subj="mockPopoverButton">{button}</div>
        {isOpen && <div data-test-subj="mockPopoverContent">{children}</div>}
      </div>
    )),
    EuiContextMenu: jest.fn(({ panels }: { panels: CustomEuiContextMenuPanelDescriptor[] }) => (
      <div data-test-subj="mockEuiContextMenu">
        {panels[0]?.items?.map((item, index: number) => (
          <a
            key={index}
            href={item.href}
            target={item.target}
            rel={item.rel}
            data-test-subj={`mockContextMenuItem-${item.name}`}
          >
            {item.name}
          </a>
        )) || <div>No items</div>}
      </div>
    )),
  };
});

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

// Mock CellValue component to extract text content
jest.mock('./cell_value', () => {
  const mock = {
    setPopoverOpenCellMock: jest.fn(),
  };

  return {
    __esModule: true,
    ...mock,
    CellValue: ({ value, columnId, textAlign, dataLinks, isPopoverOpen, setCellProps }: any) => {
      setCellProps({ style: { textAlign } });

      const applicableLinks =
        dataLinks?.filter((link: any) => columnId && link.fields.includes(columnId)) || [];

      return (
        <div data-test-subj={`cellValueWrapper-${columnId}-${value}`}>
          <button
            data-test-subj={`cellValueButton-${columnId}-${value}`}
            onClick={() => mock.setPopoverOpenCellMock({ rowIndex: 0, columnId })}
          >
            {value}
          </button>
          {isPopoverOpen && (
            <div data-test-subj={`mockPopoverContent-${columnId}-${value}`}>
              {applicableLinks.map((link: any, i: number) => (
                <a key={i} href={link.url} data-test-subj={`mockContextMenuItem-${link.title}`}>
                  {link.title}
                </a>
              ))}
            </div>
          )}
        </div>
      );
    },
  };
});

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
  const mockDataLinks: DataLink[] = [
    {
      id: 'link1',
      title: 'Link 1',
      url: 'http://example.com/${__value.text}',
      openInNewTab: false,
      fields: ['column1'],
    },
    {
      id: 'link2',
      title: 'Link 2',
      url: 'http://other.com/${__value.text}',
      openInNewTab: true,
      fields: ['column1'],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with default props', () => {
    render(<TableVis rows={mockRows} columns={mockColumns} />);
    expect(screen.getByTestId('mockEuiDataGrid')).toHaveAttribute(
      'aria-label',
      'Table visualization'
    );
    const columnsJson = screen.getByTestId('mockColumns').textContent;
    const parsedColumns = JSON.parse(columnsJson || '[]');
    expect(parsedColumns).toHaveLength(2);
    expect(parsedColumns[0].id).toBe('column1');
    expect(parsedColumns[0].displayAsText).toBe('Column 1');
    expect(parsedColumns[1].id).toBe('column2');
    expect(parsedColumns[1].displayAsText).toBe('Column 2');
    const visibleColumnsJson = screen.getByTestId('mockVisibleColumns').textContent;
    const parsedVisibleColumns = JSON.parse(visibleColumnsJson || '[]');
    expect(parsedVisibleColumns).toEqual(['column1', 'column2']);
    expect(screen.getByTestId('mockRowCount').textContent).toBe('2');
    expect(screen.getByTestId('mockPageSize').textContent).toBe('10');
    expect(screen.getByTestId('mockPageIndex').textContent).toBe('0');
    expect(screen.getByTestId('cellValue-0-column1')).toBeInTheDocument();
  });

  test('renders with custom page size', () => {
    render(<TableVis rows={mockRows} columns={mockColumns} styleOptions={{ pageSize: 15 }} />);
    expect(screen.getByTestId('mockPageSize').textContent).toBe('15');
  });

  test('handles cell value rendering for non-existent row', () => {
    const { rerender } = render(<TableVis rows={[]} columns={mockColumns} />);
    expect(screen.queryByTestId('cellValue-0-column1')).not.toBeInTheDocument();
    rerender(<TableVis rows={mockRows} columns={mockColumns} />);
    expect(screen.getByTestId('cellValue-0-column1')).toBeInTheDocument();
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
    const headerColumn1 = screen.getByTestId('mockTableColumnHeader-column1');
    expect(headerColumn1).toHaveAttribute('data-popover-open', 'false');
    fireEvent.click(headerColumn1);
    expect(headerColumn1).toHaveAttribute('data-popover-open', 'true');
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
    expect(TableColumnHeader).toHaveBeenCalled();
    const setFilters = (TableColumnHeader as jest.Mock).mock.calls[0][0].setFilters;
    setFilters({ column1: { values: [10], operator: '=' } });
    expect(screen.getByTestId('mockRowCount').textContent).toBe('1');
    rerender(
      <TableVis
        rows={mockRows}
        columns={mockColumns}
        styleOptions={{ pageSize: 10, showColumnFilter: false }}
      />
    );
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
    expect(TableColumnHeader).toHaveBeenCalled();
    const setFilters = (TableColumnHeader as jest.Mock).mock.calls[0][0].setFilters;
    setFilters({ column2: { search: 'value1', operator: 'contains' } });
    expect(screen.getByTestId('mockRowCount').textContent).toBe('1');
    setFilters({ column1: { values: [10], operator: '=' } });
    expect(screen.getByTestId('mockRowCount').textContent).toBe('1');
    setFilters({ column1: { values: [10], operator: '!=' } });
    expect(screen.getByTestId('mockRowCount').textContent).toBe('1');
    setFilters({ column1: { search: '15', operator: '>' } });
    expect(screen.getByTestId('mockRowCount').textContent).toBe('1');
    setFilters({ column1: { search: '15', operator: '<' } });
    expect(screen.getByTestId('mockRowCount').textContent).toBe('1');
    setFilters({ column1: { search: 'invalid', operator: '>' } });
    expect(screen.getByTestId('mockRowCount').textContent).toBe('0');
  });

  test('renders footer with calculations', () => {
    const styleOptions = {
      pageSize: 10,
      showFooter: true,
      footerCalculations: [{ fields: ['column1'], calculation: 'mean' as const }],
    };
    render(<TableVis rows={mockRows} columns={mockColumns} styleOptions={styleOptions} />);
    const footerCell = screen.getByTestId('footerCell-column1');
    expect(footerCell.textContent).toBe('Mean: 15');
  });

  test('handles empty footer calculations', () => {
    const styleOptions = {
      pageSize: 10,
      showFooter: true,
      footerCalculations: [],
    };
    render(<TableVis rows={mockRows} columns={mockColumns} styleOptions={styleOptions} />);
    const footerCell = screen.getByTestId('footerCell-column1');
    expect(footerCell.textContent).toBe('-');
  });

  test('applies type-based alignment when globalAlignment is auto', () => {
    const styleOptions = {
      pageSize: 10,
      globalAlignment: 'auto' as const,
      showFooter: true,
      footerCalculations: [{ fields: ['column1', 'column2'], calculation: 'total' as const }],
    };

    // Mock useState to control state
    const setVisibleColumnsMock = jest.fn();
    const setPaginationMock = jest.fn();
    const setFiltersMock = jest.fn();
    const setPopoverOpenColumnIdMock = jest.fn();
    const setPopoverOpenCellMock = jest.fn();

    jest
      .spyOn(React, 'useState')
      .mockImplementationOnce(() => [mockColumns.map((c) => c.column), setVisibleColumnsMock])
      .mockImplementationOnce(() => [{ pageIndex: 0, pageSize: 10 }, setPaginationMock])
      .mockImplementationOnce(() => [{}, setFiltersMock])
      .mockImplementationOnce(() => [null, setPopoverOpenColumnIdMock])
      .mockImplementationOnce(() => [null, setPopoverOpenCellMock]);

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
    render(cellValueNum);
    expect(setCellPropsNum).toHaveBeenCalledWith(
      expect.objectContaining({ style: expect.objectContaining({ textAlign: 'right' }) })
    );

    // Test cell alignment for categorical column
    const setCellPropsCat = jest.fn();
    const cellValueCat = renderCellValue({
      rowIndex: 0,
      columnId: 'column2',
      setCellProps: setCellPropsCat,
    });
    render(cellValueCat);
    expect(setCellPropsCat).toHaveBeenCalledWith(
      expect.objectContaining({ style: expect.objectContaining({ textAlign: 'left' }) })
    );

    // Test footer alignment for numerical column
    const footerSetCellPropsNum = jest.fn();
    const footerCellValueNum = renderFooterCellValue({
      columnId: 'column1',
      setCellProps: footerSetCellPropsNum,
    });
    const { container: numContainer } = render(footerCellValueNum);
    expect(numContainer.textContent).toBe('Total: 30');
    expect(footerSetCellPropsNum).toHaveBeenCalledWith(
      expect.objectContaining({ style: expect.objectContaining({ textAlign: 'right' }) })
    );

    // Test footer alignment for categorical column
    const footerSetCellPropsCat = jest.fn();
    const footerCellValueCat = renderFooterCellValue({
      columnId: 'column2',
      setCellProps: footerSetCellPropsCat,
    });
    const { container: catContainer } = render(footerCellValueCat);
    expect(catContainer.textContent).toBe('-');
    expect(footerSetCellPropsCat).toHaveBeenCalledWith(
      expect.objectContaining({ style: expect.objectContaining({ textAlign: 'left' }) })
    );
  });

  test('handles popover open/close in CellValue with multiple data links', async () => {
    const styleOptions = {
      pageSize: 10,
      dataLinks: mockDataLinks,
    };

    // Mock setPopoverOpenCell to capture state changes
    const { setPopoverOpenCellMock } = CellValueModule as any;

    render(<TableVis rows={mockRows} columns={mockColumns} styleOptions={styleOptions} />);

    fireEvent.click(screen.getByTestId('cellValueButton-column1-10'));

    await waitFor(() => {
      expect(setPopoverOpenCellMock).toHaveBeenCalledWith({ rowIndex: 0, columnId: 'column1' });
    });
  });
});
