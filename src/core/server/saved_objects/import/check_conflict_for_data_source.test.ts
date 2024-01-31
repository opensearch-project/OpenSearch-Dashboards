/*
<<<<<<< HEAD
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
=======
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
>>>>>>> update import api only
 */

import { mockUuidv4 } from './__mocks__';
import { SavedObjectReference, SavedObjectsImportRetry } from 'opensearch-dashboards/public';
import { SavedObject } from '../types';
import { SavedObjectsErrorHelpers } from '..';
import {
  checkConflictsForDataSource,
  ConflictsForDataSourceParams,
} from './check_conflict_for_data_source';

type SavedObjectType = SavedObject<{ title?: string }>;

/**
<<<<<<< HEAD
 * Function to create SavedObjectType given a type and ID
=======
 * Function to create a realistic-looking import object given a type and ID
>>>>>>> update import api only
 */
const createObject = (type: string, id: string): SavedObjectType => ({
  type,
  id,
  attributes: { title: 'some-title' },
  references: (Symbol() as unknown) as SavedObjectReference[],
});

const getResultMock = {
  conflict: (type: string, id: string) => {
    const error = SavedObjectsErrorHelpers.createConflictError(type, id).output.payload;
    return { type, id, error };
  },
  unresolvableConflict: (type: string, id: string) => {
    const conflictMock = getResultMock.conflict(type, id);
    const metadata = { isNotOverwritable: true };
    return { ...conflictMock, error: { ...conflictMock.error, metadata } };
  },
  invalidType: (type: string, id: string) => {
    const error = SavedObjectsErrorHelpers.createUnsupportedTypeError(type).output.payload;
    return { type, id, error };
  },
};

/**
 * Create a variety of different objects to exercise different import / result scenarios
 */
const obj1 = createObject('type-1', 'id-1'); // -> success
const obj2 = createObject('type-2', 'id-2'); // -> conflict
const obj3 = createObject('type-3', 'id-3'); // -> unresolvable conflict
const obj4 = createObject('type-4', 'id-4'); // -> invalid type
<<<<<<< HEAD
const dataSourceObj = createObject('data-source', 'data-source-id-1'); // -> data-source type, no need to add in the filteredObjects
const objects = [obj1, obj2, obj3, obj4];
const dataSourceObj1 = createObject('type-1', 'ds_id-1'); // -> object with data source id
const dataSourceObj2 = createObject('type-2', 'ds_id-2'); // -> object with data source id
const objectsWithDataSource = [dataSourceObj, dataSourceObj1, dataSourceObj2];
const dataSourceObj1Error = getResultMock.conflict(dataSourceObj1.type, dataSourceObj1.id);
=======
const dsObj = createObject('data-source', 'data-source-id-1'); // -> data-source type, no need to add in the filteredObjects
const objects = [obj1, obj2, obj3, obj4];
const dsObj1 = createObject('type-1', 'ds_id-1'); // -> object with data source id
const dsObj2 = createObject('type-2', 'ds_id-2'); // -> object with data source id
const objectsWithDataSource = [dsObj, dsObj1, dsObj2];
const dsObj1Error = getResultMock.conflict(dsObj1.type, dsObj1.id);
>>>>>>> update import api only

describe('#checkConflictsForDataSource', () => {
  const setupParams = (partial: {
    objects: SavedObjectType[];
    ignoreRegularConflicts?: boolean;
    retries?: SavedObjectsImportRetry[];
    createNewCopies?: boolean;
    dataSourceId?: string;
  }): ConflictsForDataSourceParams => {
    return { ...partial };
  };

  beforeEach(() => {
    mockUuidv4.mockReset();
    mockUuidv4.mockReturnValueOnce(`new-object-id`);
  });

  it('exits early if there are no objects to check', async () => {
    const params = setupParams({ objects: [] });
    const checkConflictsForDataSourceResult = await checkConflictsForDataSource(params);
    expect(checkConflictsForDataSourceResult).toEqual({
      filteredObjects: [],
      errors: [],
      importIdMap: new Map(),
      pendingOverwrites: new Set(),
    });
  });

  it('returns original objects result when there is no data source id', async () => {
    const params = setupParams({ objects });
    const checkConflictsForDataSourceResult = await checkConflictsForDataSource(params);
    expect(checkConflictsForDataSourceResult).toEqual({
      filteredObjects: [...objects],
      errors: [],
      importIdMap: new Map(),
      pendingOverwrites: new Set(),
    });
  });

  it('return obj if it is not data source obj and there is no conflict of the data source id', async () => {
    const params = setupParams({ objects: objectsWithDataSource, dataSourceId: 'ds' });
    const checkConflictsForDataSourceResult = await checkConflictsForDataSource(params);
    expect(checkConflictsForDataSourceResult).toEqual({
<<<<<<< HEAD
      filteredObjects: [dataSourceObj1, dataSourceObj2],
=======
      filteredObjects: [dsObj1, dsObj2],
>>>>>>> update import api only
      errors: [],
      importIdMap: new Map(),
      pendingOverwrites: new Set(),
    });
  });

  it('can resolve the data source id conflict when the ds it not match when ignoreRegularConflicts=true', async () => {
    const params = setupParams({
      objects: objectsWithDataSource,
      ignoreRegularConflicts: true,
      dataSourceId: 'currentDsId',
    });
    const checkConflictsForDataSourceResult = await checkConflictsForDataSource(params);

    expect(checkConflictsForDataSourceResult).toEqual(
      expect.objectContaining({
        filteredObjects: [
          {
<<<<<<< HEAD
            ...dataSourceObj1,
            id: 'currentDsId_id-1',
          },
          {
            ...dataSourceObj2,
=======
            ...dsObj1,
            id: 'currentDsId_id-1',
          },
          {
            ...dsObj2,
>>>>>>> update import api only
            id: 'currentDsId_id-2',
          },
        ],
        errors: [],
        importIdMap: new Map([
<<<<<<< HEAD
          [
            `${dataSourceObj1.type}:${dataSourceObj1.id}`,
            { id: 'currentDsId_id-1', omitOriginId: true },
          ],
          [
            `${dataSourceObj2.type}:${dataSourceObj2.id}`,
            { id: 'currentDsId_id-2', omitOriginId: true },
          ],
        ]),
        pendingOverwrites: new Set([
          `${dataSourceObj1.type}:${dataSourceObj1.id}`,
          `${dataSourceObj2.type}:${dataSourceObj2.id}`,
        ]),
=======
          [`${dsObj1.type}:${dsObj1.id}`, { id: 'currentDsId_id-1', omitOriginId: true }],
          [`${dsObj2.type}:${dsObj2.id}`, { id: 'currentDsId_id-2', omitOriginId: true }],
        ]),
        pendingOverwrites: new Set([`${dsObj1.type}:${dsObj1.id}`, `${dsObj2.type}:${dsObj2.id}`]),
>>>>>>> update import api only
      })
    );
  });

  it('can push error when do not override with data source conflict', async () => {
    const params = setupParams({
<<<<<<< HEAD
      objects: [dataSourceObj1],
=======
      objects: [dsObj1],
>>>>>>> update import api only
      ignoreRegularConflicts: false,
      dataSourceId: 'currentDs',
    });
    const checkConflictsForDataSourceResult = await checkConflictsForDataSource(params);
    expect(checkConflictsForDataSourceResult).toEqual({
      filteredObjects: [],
      errors: [
        {
<<<<<<< HEAD
          ...dataSourceObj1Error,
          title: dataSourceObj1.attributes.title,
          meta: { title: dataSourceObj1.attributes.title },
=======
          ...dsObj1Error,
          title: dsObj1.attributes.title,
          meta: { title: dsObj1.attributes.title },
>>>>>>> update import api only
          error: { type: 'conflict' },
        },
      ],
      importIdMap: new Map(),
      pendingOverwrites: new Set(),
    });
  });
});
