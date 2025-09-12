/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { groupFields } from './group_fields';
import { getDefaultFieldFilter } from './field_filter';

describe('group_fields', function () {
  it('should group fields into facetedFields, selectedFields, queryFields, and discoveredFields', function () {
    const fields = [
      {
        name: 'category',
        type: 'string',
        esTypes: ['text'],
        count: 1,
        scripted: false,
        searchable: true,
        aggregatable: true,
        readFromDocValues: true,
        displayName: 'Category',
      },
      {
        name: 'currency',
        type: 'string',
        esTypes: ['keyword'],
        count: 0,
        scripted: false,
        searchable: true,
        aggregatable: true,
        readFromDocValues: true,
        displayName: 'Currency',
      },
      {
        name: 'customer_birth_date',
        type: 'date',
        esTypes: ['date'],
        count: 0,
        scripted: false,
        searchable: true,
        aggregatable: true,
        readFromDocValues: true,
        displayName: 'Customer Birth Date',
      },
      {
        name: 'serviceName',
        type: 'string',
        esTypes: ['keyword'],
        count: 1,
        scripted: false,
        searchable: true,
        aggregatable: true,
        readFromDocValues: true,
        displayName: 'Service Name',
      },
    ];

    const columns = ['category'];
    const fieldCounts = {
      category: 1,
      currency: 1,
      serviceName: 1,
    };

    const fieldFilterState = getDefaultFieldFilter();
    // Set missing to false to include fields not in fieldCounts
    fieldFilterState.missing = false;

    const actual = groupFields(fields as any, columns, fieldCounts, fieldFilterState, true);
    expect(actual).toMatchInlineSnapshot(`
      Object {
        "discoveredFields": Array [
          Object {
            "aggregatable": true,
            "count": 0,
            "displayName": "Customer Birth Date",
            "esTypes": Array [
              "date",
            ],
            "name": "customer_birth_date",
            "readFromDocValues": true,
            "scripted": false,
            "searchable": true,
            "type": "date",
          },
        ],
        "facetedFields": Array [
          Object {
            "aggregatable": true,
            "count": 1,
            "displayName": "Service Name",
            "esTypes": Array [
              "keyword",
            ],
            "name": "serviceName",
            "readFromDocValues": true,
            "scripted": false,
            "searchable": true,
            "type": "string",
          },
        ],
        "queryFields": Array [
          Object {
            "aggregatable": true,
            "count": 0,
            "displayName": "Currency",
            "esTypes": Array [
              "keyword",
            ],
            "name": "currency",
            "readFromDocValues": true,
            "scripted": false,
            "searchable": true,
            "type": "string",
          },
          Object {
            "aggregatable": true,
            "count": 1,
            "displayName": "Service Name",
            "esTypes": Array [
              "keyword",
            ],
            "name": "serviceName",
            "readFromDocValues": true,
            "scripted": false,
            "searchable": true,
            "type": "string",
          },
        ],
        "selectedFields": Array [
          Object {
            "aggregatable": true,
            "count": 1,
            "displayName": "Category",
            "esTypes": Array [
              "text",
            ],
            "name": "category",
            "readFromDocValues": true,
            "scripted": false,
            "searchable": true,
            "type": "string",
          },
        ],
      }
    `);
  });

  it('should identify faceted fields correctly including invisible char removal', function () {
    const fields = [
      {
        name: 'serviceName\u200b', // Contains invisible char
        type: 'string',
        esTypes: ['keyword'],
        count: 1,
        scripted: false,
        searchable: true,
        aggregatable: true,
        readFromDocValues: true,
        displayName: 'Service Name',
      },
      {
        name: 'attributes.http.status_code',
        type: 'number',
        esTypes: ['long'],
        count: 1,
        scripted: false,
        searchable: true,
        aggregatable: true,
        readFromDocValues: true,
        displayName: 'HTTP Status Code',
      },
      {
        name: 'status.code',
        type: 'number',
        esTypes: ['long'],
        count: 1,
        scripted: false,
        searchable: true,
        aggregatable: true,
        readFromDocValues: true,
        displayName: 'Status Code',
      },
      {
        name: 'regularField',
        type: 'string',
        esTypes: ['text'],
        count: 1,
        scripted: false,
        searchable: true,
        aggregatable: true,
        readFromDocValues: true,
        displayName: 'Regular Field',
      },
    ];

    const columns: string[] = [];
    const fieldCounts = {
      'serviceName\u200b': 1,
      'attributes.http.status_code': 1,
      'status.code': 1,
      regularField: 1,
    };

    const fieldFilterState = getDefaultFieldFilter();
    fieldFilterState.missing = false;

    const actual = groupFields(fields as any, columns, fieldCounts, fieldFilterState, true);

    expect(actual.facetedFields).toHaveLength(3);
    expect(actual.facetedFields.map((f) => f.name)).toContain('serviceName\u200b');
    expect(actual.facetedFields.map((f) => f.name)).toContain('attributes.http.status_code');
    expect(actual.facetedFields.map((f) => f.name)).toContain('status.code');
    expect(actual.queryFields.map((f) => f.name)).toContain('regularField');
  });

  it('should handle empty or null fields', function () {
    const fieldFilterState = getDefaultFieldFilter();

    expect(groupFields(null, [], {}, fieldFilterState)).toEqual({
      facetedFields: [],
      selectedFields: [],
      queryFields: [],
      discoveredFields: [],
    });

    expect(groupFields([], [], {}, fieldFilterState)).toEqual({
      facetedFields: [],
      selectedFields: [],
      queryFields: [],
      discoveredFields: [],
    });
  });
});
