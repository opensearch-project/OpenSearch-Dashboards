/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IndexPattern } from '../../../opensearch_dashboards_services';
import {
  getMockedIndexPatternWithCustomizedFields,
  getMockedIndexPatternWithTimeField,
} from '../../../__mock__/index_pattern_mock';
import { buildDataGridColumns, computeVisibleColumns } from './data_grid_table_columns';

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

const customizedIndexPatternMock = getMockedIndexPatternWithCustomizedFields(
  fieldsData
) as IndexPattern;
const customizedIndexPatternMockWithTimeField = getMockedIndexPatternWithTimeField(
  fieldsData,
  'order_date'
) as IndexPattern;

describe('Testing buildDataGridColumns function ', () => {
  it('should return correct columns without time column when displayTimeColumn is false', () => {
    const columns = buildDataGridColumns(['name', 'currency'], customizedIndexPatternMock, false);
    expect(columns).toHaveLength(2);
    expect(columns[0].id).toEqual('name');
    expect(columns[1].id).toEqual('currency');
    expect(columns).toMatchInlineSnapshot(`
      Array [
        Object {
          "actions": Object {
            "showHide": Object {
              "iconType": "cross",
              "label": "Remove column",
            },
            "showMoveLeft": true,
            "showMoveRight": true,
          },
          "cellActions": undefined,
          "display": undefined,
          "id": "name",
          "isSortable": undefined,
          "schema": undefined,
        },
        Object {
          "actions": Object {
            "showHide": Object {
              "iconType": "cross",
              "label": "Remove column",
            },
            "showMoveLeft": true,
            "showMoveRight": true,
          },
          "cellActions": undefined,
          "display": undefined,
          "id": "currency",
          "isSortable": undefined,
          "schema": undefined,
        },
      ]
    `);
  });

  it('should add time and source columns correctly when displayTimeColumn is true', () => {
    const columns = buildDataGridColumns(
      ['name', 'currency', '_source'],
      customizedIndexPatternMockWithTimeField,
      true
    );
    expect(columns).toHaveLength(4);
    expect(columns[0].id).toEqual('order_date');
    expect(columns[0].display).toEqual('Time (order_date)');
    expect(columns[3].id).toEqual('_source');
    expect(columns[3].display).toEqual('Source');
    expect(columns).toMatchInlineSnapshot(`
      Array [
        Object {
          "actions": Object {
            "showHide": false,
            "showMoveLeft": true,
            "showMoveRight": true,
          },
          "cellActions": undefined,
          "display": "Time (order_date)",
          "id": "order_date",
          "initialWidth": 200,
          "isSortable": undefined,
          "schema": undefined,
        },
        Object {
          "actions": Object {
            "showHide": Object {
              "iconType": "cross",
              "label": "Remove column",
            },
            "showMoveLeft": true,
            "showMoveRight": true,
          },
          "cellActions": undefined,
          "display": undefined,
          "id": "name",
          "isSortable": undefined,
          "schema": undefined,
        },
        Object {
          "actions": Object {
            "showHide": Object {
              "iconType": "cross",
              "label": "Remove column",
            },
            "showMoveLeft": true,
            "showMoveRight": true,
          },
          "cellActions": undefined,
          "display": undefined,
          "id": "currency",
          "isSortable": undefined,
          "schema": undefined,
        },
        Object {
          "actions": Object {
            "showHide": false,
            "showMoveLeft": true,
            "showMoveRight": true,
          },
          "cellActions": undefined,
          "display": "Source",
          "id": "_source",
          "isSortable": undefined,
          "schema": undefined,
        },
      ]
    `);
  });

  it('should set display for time column correctly when time field is already included', () => {
    const columns = buildDataGridColumns(
      ['name', 'currency', 'order_date'],
      customizedIndexPatternMockWithTimeField,
      true
    );
    expect(columns).toHaveLength(3);
    expect(columns[2].id).toEqual('order_date');
    expect(columns[2].display).toEqual('Time (order_date)');
    expect(columns).toMatchInlineSnapshot(`
      Array [
        Object {
          "actions": Object {
            "showHide": Object {
              "iconType": "cross",
              "label": "Remove column",
            },
            "showMoveLeft": true,
            "showMoveRight": true,
          },
          "cellActions": undefined,
          "display": undefined,
          "id": "name",
          "isSortable": undefined,
          "schema": undefined,
        },
        Object {
          "actions": Object {
            "showHide": Object {
              "iconType": "cross",
              "label": "Remove column",
            },
            "showMoveLeft": true,
            "showMoveRight": true,
          },
          "cellActions": undefined,
          "display": undefined,
          "id": "currency",
          "isSortable": undefined,
          "schema": undefined,
        },
        Object {
          "actions": Object {
            "showHide": false,
            "showMoveLeft": true,
            "showMoveRight": true,
          },
          "cellActions": undefined,
          "display": "Time (order_date)",
          "id": "order_date",
          "initialWidth": 200,
          "isSortable": undefined,
          "schema": undefined,
        },
      ]
    `);
  });
});

describe('Testing computeVisibleColumns function ', () => {
  it('should include time column when displayTimeColumn is true and time field is missing', () => {
    const visibleColumns = computeVisibleColumns(
      ['name', 'currency'],
      customizedIndexPatternMock,
      true
    );
    expect(visibleColumns).toMatchInlineSnapshot(`
      Array [
        "order_date",
        "name",
        "currency",
      ]
    `);
  });

  it('should not add duplicate time column when displayTimeColumn is true and time field is included', () => {
    const visibleColumns = computeVisibleColumns(
      ['name', 'currency', 'order_date'],
      customizedIndexPatternMock,
      true
    );
    expect(visibleColumns).toMatchInlineSnapshot(`
      Array [
        "name",
        "currency",
        "order_date",
      ]
    `);
  });

  it('should not add time column when displayTimeColumn is false', () => {
    const visibleColumns = computeVisibleColumns(
      ['name', 'currency'],
      customizedIndexPatternMock,
      false
    );
    expect(visibleColumns).toMatchInlineSnapshot(`
      Array [
        "name",
        "currency",
      ]
    `);
  });
});
