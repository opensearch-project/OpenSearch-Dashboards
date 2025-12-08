/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow, mount } from 'enzyme';
import { TableVisConfig, ColumnSort, AggTypes } from '../types';
import { TableVisComponent } from './table_vis_component';
import { FormattedColumn } from '../types';
import { FormattedTableContext } from '../table_vis_response_handler';
import { TableVisDynamicTable } from './table_vis_dynamic_table';
import { TableUiState } from '../utils/get_table_ui_state';

const mockFormatter = {
  convert: jest.fn((val) => val),
  getConverterFor: jest.fn(),
  getParamDefaults: jest.fn(),
  param: jest.fn(),
  params: jest.fn(),
  type: { id: 'string' },
  toJSON: jest.fn(),
} as any;

const table = {
  formattedColumns: [
    {
      id: 'col-0-2',
      title: 'name.keyword: Descending',
      formatter: mockFormatter,
      filterable: true,
    },
    {
      id: 'col-1-1',
      title: 'Count',
      formatter: mockFormatter,
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
  totalFunc: AggTypes.SUM,
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render TableVisDynamicTable', () => {
    const comp = shallow(<TableVisComponent {...props} />);
    expect(comp.find(TableVisDynamicTable)).toHaveLength(1);
  });

  it('should pass all props to TableVisDynamicTable', () => {
    const comp = shallow(<TableVisComponent {...props} />);
    const dynamicTable = comp.find(TableVisDynamicTable);

    expect(dynamicTable.prop('title')).toEqual(props.title);
    expect(dynamicTable.prop('table')).toEqual(props.table);
    expect(dynamicTable.prop('visConfig')).toEqual(props.visConfig);
    expect(dynamicTable.prop('event')).toEqual(props.event);
    expect(dynamicTable.prop('uiState')).toEqual(props.uiState);
  });

  it('should pass title when provided', () => {
    const compWithTitle = shallow(<TableVisComponent {...props} title="Test Title" />);
    const dynamicTable = compWithTitle.find(TableVisDynamicTable);
    expect(dynamicTable.prop('title')).toEqual('Test Title');
  });

  it('should pass undefined title when not provided', () => {
    const compWithoutTitle = shallow(<TableVisComponent {...props} title={undefined} />);
    const dynamicTable = compWithoutTitle.find(TableVisDynamicTable);
    expect(dynamicTable.prop('title')).toBeUndefined();
  });

  it('should pass visConfig with showTotal', () => {
    const visConfigWithTotal = { ...visConfig, showTotal: true };
    const comp = shallow(<TableVisComponent {...props} visConfig={visConfigWithTotal} />);
    const dynamicTable = comp.find(TableVisDynamicTable);
    expect(dynamicTable.prop('visConfig').showTotal).toBe(true);
  });

  it('should pass uiState with sort configuration', () => {
    const uiStateWithSort = {
      ...uiState,
      sort: { colIndex: 1, direction: 'asc' } as ColumnSort,
    };
    const comp = shallow(<TableVisComponent {...props} uiState={uiStateWithSort} />);
    const dynamicTable = comp.find(TableVisDynamicTable);
    expect(dynamicTable.prop('uiState').sort).toEqual({ colIndex: 1, direction: 'asc' });
  });

  it('should pass uiState with column width configuration', () => {
    const uiStateWithWidth = {
      ...uiState,
      colWidth: [
        { colIndex: 0, width: 12 },
        { colIndex: 1, width: 8 },
      ],
    };
    const comp = shallow(<TableVisComponent {...props} uiState={uiStateWithWidth} />);
    const dynamicTable = comp.find(TableVisDynamicTable);
    expect(dynamicTable.prop('uiState').colWidth).toEqual([
      { colIndex: 0, width: 12 },
      { colIndex: 1, width: 8 },
    ]);
  });
});
