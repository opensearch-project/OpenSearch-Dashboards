/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { TableVisComponentGroup } from './table_vis_component_group';
import { TableVisConfig, ColumnSort } from '../types';
import { Table, TableGroup } from '../table_vis_response_handler';

jest.mock('./table_vis_component', () => ({
  TableVisComponent: () => <div data-test-subj="TableVisComponent">TableVisComponent</div>,
}));

const table1 = {
  table: {
    columns: [],
    rows: [],
    formattedColumns: [],
  } as Table,
  title: '',
} as TableGroup;

const table2 = {
  table: {
    columns: [],
    rows: [],
    formattedColumns: [],
  } as Table,
  title: '',
} as TableGroup;

const tableUiStateMock = {
  sort: { colIndex: undefined, direction: undefined } as ColumnSort,
  setSort: jest.fn(),
  width: [],
  setWidth: jest.fn(),
};

describe('TableVisApp', () => {
  it('should not render table or table group components if no table', () => {
    const { container, queryAllByText } = render(
      <TableVisComponentGroup
        tableGroups={[]}
        visConfig={({} as unknown) as TableVisConfig}
        event={jest.fn()}
        uiState={tableUiStateMock}
      />
    );
    expect(queryAllByText('TableVisComponent')).toHaveLength(0);
    expect(container.outerHTML.includes('visTable__group')).toBe(false);
  });

  it('should render table component 2 times', () => {
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
