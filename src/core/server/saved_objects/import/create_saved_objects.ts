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

import {
  SavedObject,
  SavedObjectsBaseOptions,
  SavedObjectsClientContract,
  SavedObjectsImportError,
} from '../types';
import { extractErrors } from './extract_errors';
import { CreatedObject, VisualizationObject } from './types';
import {
  extractVegaSpecFromSavedObject,
  getUpdatedTSVBVisState,
  updateDataSourceNameInVegaSpec,
  extractTimelineExpression,
  updateDataSourceNameInTimeline,
} from './utils';

interface CreateSavedObjectsParams<T> {
  objects: Array<SavedObject<T>>;
  accumulatedErrors: SavedObjectsImportError[];
  savedObjectsClient: SavedObjectsClientContract;
  importIdMap: Map<string, { id?: string; omitOriginId?: boolean }>;
  namespace?: string;
  overwrite?: boolean;
  dataSourceId?: string;
  dataSourceTitle?: string;
  workspaces?: SavedObjectsBaseOptions['workspaces'];
}
interface CreateSavedObjectsResult<T> {
  createdObjects: Array<CreatedObject<T>>;
  errors: SavedObjectsImportError[];
}

/**
 * This function abstracts the bulk creation of import objects. The main reason for this is that the import ID map should dictate the IDs of
 * the objects we create, and the create results should be mapped to the original IDs that consumers will be able to understand.
 */
export const createSavedObjects = async <T>({
  objects,
  accumulatedErrors,
  savedObjectsClient,
  importIdMap,
  namespace,
  overwrite,
  dataSourceId,
  dataSourceTitle,
  workspaces,
}: CreateSavedObjectsParams<T>): Promise<CreateSavedObjectsResult<T>> => {
  // filter out any objects that resulted in errors
  const errorSet = accumulatedErrors.reduce(
    (acc, { type, id }) => acc.add(`${type}:${id}`),
    new Set<string>()
  );
  const filteredObjects = objects.filter(({ type, id }) => !errorSet.has(`${type}:${id}`));

  // exit early if there are no objects to create
  if (filteredObjects.length === 0) {
    return { createdObjects: [], errors: [] };
  }

  // generate a map of the raw object IDs
  const objectIdMap = filteredObjects.reduce(
    (map, object) => map.set(`${object.type}:${object.id}`, object),
    new Map<string, SavedObject<T>>()
  );

  // filter out the 'version' field of each object, if it exists
  const objectsToCreate = await Promise.all(
    filteredObjects.map(({ version, ...object }) => {
      if (dataSourceId) {
        // @ts-expect-error
        if (dataSourceTitle && object.attributes.title) {
          if (
            object.type === 'dashboard' ||
            object.type === 'visualization' ||
            object.type === 'search'
          ) {
            // @ts-expect-error
            object.attributes.title = object.attributes.title + `_${dataSourceTitle}`;
          }
        }

        // Some visualization types will need special modifications, like Vega visualizations
        if (object.type === 'visualization') {
          const vegaSpec = extractVegaSpecFromSavedObject(object);

          if (!!vegaSpec && !!dataSourceTitle) {
            const updatedVegaSpec = updateDataSourceNameInVegaSpec({
              spec: vegaSpec,
              newDataSourceName: dataSourceTitle,
            });

            // @ts-expect-error
            const visStateObject = JSON.parse(object.attributes?.visState);
            visStateObject.params.spec = updatedVegaSpec;

            // @ts-expect-error
            object.attributes.visState = JSON.stringify(visStateObject);
            object.references.push({
              id: `${dataSourceId}`,
              type: 'data-source',
              name: 'dataSource',
            });
          }

          // Some visualization types will need special modifications, like TSVB visualizations
          const timelineExpression = extractTimelineExpression(object);
          if (!!timelineExpression && !!dataSourceTitle) {
            // Get the timeline expression with the updated data source name
            const modifiedExpression = updateDataSourceNameInTimeline(
              timelineExpression,
              dataSourceTitle
            );

            // @ts-expect-error
            const timelineStateObject = JSON.parse(object.attributes?.visState);
            timelineStateObject.params.expression = modifiedExpression;
            // @ts-expect-error
            object.attributes.visState = JSON.stringify(timelineStateObject);
          }

          const visualizationObject = object as VisualizationObject;
          const { visState, references } = getUpdatedTSVBVisState(
            visualizationObject,
            dataSourceId
          );

          visualizationObject.attributes.visState = visState;
          object.references = references;
        }

        if (object.type === 'index-pattern') {
          object.references = [
            {
              id: `${dataSourceId}`,
              type: 'data-source',
              name: 'dataSource',
            },
          ];
        }

        if (object.type === 'visualization' || object.type === 'search') {
          // @ts-expect-error
          const searchSourceString = object.attributes?.kibanaSavedObjectMeta?.searchSourceJSON;
          // @ts-expect-error
          const visStateString = object.attributes?.visState;

          if (searchSourceString) {
            const searchSource = JSON.parse(searchSourceString);
            if (searchSource.index) {
              const searchSourceIndex = searchSource.index.includes('_')
                ? searchSource.index.split('_')[searchSource.index.split('_').length - 1]
                : searchSource.index;
              searchSource.index = `${dataSourceId}_` + searchSourceIndex;

              // @ts-expect-error
              object.attributes.kibanaSavedObjectMeta.searchSourceJSON = JSON.stringify(
                searchSource
              );
            }
          }

          if (visStateString) {
            const visState = JSON.parse(visStateString);
            const controlList = visState.params?.controls;
            if (controlList) {
              // @ts-expect-error
              controlList.map((control) => {
                if (control.indexPattern) {
                  const controlIndexPattern = control.indexPattern.includes('_')
                    ? control.indexPattern.split('_')[control.indexPattern.split('_').length - 1]
                    : control.indexPattern;
                  control.indexPattern = `${dataSourceId}_` + controlIndexPattern;
                }
              });
            }
            // @ts-expect-error
            object.attributes.visState = JSON.stringify(visState);
          }
        }
      }

      // use the import ID map to ensure that each reference is being created with the correct ID
      const references = object.references?.map((reference) => {
        const { type, id } = reference;
        const importIdEntry = importIdMap.get(`${type}:${id}`);
        if (importIdEntry?.id) {
          return { ...reference, id: importIdEntry.id };
        }
        return reference;
      });
      // use the import ID map to ensure that each object is being created with the correct ID, also ensure that the `originId` is set on
      // the created object if it did not have one (or is omitted if specified)
      const importIdEntry = importIdMap.get(`${object.type}:${object.id}`);
      if (importIdEntry?.id) {
        objectIdMap.set(`${object.type}:${importIdEntry.id}`, object);
        const originId = importIdEntry.omitOriginId ? undefined : object.originId ?? object.id;
        return { ...object, id: importIdEntry.id, originId, ...(references && { references }) };
      }
      return { ...object, ...(references && { references }) };
    })
  );
  const resolvableErrors = [
    'conflict',
    'ambiguous_conflict',
    'missing_references',
    'missing_data_source',
  ];
  let expectedResults = objectsToCreate;
  if (!accumulatedErrors.some(({ error: { type } }) => resolvableErrors.includes(type))) {
    const bulkCreateResponse = await savedObjectsClient.bulkCreate(objectsToCreate, {
      namespace,
      overwrite,
      ...(workspaces ? { workspaces } : {}),
    });
    expectedResults = bulkCreateResponse.saved_objects;
  }

  // remap results to reflect the object IDs that were submitted for import
  // this ensures that consumers understand the results
  const remappedResults = expectedResults.map<CreatedObject<T>>((result) => {
    const { id } = objectIdMap.get(`${result.type}:${result.id}`)!;
    // also, include a `destinationId` field if the object create attempt was made with a different ID
    return { ...result, id, ...(id !== result.id && { destinationId: result.id }) };
  });

  return {
    createdObjects: remappedResults.filter((obj) => !obj.error),
    errors: extractErrors(remappedResults, objects),
  };
};
