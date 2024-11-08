/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObject, SavedObjectsBaseOptions, SavedObjectsClientContract } from '../types';
import { SavedObjectsImportError } from './types';
import { findReferenceDataSourceForObject } from './utils';

// Check whether the target workspace includes the data source from the references of coping assets.
export async function validateDataSources(
  savedObjects: Array<SavedObject<{ title?: string }>>,
  savedObjectsClient: SavedObjectsClientContract,
  errorAccumulator: SavedObjectsImportError[],
  workspaces: SavedObjectsBaseOptions['workspaces']
) {
  // Filter out any objects that resulted in errors
  const errorSet = errorAccumulator.reduce(
    (acc, { type, id }) => acc.add(`${type}:${id}`),
    new Set<string>()
  );

  const filteredObjects = savedObjects.filter(({ type, id }) => !errorSet.has(`${type}:${id}`));

  if (filteredObjects?.length === 0) {
    return [];
  }

  const errorMap: { [key: string]: SavedObjectsImportError } = {};
  const assignedDataSourcesInTargetWorkspace = await savedObjectsClient
    .find({
      type: 'data-source',
      fields: ['id'],
      perPage: 999,
      workspaces,
    })
    .then((response) => {
      return response?.saved_objects?.map((ds) => ds.id) ?? [];
    });

  const filteredObjectsMap = new Map(savedObjects.map((so) => [so.id, so]));

  for (const object of filteredObjects) {
    const { id, type, attributes } = object;
    const referenceDS = findReferenceDataSourceForObject(object, filteredObjectsMap);
    if (referenceDS && !assignedDataSourcesInTargetWorkspace.includes(referenceDS.id)) {
      errorMap[`${type}:${id}`] = {
        id,
        type,
        title: attributes?.title,
        meta: { title: attributes?.title },
        error: {
          type: 'missing_data_source',
          dataSourceName: referenceDS.name,
        },
      };
    }
  }

  return Object.values(errorMap);
}
