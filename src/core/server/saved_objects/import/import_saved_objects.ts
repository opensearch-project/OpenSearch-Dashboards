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

import { collectSavedObjects } from './collect_saved_objects';
import {
  SavedObjectsImportError,
  SavedObjectsImportResponse,
  SavedObjectsImportOptions,
  SavedObjectsImportUnsupportedTypeError,
} from './types';
import { validateReferences } from './validate_references';
import { checkOriginConflicts } from './check_origin_conflicts';
import { createSavedObjects } from './create_saved_objects';
import { checkConflicts } from './check_conflicts';
import { regenerateIds } from './regenerate_ids';
import { checkConflictsForDataSource } from './check_conflict_for_data_source';
import { isSavedObjectWithDataSource } from './validate_object_id';
import { findDataSourceForObject } from './utils';

/**
 * Import saved objects from given stream. See the {@link SavedObjectsImportOptions | options} for more
 * detailed information.
 *
 * @public
 */
export async function importSavedObjectsFromStream({
  readStream,
  objectLimit,
  overwrite,
  createNewCopies,
  savedObjectsClient,
  typeRegistry,
  namespace,
  dataSourceId,
  dataSourceTitle,
  workspaces,
  dataSourceEnabled,
}: SavedObjectsImportOptions): Promise<SavedObjectsImportResponse> {
  let errorAccumulator: SavedObjectsImportError[] = [];
  const supportedTypes = typeRegistry.getImportableAndExportableTypes().map((type) => type.name);

  // Get the objects to import
  const collectSavedObjectsResult = await collectSavedObjects({
    readStream,
    objectLimit,
    supportedTypes,
    dataSourceId,
  });
  // if dataSource is not enabled, but object type is data-source, or saved object id contains datasource id
  // return unsupported type error
  if (!dataSourceEnabled) {
    const notSupportedErrors: SavedObjectsImportError[] = collectSavedObjectsResult.collectedObjects.reduce(
      (errors: SavedObjectsImportError[], obj) => {
        if (obj.type === 'data-source' || isSavedObjectWithDataSource(obj.id)) {
          const error: SavedObjectsImportUnsupportedTypeError = { type: 'unsupported_type' };
          const { title } = obj.attributes;
          errors.push({ error, type: obj.type, id: obj.id, title, meta: { title } });
        }
        return errors; // Return the accumulator in each iteration
      },
      []
    );
    if (notSupportedErrors?.length > 0) {
      return {
        successCount: 0,
        success: false,
        errors: notSupportedErrors,
      };
    }
  }

  // If target workspace is exists, it will check whether the assigned data sources in the target workspace
  // include the data sources of the imported saved objects.
  if (workspaces && workspaces.length > 0) {
    const assignedDataSourcesInTargetWorkspace = await savedObjectsClient
      .find({
        type: 'data-source',
        fields: ['id'],
        perPage: 10000,
        workspaces,
      })
      .then((response) => {
        return response?.saved_objects?.map((source) => source.id) ?? [];
      });
    for (const object of collectSavedObjectsResult.collectedObjects) {
      try {
        const referenceDSId = await findDataSourceForObject(object, savedObjectsClient);
        if (referenceDSId && !assignedDataSourcesInTargetWorkspace.includes(referenceDSId)) {
          collectSavedObjectsResult.errors.push({
            type: object.type,
            id: object.id,
            error: {
              type: 'missing_target_workspace_assigned_data_source',
              message: `The object hasn’t be copied to the selected workspace. The data source (${referenceDSId}) is not available in the selected workspace.`,
            },
            meta: { title: object.attributes?.title },
          });
        }
      } catch (err) {
        collectSavedObjectsResult.errors.push({
          type: object.type,
          id: object.id,
          error: { type: 'unknown', message: err, statusCode: 500 },
          meta: { title: object.attributes?.title },
        });
      }
    }
  }

  errorAccumulator = [...errorAccumulator, ...collectSavedObjectsResult.errors];
  /** Map of all IDs for objects that we are attempting to import; each value is empty by default */
  let importIdMap = collectSavedObjectsResult.importIdMap;
  let pendingOverwrites = new Set<string>();

  // Validate references
  const validateReferencesResult = await validateReferences(
    collectSavedObjectsResult.collectedObjects,
    savedObjectsClient,
    namespace
  );
  errorAccumulator = [...errorAccumulator, ...validateReferencesResult];

  if (createNewCopies) {
    // randomly generated id
    importIdMap = regenerateIds(collectSavedObjectsResult.collectedObjects, dataSourceId);
  } else {
    // in check conclict and override mode
    // Check single-namespace objects for conflicts in this namespace, and check multi-namespace objects for conflicts across all namespaces
    const checkConflictsParams = {
      objects: collectSavedObjectsResult.collectedObjects,
      savedObjectsClient,
      namespace,
      ignoreRegularConflicts: overwrite,
      workspaces,
    };

    const checkConflictsResult = await checkConflicts(checkConflictsParams);
    errorAccumulator = [...errorAccumulator, ...checkConflictsResult.errors];
    importIdMap = new Map([...importIdMap, ...checkConflictsResult.importIdMap]);
    pendingOverwrites = new Set([...pendingOverwrites, ...checkConflictsResult.pendingOverwrites]);

    // Check multi-namespace object types for origin conflicts in this namespace
    const checkOriginConflictsParams = {
      objects: checkConflictsResult.filteredObjects,
      savedObjectsClient,
      typeRegistry,
      namespace,
      ignoreRegularConflicts: overwrite,
      importIdMap,
    };

    /**
     * If dataSourceId exist,
     */
    if (dataSourceId) {
      const checkConflictsForDataSourceResult = await checkConflictsForDataSource({
        objects: checkConflictsResult.filteredObjects,
        ignoreRegularConflicts: overwrite,
        dataSourceId,
        savedObjectsClient,
      });
      checkOriginConflictsParams.objects = checkConflictsForDataSourceResult.filteredObjects;
    }

    const checkOriginConflictsResult = await checkOriginConflicts(checkOriginConflictsParams);
    errorAccumulator = [...errorAccumulator, ...checkOriginConflictsResult.errors];
    importIdMap = new Map([...importIdMap, ...checkOriginConflictsResult.importIdMap]);
    pendingOverwrites = new Set([
      ...pendingOverwrites,
      ...checkOriginConflictsResult.pendingOverwrites,
    ]);
  }

  // Create objects in bulk
  const createSavedObjectsParams = {
    objects: dataSourceId
      ? collectSavedObjectsResult.collectedObjects.filter((object) => object.type !== 'data-source')
      : collectSavedObjectsResult.collectedObjects,
    accumulatedErrors: errorAccumulator,
    savedObjectsClient,
    importIdMap,
    overwrite,
    namespace,
    dataSourceId,
    dataSourceTitle,
    ...(workspaces ? { workspaces } : {}),
  };
  const createSavedObjectsResult = await createSavedObjects(createSavedObjectsParams);
  errorAccumulator = [...errorAccumulator, ...createSavedObjectsResult.errors];

  const successResults = createSavedObjectsResult.createdObjects.map(
    ({ type, id, attributes: { title }, destinationId, originId }) => {
      const meta = { title, icon: typeRegistry.getType(type)?.management?.icon };
      const attemptedOverwrite = pendingOverwrites.has(`${type}:${id}`);
      return {
        type,
        id,
        meta,
        ...(attemptedOverwrite && { overwrite: true }),
        ...(destinationId && { destinationId }),
        ...(destinationId && !originId && !createNewCopies && { createNewCopy: true }),
      };
    }
  );

  const errorResults = errorAccumulator.map((error) => {
    const icon = typeRegistry.getType(error.type)?.management?.icon;
    const attemptedOverwrite = pendingOverwrites.has(`${error.type}:${error.id}`);
    return {
      ...error,
      meta: { ...error.meta, icon },
      ...(attemptedOverwrite && { overwrite: true }),
    };
  });

  return {
    successCount: createSavedObjectsResult.createdObjects.length,
    success: errorAccumulator.length === 0,
    ...(successResults.length && { successResults }),
    ...(errorResults.length && { errors: errorResults }),
  };
}
