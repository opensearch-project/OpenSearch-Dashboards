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
 * function to only check the data souerce conflict when multiple data sources are enabled.
 * the purpose of this function is to check the conflict of the imported saved objects and data source
 * @param objects, this the array of saved objects to be verified whether contains the data source conflict
 * @param ignoreRegularConflicts whether to override
 * @param retries import operations list
 * @param dataSourceId the id to identify the data source
 * @returns {filteredObjects, errors, importIdMap }
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
  // exit early if there are no objects to check
  if (objects.length === 0) {
    return { filteredObjects, errors, importIdMap };
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

    if (object.type !== 'data-source') {
      const parts = id.split('_'); // this is the array to host the split results of the id
      const previoudDataSourceId = parts.length > 1 ? parts[0] : undefined;
      const rawId = previoudDataSourceId ? parts[1] : parts[0];

      /**
       * for import saved object from osd exported
       * when the imported saved objects with the different dataSourceId comparing to the current dataSourceId
       */

      if (
        previoudDataSourceId &&
        previoudDataSourceId !== dataSourceId &&
        !ignoreRegularConflicts
      ) {
        const error = { type: 'conflict' as 'conflict', ...(destinationId && { destinationId }) };
        errors.push({ type, id, title, meta: { title }, error });
      } else if (previoudDataSourceId && previoudDataSourceId === dataSourceId) {
        filteredObjects.push(object);
      } else {
        /**
         * Only update importIdMap and filtered objects
         */
        const omitOriginId = ignoreRegularConflicts;
        importIdMap.set(`${type}:${id}`, { id: `${dataSourceId}_${rawId}`, omitOriginId });
        filteredObjects.push({ ...object, id: `${dataSourceId}_${rawId}` });
      }
    }
  });

  return { filteredObjects, errors, importIdMap };
}
