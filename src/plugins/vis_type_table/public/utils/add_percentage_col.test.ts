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

let formattedColumns: FormattedColumn[];
const rows = [
  { 'col-0-2': 'Alice', 'col-1-1': 3 },
  { 'col-0-2': 'Anthony', 'col-1-1': 1 },
  { 'col-0-2': 'Timmy', 'col-1-1': 1 },
] as Table['rows'];

beforeEach(() => {
  formattedColumns = [
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
    },
  ] as FormattedColumn[];
});

describe('addPercentageCol', () => {
  it('should add new percentage column', () => {
    const result = addPercentageCol(formattedColumns, 'count', rows, 1);
    expect(result).toMatchSnapshot();
  });

  it('should handle sumTotal being 0', () => {
    formattedColumns[1].sumTotal = 0;
    const result = addPercentageCol(formattedColumns, 'count', rows, 1);
    expect(result).toMatchSnapshot();
  });

  it('should handle empty input data', () => {
    const emptyFormattedColumns: FormattedColumn[] = [];
    const emptyRows: Table['rows'] = [];
    const result = addPercentageCol(emptyFormattedColumns, 'count', emptyRows, 1);
    expect(result).toMatchSnapshot();
  });

  it('should handle input data with one row', () => {
    const oneRow = [{ 'col-0-2': 'Alice', 'col-1-1': 3 }] as Table['rows'];
    const result = addPercentageCol(formattedColumns, 'count', oneRow, 1);
    expect(result).toMatchSnapshot();
  });

  it('should handle input data with null values', () => {
    const nullValueRows = [
      { 'col-0-2': 'Alice', 'col-1-1': null },
      { 'col-0-2': 'Anthony', 'col-1-1': null },
      { 'col-0-2': 'Timmy', 'col-1-1': null },
    ] as Table['rows'];
    const result = addPercentageCol(formattedColumns, 'count', nullValueRows, 1);
    expect(result).toMatchSnapshot();
  });
});
