/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';

import { IndexPattern } from '../../../opensearch_dashboards_services';
import {
  indexPatternMock,
  getMockedIndexPatternWithCustomizedFields,
} from '../../../__mock__/index_pattern_mock';
import { fetchTableDataCell } from './data_grid_table_cell_value';

const fieldsData = [
  {
    name: 'name',
    scripted: false,
    filterable: true,
    aggregatable: false,
    searchable: true,
    sortable: false,
  },
  {
    name: 'currency',
    type: 'string',
    scripted: false,
    filterable: true,
    aggregatable: true,
    searchable: true,
    sortable: true,
  },
  {
    name: 'order_date',
    type: 'date',
    scripted: false,
    filterable: true,
    aggregatable: true,
    searchable: true,
    sortable: true,
  },
];

const dataRowsMock = [
  {
    _id: '1',
    _index: 'test_index',
    _score: 0,
    _source: {
      name: 'Eddie',
      currency: 'EUR',
      order_date: '2023-08-07T09:28:48+00:00',
    },
    fields: {
      order_date: ['2023-08-07T09:28:48.000Z'],
    },
    _version: 1,
    _type: '_doc',
  },
];

const customizedIndexPatternMock = getMockedIndexPatternWithCustomizedFields(
  fieldsData
) as IndexPattern;

describe('Testing fetchTableDataCell function', () => {
  it('should display empty span if no data', () => {
    const DataGridTableCellValue = fetchTableDataCell(indexPatternMock, dataRowsMock);
    const comp = shallow(
      <DataGridTableCellValue
        rowIndex={100}
        columnId="order_date"
        isDetails={false}
        setCellProps={jest.fn()}
        isExpandable={false}
        isExpanded={false}
      />
    );

    expect(comp).toMatchInlineSnapshot(`
            <span>
              -
            </span>
          `);
  });

  it('should display empty span if field is not defined in index pattern', () => {
    const DataGridTableCellValue = fetchTableDataCell(indexPatternMock, dataRowsMock);
    const comp = shallow(
      <DataGridTableCellValue
        rowIndex={0}
        columnId="first_name"
        isDetails={false}
        setCellProps={jest.fn()}
        isExpandable={false}
        isExpanded={false}
      />
    );

    expect(comp).toMatchInlineSnapshot(`
        <span>
          -
        </span>
      `);
  });

  it('should display JSON string representation of the data if columnId is _source and isDetails is false', () => {
    const DataGridTableCellValue = fetchTableDataCell(customizedIndexPatternMock, dataRowsMock);
    const comp = shallow(
      <DataGridTableCellValue
        rowIndex={0}
        columnId="_source"
        isDetails={true}
        setCellProps={jest.fn()}
        isExpandable={false}
        isExpanded={false}
      />
    );

    expect(comp).toMatchInlineSnapshot(`
      <span>
        {
        "name": "Eddie",
        "currency": "EUR",
        "order_date": "2023-08-07T09:28:48+00:00"
      }
      </span>
    `);
  });

  it('should display EuiDescriptionList if columnId is _source and isDetails is false', () => {
    const DataGridTableCellValue = fetchTableDataCell(customizedIndexPatternMock, dataRowsMock);
    const comp = shallow(
      <DataGridTableCellValue
        rowIndex={0}
        columnId="_source"
        isDetails={false}
        setCellProps={jest.fn()}
        isExpandable={false}
        isExpanded={false}
      />
    );

    expect(comp).toMatchInlineSnapshot(`
      <EuiDescriptionList
        compressed={true}
        type="inline"
      >
        <EuiDescriptionListTitle
          className="osdDescriptionListFieldTitle"
        >
          order_date
        </EuiDescriptionListTitle>
        <EuiDescriptionListDescription
          dangerouslySetInnerHTML={
            Object {
              "__html": "2023-08-07T09:28:48.000Z",
            }
          }
        />
      </EuiDescriptionList>
    `);
  });

  it('should correctly display data if columnId is in index pattern and is not _source', () => {
    const DataGridTableCellValue = fetchTableDataCell(customizedIndexPatternMock, dataRowsMock);
    const comp = shallow(
      <DataGridTableCellValue
        rowIndex={0}
        columnId="currency"
        isDetails={false}
        setCellProps={jest.fn()}
        isExpandable={false}
        isExpanded={false}
      />
    );

    expect(comp).toMatchInlineSnapshot(`
      <span
        dangerouslySetInnerHTML={
          Object {
            "__html": "EUR",
          }
        }
      />
    `);
  });
});
