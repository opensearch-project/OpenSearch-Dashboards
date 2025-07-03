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
  it('should group fields into resultFields and schemaFields', function () {
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
    ];

    const fieldCounts = {
      category: 1,
      currency: 1,
      customer_birth_date: 1,
    };

    const fieldFilterState = getDefaultFieldFilter();

    const actual = groupFields(fields as any, fieldCounts, fieldFilterState);
    expect(actual).toMatchInlineSnapshot(`
      Object {
        "resultFields": Array [
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
        "schemaFields": Array [],
      }
    `);
  });
});
