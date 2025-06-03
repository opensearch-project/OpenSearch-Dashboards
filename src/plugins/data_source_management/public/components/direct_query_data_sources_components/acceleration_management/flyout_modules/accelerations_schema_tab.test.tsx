/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import { AccelerationSchemaTab } from './accelerations_schema_tab';
import { EuiInMemoryTable } from '@elastic/eui';

describe('AccelerationSchemaTab', () => {
  const mappings = {
    data: {
      testIndex: {
        mappings: {
          _meta: {
            indexedColumns: [
              { columnName: 'column1', columnType: 'text', kind: 'default' },
              { columnName: 'column2', columnType: 'keyword', kind: 'default' },
            ],
            kind: 'default',
          },
        },
      },
    },
  };

  const indexInfo = {
    data: [{ index: 'testIndex' }],
  };

  const shallowComponent = (props = { mappings, indexInfo }) =>
    shallow(<AccelerationSchemaTab {...props} />);

  test('renders correctly', () => {
    const wrapper = shallowComponent();
    expect(wrapper).toMatchSnapshot();
  });

  test('renders EuiInMemoryTable component', () => {
    const wrapper = shallowComponent();
    expect(wrapper.find(EuiInMemoryTable).exists()).toBe(true);
  });

  test('renders correct columns for default index type', () => {
    const wrapper = shallowComponent();
    const columns = wrapper.find(EuiInMemoryTable).prop('columns');
    expect(columns).toEqual([
      { field: 'columns_name', name: 'Column name' },
      { field: 'data_type', name: 'Data type' },
    ]);
  });

  test('renders correct columns for skipping index type', () => {
    const skippingMappings = {
      data: {
        testIndex: {
          mappings: {
            _meta: {
              indexedColumns: [
                { columnName: 'column1', columnType: 'text', kind: 'skipping' },
                { columnName: 'column2', columnType: 'keyword', kind: 'skipping' },
              ],
              kind: 'skipping',
            },
          },
        },
      },
    };
    const wrapper = shallowComponent({ mappings: skippingMappings, indexInfo });
    const columns = wrapper.find(EuiInMemoryTable).prop('columns');
    expect(columns).toEqual([
      { field: 'columns_name', name: 'Column name' },
      { field: 'data_type', name: 'Data type' },
      { field: 'acceleration_type', name: 'Acceleration index type' },
    ]);
  });

  test('renders correct items', () => {
    const wrapper = shallowComponent();
    const items = wrapper.find(EuiInMemoryTable).prop('items');
    expect(items).toEqual([
      { columns_name: 'column1', data_type: 'text', acceleration_type: 'default' },
      { columns_name: 'column2', data_type: 'keyword', acceleration_type: 'default' },
    ]);
  });

  test('renders empty items when no index data is available', () => {
    const emptyMappings = {
      data: {},
    };
    const wrapper = shallowComponent({ mappings: emptyMappings, indexInfo });
    const items = wrapper.find(EuiInMemoryTable).prop('items');
    expect(items).toEqual([]);
  });
});
