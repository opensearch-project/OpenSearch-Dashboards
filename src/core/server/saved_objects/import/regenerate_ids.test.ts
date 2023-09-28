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

import { mockUuidv4 } from './__mocks__';
import { regenerateIds, regenerateIdsWithReference } from './regenerate_ids';
import { SavedObject } from '../types';
import { savedObjectsClientMock } from '../service/saved_objects_client.mock';
import { SavedObjectsBulkResponse } from '../service';

describe('#regenerateIds', () => {
  const objects = ([
    { type: 'foo', id: '1' },
    { type: 'bar', id: '2' },
    { type: 'baz', id: '3' },
  ] as any) as SavedObject[];

  test('returns expected values', () => {
    mockUuidv4
      .mockReturnValueOnce('uuidv4 #1')
      .mockReturnValueOnce('uuidv4 #2')
      .mockReturnValueOnce('uuidv4 #3');
    expect(regenerateIds(objects)).toMatchInlineSnapshot(`
      Map {
        "foo:1" => Object {
          "id": "uuidv4 #1",
          "omitOriginId": true,
        },
        "bar:2" => Object {
          "id": "uuidv4 #2",
          "omitOriginId": true,
        },
        "baz:3" => Object {
          "id": "uuidv4 #3",
          "omitOriginId": true,
        },
      }
    `);
  });
});

describe('#regenerateIdsWithReference', () => {
  const objects = ([
    { type: 'foo', id: '1' },
    { type: 'bar', id: '2' },
    { type: 'baz', id: '3' },
  ] as any) as SavedObject[];

  test('returns expected values', async () => {
    const mockedSavedObjectsClient = savedObjectsClientMock.create();
    mockUuidv4.mockReturnValueOnce('uuidv4 #1');
    const result: SavedObjectsBulkResponse<unknown> = {
      saved_objects: [
        {
          error: {
            statusCode: 404,
            error: '',
            message: '',
          },
          id: '1',
          type: 'foo',
          attributes: {},
          references: [],
        },
        {
          id: '2',
          type: 'bar',
          attributes: {},
          references: [],
          workspaces: ['bar'],
        },
        {
          id: '3',
          type: 'baz',
          attributes: {},
          references: [],
          workspaces: ['foo'],
        },
      ],
    };
    mockedSavedObjectsClient.bulkGet.mockResolvedValue(result);
    expect(
      await regenerateIdsWithReference({
        savedObjects: objects,
        savedObjectsClient: mockedSavedObjectsClient,
        workspaces: ['bar'],
        objectLimit: 1000,
        importIdMap: new Map(),
      })
    ).toMatchInlineSnapshot(`
      Map {
        "foo:1" => Object {
          "id": "1",
          "omitOriginId": true,
        },
        "bar:2" => Object {
          "id": "2",
          "omitOriginId": false,
        },
        "baz:3" => Object {
          "id": "uuidv4 #1",
          "omitOriginId": true,
        },
      }
    `);
  });
});
