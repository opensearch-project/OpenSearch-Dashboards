/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { convertToFormattedData } from './convert_to_formatted_data';
import { TableVisConfig } from '../types';
import { Table } from '../table_vis_response_handler';
import { AggTypes } from '../types';

const mockDeserialize = jest.fn(() => ({}));
jest.mock('../services', () => ({
  getFormatService: jest.fn(() => ({
    deserialize: mockDeserialize,
  })),
}));

const table = {
  type: 'opensearch_dashboards_datatable',
  columns: [
    { id: 'col-0-2', name: 'name.keyword: Descending', meta: { type: 'terms' } },
    { id: 'col-1-1', name: 'Count', meta: { type: 'count' } },
  ],
  rows: [
    { 'col-0-2': 'Alice', 'col-1-1': 3 },
    { 'col-0-2': 'Anthony', 'col-1-1': 1 },
    { 'col-0-2': 'Timmy', 'col-1-1': 1 },
  ],
} as Table;

const visConfig = {
  buckets: [
    {
      accessor: 0,
      aggType: 'terms',
      format: {
        id: 'terms',
        params: {
          id: 'string',
          missingBucketLabel: 'Missing',
          otherBucketLabel: 'Other',
          parsedUrl: {
            basePath: '/arf',
            origin: '',
            pathname: '/arf/app/home',
          },
        },
      },
      label: 'name.keyword: Descending',
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

function implementDeserialize() {
  mockDeserialize.mockImplementationOnce(() => ({}));
  mockDeserialize.mockImplementationOnce(() => ({
    allowsNumericalAggregations: true,
    convert: jest.fn((x: number) => x),
  }));
}

describe('convertToFormattedData', () => {
  it('should create formatted data', () => {
    const result = convertToFormattedData(table, visConfig);
    expect(result.formattedRows).toEqual(table.rows);
    expect(result.formattedColumns).toEqual([
      {
        id: 'col-0-2',
        title: 'name.keyword: Descending',
        formatter: {},
        filterable: true,
      },
      { id: 'col-1-1', title: 'Count', formatter: {}, filterable: false },
    ]);
  });

  it('should add total', () => {
    implementDeserialize();
    visConfig.showTotal = true;
    const result = convertToFormattedData(table, visConfig);
    expect(result.formattedColumns).toEqual([
      {
        id: 'col-0-2',
        title: 'name.keyword: Descending',
        formatter: {},
        filterable: true,
      },
      {
        id: 'col-1-1',
        title: 'Count',
        formatter: { allowsNumericalAggregations: true, convert: expect.any(Function) },
        filterable: false,
        sumTotal: 5,
        formattedTotal: 5,
        total: 5,
      },
    ]);
  });

  it('should add average', () => {
    implementDeserialize();
    visConfig.showTotal = true;
    visConfig.totalFunc = AggTypes.AVG;
    const result = convertToFormattedData(table, visConfig);
    expect(result.formattedColumns).toEqual([
      {
        id: 'col-0-2',
        title: 'name.keyword: Descending',
        formatter: {},
        filterable: true,
      },
      {
        id: 'col-1-1',
        title: 'Count',
        formatter: { allowsNumericalAggregations: true, convert: expect.any(Function) },
        filterable: false,
        sumTotal: 5,
        formattedTotal: 1.6666666666666667,
        total: 1.6666666666666667,
      },
    ]);
  });

  it('should add min', () => {
    implementDeserialize();
    visConfig.showTotal = true;
    visConfig.totalFunc = AggTypes.MIN;
    const result = convertToFormattedData(table, visConfig);
    expect(result.formattedColumns).toEqual([
      {
        id: 'col-0-2',
        title: 'name.keyword: Descending',
        formatter: {},
        filterable: true,
      },
      {
        id: 'col-1-1',
        title: 'Count',
        formatter: { allowsNumericalAggregations: true, convert: expect.any(Function) },
        filterable: false,
        sumTotal: 5,
        formattedTotal: 1,
        total: 1,
      },
    ]);
  });

  it('should add max', () => {
    implementDeserialize();
    visConfig.showTotal = true;
    visConfig.totalFunc = AggTypes.MAX;
    const result = convertToFormattedData(table, visConfig);
    expect(result.formattedColumns).toEqual([
      {
        id: 'col-0-2',
        title: 'name.keyword: Descending',
        formatter: {},
        filterable: true,
      },
      {
        id: 'col-1-1',
        title: 'Count',
        formatter: { allowsNumericalAggregations: true, convert: expect.any(Function) },
        filterable: false,
        sumTotal: 5,
        formattedTotal: 3,
        total: 3,
      },
    ]);
  });

  it('should add row count', () => {
    implementDeserialize();
    visConfig.showTotal = true;
    visConfig.totalFunc = AggTypes.COUNT;
    const result = convertToFormattedData(table, visConfig);
    expect(result.formattedColumns).toEqual([
      {
        id: 'col-0-2',
        title: 'name.keyword: Descending',
        formatter: {},
        filterable: true,
        sumTotal: '0AliceAnthonyTimmy',
        formattedTotal: 3,
        total: 3,
      },
      {
        id: 'col-1-1',
        title: 'Count',
        formatter: { allowsNumericalAggregations: true, convert: expect.any(Function) },
        filterable: false,
        sumTotal: 5,
        formattedTotal: 3,
        total: 3,
      },
    ]);
  });
});
