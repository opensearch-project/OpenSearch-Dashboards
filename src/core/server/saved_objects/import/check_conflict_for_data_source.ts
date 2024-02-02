/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObject, SavedObjectsImportError, SavedObjectsImportRetry } from '../types';

export interface ConflictsForDataSourceParams {
  objects: Array<SavedObject<{ title?: string }>>;
  ignoreRegularConflicts?: boolean;
  retries?: SavedObjectsImportRetry[];
  dataSourceId?: string;
}

interface ImportIdMapEntry {
  id?: string;
  omitOriginId?: boolean;
}

/**
 * function to check the conflict when multiple data sources are enabled.
 * the purpose of this function is to check the conflict of the imported saved objects and data source
 * @param objects, this the array of saved objects to be verified whether contains the data source conflict
 * @param ignoreRegularConflicts whether to override
 * @param retries import operations list
 * @param dataSourceId the id to identify the data source
 * @returns {filteredObjects, errors, importIdMap, pendingOverwrites }
 */
export async function checkConflictsForDataSource({
  objects,
  ignoreRegularConflicts,
  retries = [],
  dataSourceId,
}: ConflictsForDataSourceParams) {
  const filteredObjects: Array<SavedObject<{ title?: string }>> = [];
  const errors: SavedObjectsImportError[] = [];
  const importIdMap = new Map<string, ImportIdMapEntry>();
  const pendingOverwrites = new Set<string>();

  // exit early if there are no objects to check
  if (objects.length === 0) {
    return { filteredObjects, errors, importIdMap, pendingOverwrites };
  }
  const retryMap = retries.reduce(
    (acc, cur) => acc.set(`${cur.type}:${cur.id}`, cur),
    new Map<string, SavedObjectsImportRetry>()
  );
  objects.forEach((object) => {
    const {
      type,
      id,
      attributes: { title },
    } = object;
    const { destinationId } = retryMap.get(`${type}:${id}`) || {};

    if (!object.type.includes('data-source')) {
      // check the previous data source existed or not
      // by extract it from the id
      // e.g. e0c9e490-bdd7-11ee-b216-d78a57002330_ff959d40-b880-11e8-a6d9-e546fe2bba5f
      // e0c9e490-bdd7-11ee-b216-d78a57002330 is the data source id
      // for saved object data source itself, e0c9e490-bdd7-11ee-b216-d78a57002330 return undefined
      const parts = id.split('_'); // this is the array to host the split results of the id
      const previoudDataSourceId = parts.length > 1 ? parts[0] : undefined;
      // case for import saved object from osd exported
      // when the imported daved objects with the different dataSourceId comparing to the current dataSourceId
      // previous data source id not exist, push it to filtered object
      // no conflict
      if (!previoudDataSourceId || previoudDataSourceId === dataSourceId) {
        filteredObjects.push(object);
      } else if (previoudDataSourceId && previoudDataSourceId !== dataSourceId) {
        if (ignoreRegularConflicts) {
          // ues old key and new value in the importIdMap
          // old key is used to look up, new key is used to be the id of new object
          const omitOriginId = ignoreRegularConflicts;
          // e.g. e0c9e490-bdd7-11ee-b216-d78a57002330_ff959d40-b880-11e8-a6d9-e546fe2bba5f
          const rawId = parts[1];
          importIdMap.set(`${type}:${id}`, { id: `${dataSourceId}_${rawId}`, omitOriginId });
          pendingOverwrites.add(`${type}:${id}`);
          filteredObjects.push({ ...object, id: `${dataSourceId}_${rawId}` });
        } else {
          // not override
          // push error
          const error = { type: 'conflict' as 'conflict', ...(destinationId && { destinationId }) };
          errors.push({ type, id, title, meta: { title }, error });
        }
      }
    }
  });

  return { filteredObjects, errors, importIdMap, pendingOverwrites };
}
