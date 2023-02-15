/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { addPercentageCol } from './add_percentage_col';
import { FormattedColumn } from '../types';
import { Table } from '../table_vis_response_handler';

const mockDeserialize = jest.fn(() => ({}));
jest.mock('../services', () => ({
  getFormatService: jest.fn(() => ({
    deserialize: mockDeserialize,
  })),
}));

const formattedColumns = [
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
] as FormattedColumn[];

const rows = [
  { 'col-0-2': 'Alice', 'col-1-1': 3 },
  { 'col-0-2': 'Anthony', 'col-1-1': 1 },
  { 'col-0-2': 'Timmy', 'col-1-1': 1 },
] as Table['rows'];

describe('addPercentageCol', () => {
  it('should add new percentage column', () => {
    const result = addPercentageCol(formattedColumns, 'count', rows, 1);
    expect(result).toEqual({
      cols: [
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
        {
          title: 'count percentages',
          id: 'col-1-1-percents',
          formatter: {},
          filterable: false,
        },
      ],
      rows: [
        { 'col-1-1-percents': 0.6, 'col-0-2': 'Alice', 'col-1-1': 3 },
        { 'col-1-1-percents': 0.2, 'col-0-2': 'Anthony', 'col-1-1': 1 },
        { 'col-1-1-percents': 0.2, 'col-0-2': 'Timmy', 'col-1-1': 1 },
      ],
    });
  });
});
