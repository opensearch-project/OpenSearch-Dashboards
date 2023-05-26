/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IUiSettingsClient } from 'opensearch-dashboards/public';
import { FormattedColumn } from '../types';
import { toCsv } from './convert_to_csv_data';
import { IFieldFormat } from 'src/plugins/data/common';

const mockConvert = jest.fn((x) => x);
const defaultFormatter = { convert: (x) => mockConvert(x) } as IFieldFormat;

function implementConvert(nRow: number) {
  for (let i = 0; i < nRow; i++) {
    mockConvert.mockImplementationOnce((x) => x);
    mockConvert.mockImplementationOnce((x) => x);
    mockConvert.mockImplementationOnce((x) => {
      return parseFloat(x) * 100 + '%';
    });
  }
}

const columns = [
  {
    id: 'col-0-2',
    title: 'name.keyword: Descending',
    formatter: defaultFormatter,
    filterable: true,
  },
  {
    id: 'col-1-1',
    title: 'Count',
    formatter: defaultFormatter,
    filterable: false,
    sumTotal: 5,
    formattedTotal: 5,
    total: 5,
  },
  {
    id: 'col-1-1-percents',
    title: 'Count percentages',
    formatter: defaultFormatter,
    filterable: false,
  },
] as FormattedColumn[];

const rows = [
  { 'col-1-1-percents': 0.6, 'col-0-2': 'Alice', 'col-1-1': 3 },
  { 'col-1-1-percents': 0.2, 'col-0-2': 'Anthony', 'col-1-1': 1 },
  { 'col-1-1-percents': 0.2, 'col-0-2': 'Timmy', 'col-1-1': 1 },
];

const uiSettings = {
  get: (key: string) => {
    if (key === 'csv:separator') return ',';
    else if (key === 'csv:quoteValues') return true;
  },
} as IUiSettingsClient;

describe('toCsv', () => {
  it('should create csv rows if not formatted', () => {
    const result = toCsv(false, { rows, columns, uiSettings });
    expect(result).toEqual(
      '"name.keyword: Descending",Count,"Count percentages"\r\nAlice,3,"0.6"\r\nAnthony,1,"0.2"\r\nTimmy,1,"0.2"\r\n'
    );
  });

  it('should create csv rows if formatted', () => {
    implementConvert(3);
    const result = toCsv(true, { rows, columns, uiSettings });
    expect(result).toEqual(
      '"name.keyword: Descending",Count,"Count percentages"\r\nAlice,3,"60%"\r\nAnthony,1,"20%"\r\nTimmy,1,"20%"\r\n'
    );
  });
});
