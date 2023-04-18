/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import { TableVisConfig, ColumnSort } from '../types';
import { TableVisComponent } from './table_vis_component';
import { FormattedColumn } from '../types';
import { FormattedTableContext } from '../table_vis_response_handler';
import { getTableVisCellValue } from './table_vis_cell';
import { getDataGridColumns } from './table_vis_grid_columns';
import { EuiDataGridColumn } from '@elastic/eui';

jest.mock('./table_vis_cell', () => ({
  getTableVisCellValue: jest.fn(() => () => {}),
}));

const mockGetDataGridColumns = jest.fn(() => []);
jest.mock('./table_vis_grid_columns', () => ({
  getDataGridColumns: jest.fn(() => mockGetDataGridColumns()),
}));

const table = {
  formattedColumns: [
    {
      id: 'col-0-2',
      title: 'name.keyword: Descending',
      formatter: {},
      filterable: true,
    },
    {
      id: 'col-1-1',
      title: 'Count',
      formatter: {},
      filterable: false,
      sumTotal: 5,
      formattedTotal: 5,
      total: 5,
    },
  ] as FormattedColumn[],
  rows: [
    { 'col-0-2': 'Alice', 'col-1-1': 3 },
    { 'col-0-2': 'Anthony', 'col-1-1': 1 },
    { 'col-0-2': 'Timmy', 'col-1-1': 1 },
  ],
  columns: [
    { id: 'col-0-2', name: 'Name' },
    { id: 'col-1-1', name: 'Count' },
  ],
} as FormattedTableContext;

const visConfig = {
  buckets: [
    {
      accessor: 0,
      aggType: 'terms',
      format: {
        id: 'terms',
        params: {
          id: 'number',
          missingBucketLabel: 'Missing',
          otherBucketLabel: 'Other',
          parsedUrl: {
            basePath: '/arf',
            origin: '',
            pathname: '/arf/app/home',
          },
        },
      },
      label: 'age: Descending',
      params: {},
    },
  ],
  metrics: [
    {
      accessor: 1,
      aggType: 'count',
      format: {
        id: 'number',
      },
      label: 'Count',
      params: {},
    },
  ],
  perPage: 10,
  percentageCol: '',
  showMetricsAtAllLevels: false,
  showPartialRows: false,
  showTotal: false,
  title: '',
  totalFunc: 'sum',
} as TableVisConfig;

const uiState = {
  sort: {} as ColumnSort,
  setSort: jest.fn(),
  colWidth: [],
  setWidth: jest.fn(),
};

describe('TableVisComponent', function () {
  const props = {
    title: '',
    table,
    visConfig,
    event: jest.fn(),
    uiState,
  };

  const dataGridColumnsValue = [
    {
      id: 'col-0-2',
      display: 'name.keyword: Descending',
      displayAsText: 'name.keyword: Descending',
      actions: {
        showHide: false,
        showMoveLeft: false,
        showMoveRight: false,
        showSortAsc: {},
        showSortDesc: {},
      },
      cellActions: expect.any(Function),
    },
    {
      id: 'col-1-1',
      display: 'Count',
      displayAsText: 'Count',
      actions: {
        showHide: false,
        showMoveLeft: false,
        showMoveRight: false,
        showSortAsc: {},
        showSortDesc: {},
      },
      cellActions: undefined,
    },
  ] as EuiDataGridColumn[];

  it('should render data grid', () => {
    const comp = shallow(<TableVisComponent {...props} />);
    expect(comp.find('EuiDataGrid')).toHaveLength(1);
  });

  it('should render title when provided', () => {
    const compWithTitle = shallow(<TableVisComponent {...props} title="Test Title" />);
    const titleElement = compWithTitle.find('EuiTitle');
    expect(titleElement).toHaveLength(1);
    expect(titleElement.find('h3').text()).toEqual('Test Title');
  });

  it('should not render title when not provided', () => {
    const compWithoutTitle = shallow(<TableVisComponent {...props} title={undefined} />);
    const titleElement = compWithoutTitle.find('EuiTitle');
    expect(titleElement).toHaveLength(0);
  });

  it('should set sort if sort column', () => {
    mockGetDataGridColumns.mockReturnValueOnce(dataGridColumnsValue);
    const comp = shallow(<TableVisComponent {...props} />);
    const { onSort } = comp.find('EuiDataGrid').prop('sorting') as any;
    onSort([]);
    expect(props.uiState.setSort).toHaveBeenCalledWith([]);
    onSort([{ id: 'col-0-2', direction: 'asc' }]);
    expect(props.uiState.setSort).toHaveBeenCalledWith({ colIndex: 0, direction: 'asc' });
    onSort([
      { id: 'col-0-2', direction: 'asc' },
      { id: 'col-1-1', direction: 'desc' },
    ]);
    expect(props.uiState.setSort).toHaveBeenCalledWith({ colIndex: 1, direction: 'desc' });
  });

  it('should set width if adjust column width', () => {
    const uiStateProps = {
      ...props.uiState,
      width: [
        { colIndex: 0, width: 12 },
        { colIndex: 1, width: 8 },
      ],
    };
    const comp = shallow(<TableVisComponent {...props} />);
    const onColumnResize = comp.find('EuiDataGrid').prop('onColumnResize') as any;
    onColumnResize({ columnId: 'col-0-2', width: 18 });
    expect(props.uiState.setWidth).toHaveBeenCalledWith({ colIndex: 0, width: 18 });
    const updatedComp = shallow(<TableVisComponent {...props} uiState={uiStateProps} />);
    const onColumnResizeUpdate = updatedComp.find('EuiDataGrid').prop('onColumnResize') as any;
    onColumnResizeUpdate({ columnId: 'col-0-2', width: 18 });
    expect(props.uiState.setWidth).toHaveBeenCalledWith({ colIndex: 0, width: 18 });
  });

  it('should create sortedRows and pass to getTableVisCellValue', () => {
    const uiStateProps = {
      ...props.uiState,
      sort: { colIndex: 1, direction: 'asc' } as ColumnSort,
    };
    const sortedRows = [
      { 'col-0-2': 'Anthony', 'col-1-1': 1 },
      { 'col-0-2': 'Timmy', 'col-1-1': 1 },
      { 'col-0-2': 'Alice', 'col-1-1': 3 },
    ];
    mockGetDataGridColumns.mockReturnValueOnce(dataGridColumnsValue);
    shallow(<TableVisComponent {...props} uiState={uiStateProps} />);
    expect(getTableVisCellValue).toHaveBeenCalledWith(sortedRows, table.formattedColumns);
    expect(getDataGridColumns).toHaveBeenCalledWith(table, props.event, props.uiState.colWidth);
  });

  it('should return formattedTotal from footerCellValue', () => {
    let comp = shallow(<TableVisComponent {...props} />);
    let renderFooterCellValue = comp.find('EuiDataGrid').prop('renderFooterCellValue') as any;
    expect(renderFooterCellValue).toEqual(undefined);
    comp = shallow(<TableVisComponent {...props} visConfig={{ ...visConfig, showTotal: true }} />);
    renderFooterCellValue = comp.find('EuiDataGrid').prop('renderFooterCellValue');
    expect(renderFooterCellValue({ columnId: 'col-1-1' })).toEqual(5);
    expect(renderFooterCellValue({ columnId: 'col-0-2' })).toEqual(null);
  });

  it('should apply pagination correctly', () => {
    const comp = shallow(<TableVisComponent {...props} />);
    const paginationProps = comp.find('EuiDataGrid').prop('pagination');
    expect(paginationProps).toMatchObject({
      pageIndex: 0,
      pageSize: 3,
      onChangeItemsPerPage: expect.any(Function),
      onChangePage: expect.any(Function),
    });
  });

  it('should not call renderFooterCellValue when showTotal is false', () => {
    const comp = shallow(<TableVisComponent {...props} />);
    const renderFooterCellValue = comp.find('EuiDataGrid').prop('renderFooterCellValue');
    expect(renderFooterCellValue).toBeUndefined();
  });
});
