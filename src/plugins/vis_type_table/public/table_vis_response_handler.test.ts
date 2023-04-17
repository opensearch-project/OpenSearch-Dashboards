/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { tableVisResponseHandler } from './table_vis_response_handler';

jest.mock('./services', () => {
  const formatService = {
    deserialize: jest.fn(() => ({
      convert: jest.fn((value) => value),
    })),
  };

  return {
    getFormatService: () => formatService,
  };
});

const createTableGroup = (title, rows) => ({
  title,
  table: {
    columns: [
      { id: 'col-0', meta: { type: 'string' }, name: 'Column 1' },
      { id: 'col-1', meta: { type: 'number' }, name: 'Column 2' },
    ],
    formattedColumns: [
      {
        id: 'col-0',
        title: 'Column 1',
        formatter: { convert: expect.any(Function) },
        filterable: true,
      },
      {
        id: 'col-1',
        title: 'Column 2',
        formatter: { convert: expect.any(Function) },
        filterable: false,
      },
    ],
    rows,
  },
});

describe('tableVisResponseHandler', () => {
  const input = {
    type: 'datatable',
    columns: [
      { id: 'col-0', name: 'Column 1', meta: { type: 'string' } },
      { id: 'col-1', name: 'Column 2', meta: { type: 'number' } },
    ],
    rows: [
      { 'col-0': 'Group 1', 'col-1': 100 },
      { 'col-0': 'Group 2', 'col-1': 200 },
    ],
  };

  const baseVisConfig = {
    title: 'My Table',
    buckets: [
      {
        accessor: 0,
        label: 'Column 1',
        format: {
          id: 'string',
          params: {},
        },
        params: {},
        aggType: 'terms',
      },
    ],
    metrics: [
      {
        accessor: 1,
        label: 'Count',
        format: {
          id: 'number',
        },
        params: {},
        aggType: 'count',
      },
    ],
  };

  const splitConfig = {
    accessor: 0,
    label: 'Column 1',
    format: {
      id: 'string',
      params: {},
    },
    params: {},
    aggType: 'terms',
  };

  it('should correctly format data with splitRow', () => {
    const visConfig = { ...baseVisConfig, splitRow: [splitConfig] };

    const expected = {
      table: undefined,
      tableGroups: [
        createTableGroup('Group 1: Column 1', [{ 'col-0': 'Group 1', 'col-1': 100 }]),
        createTableGroup('Group 2: Column 1', [{ 'col-0': 'Group 2', 'col-1': 200 }]),
      ],
      direction: 'row',
    };

    const result = tableVisResponseHandler(input, visConfig);
    expect(result).toEqual(expected);
  });

  it('should correctly format data with splitColumn', () => {
    const visConfig = { ...baseVisConfig, splitColumn: [splitConfig] };

    const expected = {
      table: undefined,
      tableGroups: [
        createTableGroup('Group 1: Column 1', [{ 'col-0': 'Group 1', 'col-1': 100 }]),
        createTableGroup('Group 2: Column 1', [{ 'col-0': 'Group 2', 'col-1': 200 }]),
      ],
      direction: 'column',
    };

    const result = tableVisResponseHandler(input, visConfig);
    expect(result).toEqual(expected);
  });

  it('should correctly format data with no split', () => {
    const visConfig = baseVisConfig;

    const expected = {
      table: {
        columns: input.columns,
        formattedColumns: [
          {
            id: 'col-0',
            title: 'Column 1',
            formatter: { convert: expect.any(Function) },
            filterable: true,
          },
          {
            id: 'col-1',
            title: 'Column 2',
            formatter: { convert: expect.any(Function) },
            filterable: false,
          },
        ],
        rows: input.rows,
      },
      tableGroups: [],
      direction: undefined,
    };

    const result = tableVisResponseHandler(input, visConfig);
    expect(result).toEqual(expected);
  });
});
