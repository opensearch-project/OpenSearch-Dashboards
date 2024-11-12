/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fetchNestedDependencies } from '../export/inject_nested_depdendencies';
import { SavedObject, SavedObjectsBaseOptions, SavedObjectsClientContract } from '../types';
import { SavedObjectsImportError } from './types';
import { findReferenceDataSourceForObject } from './utils';

// Check whether the target workspace includes the data source referenced by the savedObjects.
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

  const nestedDependencies = await fetchNestedDependencies(filteredObjects, savedObjectsClient);
  const nestedObjectsMap = new Map(nestedDependencies.objects.map((object) => [object.id, object]));

  for (const object of filteredObjects) {
    const { id, type, attributes } = object;
    const referenceDS = findReferenceDataSourceForObject(object, nestedObjectsMap);
    if (referenceDS && !assignedDataSourcesInTargetWorkspace.includes(referenceDS.id)) {
      errorMap[`${type}:${id}`] = {
        id,
        type,
        title: attributes?.title,
        meta: { title: attributes?.title },
        error: {
          type: 'missing_data_source',
          dataSource: referenceDS.id,
        },
      };
    }
  }

  return Object.values(errorMap);
}
