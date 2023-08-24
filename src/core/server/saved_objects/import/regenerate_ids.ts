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

import { v4 as uuidv4 } from 'uuid';
import { SavedObject, SavedObjectsClientContract } from '../types';
import { SavedObjectsUtils } from '../service';

/**
 * Takes an array of saved objects and returns an importIdMap of randomly-generated new IDs.
 *
 * @param objects The saved objects to generate new IDs for.
 */
export const regenerateIds = (objects: SavedObject[]) => {
  const importIdMap = objects.reduce((acc, object) => {
    return acc.set(`${object.type}:${object.id}`, { id: uuidv4(), omitOriginId: true });
  }, new Map<string, { id: string; omitOriginId?: boolean }>());
  return importIdMap;
};

export const regenerateIdsWithReference = async (props: {
  savedObjects: SavedObject[];
  savedObjectsClient: SavedObjectsClientContract;
  workspaces?: string[];
  objectLimit: number;
}): Promise<Map<string, { id?: string; omitOriginId?: boolean }>> => {
  const { savedObjects, savedObjectsClient, workspaces } = props;
  if (!workspaces || !workspaces.length) {
    return savedObjects.reduce((acc, object) => {
      return acc.set(`${object.type}:${object.id}`, { id: object.id, omitOriginId: false });
    }, new Map<string, { id: string; omitOriginId?: boolean }>());
  }

  const bulkGetResult = await savedObjectsClient.bulkGet(
    savedObjects.map((item) => ({ type: item.type, id: item.id }))
  );

  return bulkGetResult.saved_objects.reduce((acc, object) => {
    if (object.error?.statusCode === 404) {
      acc.set(`${object.type}:${object.id}`, { id: object.id, omitOriginId: true });
      return acc;
    }

    const filteredWorkspaces = SavedObjectsUtils.filterWorkspacesAccordingToBaseWorkspaces(
      workspaces,
      object.workspaces
    );
    if (filteredWorkspaces.length) {
      acc.set(`${object.type}:${object.id}`, { id: uuidv4(), omitOriginId: true });
    } else {
      acc.set(`${object.type}:${object.id}`, { id: object.id, omitOriginId: false });
    }
    return acc;
  }, new Map<string, { id: string; omitOriginId?: boolean }>());
};
