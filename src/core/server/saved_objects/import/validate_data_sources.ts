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
  // Get the data sources assigned target workspace
  const assignedDataSourcesInTargetWorkspace = await savedObjectsClient
    .find({
      type: 'data-source',
      fields: ['id'],
      perPage: 999,
      workspaces,
    })
    .then((response) => {
      return new Set(response?.saved_objects?.map((ds) => ds.id));
    });

  const nestedDependencies = await fetchNestedDependencies(filteredObjects, savedObjectsClient);
  const sourceDataSourceMap = new Map(
    (nestedDependencies.objects as Array<SavedObject<{ title?: string }>>)
      .filter((object) => object.type === 'data-source')
      .map(({ id, attributes }) => [id, attributes?.title || id])
  );

  const nestedObjectsMap = new Map(nestedDependencies.objects.map((object) => [object.id, object]));

  for (const object of filteredObjects) {
    const { id, type, attributes } = object;
    const referenceDS = findReferenceDataSourceForObject(object, nestedObjectsMap);
    const missingDataSources = Array.from(referenceDS).filter(
      (item) => !assignedDataSourcesInTargetWorkspace.has(item)
    );
    if (missingDataSources.length > 0) {
      errorMap[`${type}:${id}`] = {
        id,
        type,
        title: attributes?.title,
        meta: { title: attributes?.title },
        error: {
          type: 'missing_data_source',
          dataSource: missingDataSources
            .map((mdId) => sourceDataSourceMap.get(mdId) || mdId)
            .join(', '),
        },
      };
    }
  }

  return Object.values(errorMap);
}
