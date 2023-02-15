/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { TableVisComponentGroup } from './table_vis_component_group';
import { TableVisConfig, ColumnSort } from '../types';
import { Table, TableGroup, FormattedTable } from '../table_vis_response_handler';

jest.mock('./table_vis_component', () => ({
  TableVisComponent: () => <div data-test-subj="TableVisComponent">TableVisComponent</div>,
}));

const table1 = {
  tables: [
    {
      columns: [],
      rows: [],
    } as Table,
  ],
  title: '',
  name: 'table-1',
  key: '1',
  row: 10,
  column: 3,
} as TableGroup;

const table2 = {
  tables: [
    {
      columns: [],
      rows: [],
    } as Table,
  ],
  title: '',
  name: 'table-2',
  key: '2',
  row: 10,
  column: 3,
} as TableGroup;

const tableUiStateMock = {
  sort: { colIndex: undefined, direction: undefined } as ColumnSort,
  setSort: jest.fn(),
  width: [],
  setWidth: jest.fn(),
};

describe('TableVisApp', () => {
  it('should not render table component if no table', () => {
    const { container, queryAllByText } = render(
      <TableVisComponentGroup
        tableGroups={[table1, table2]}
        visConfig={({} as unknown) as TableVisConfig}
        event={jest.fn()}
        uiState={tableUiStateMock}
      />
    );
    expect(queryAllByText('TableVisComponent')).toHaveLength(0);
    expect(container.outerHTML.includes('visTable__group')).toBe(true);
  });

  it('should render table component 2 times', () => {
    table1.table = {} as FormattedTable;
    table2.table = {} as FormattedTable;
    const { container, queryAllByText } = render(
      <TableVisComponentGroup
        tableGroups={[table1, table2]}
        visConfig={({} as unknown) as TableVisConfig}
        event={jest.fn()}
        uiState={tableUiStateMock}
      />
    );
    expect(queryAllByText('TableVisComponent')).toHaveLength(2);
    expect(container.outerHTML.includes('visTable__group')).toBe(true);
  });
});
