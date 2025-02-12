/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import {
  IRouter,
  Logger,
  exportSavedObjectsToStream,
  importSavedObjectsFromStream,
} from '../../../../core/server';
import { WORKSPACES_API_BASE_URL } from '.';
import { IWorkspaceClientImpl } from '../types';

export const registerDuplicateRoute = (
  router: IRouter,
  logger: Logger,
  client: IWorkspaceClientImpl,
  maxImportExportSize: number,
  isDataSourceEnabled: boolean
) => {
  router.post(
    {
      path: `${WORKSPACES_API_BASE_URL}/_duplicate_saved_objects`,
      validate: {
        body: schema.object({
          objects: schema.arrayOf(
            schema.object({
              type: schema.string(),
              id: schema.string(),
            })
          ),
          includeReferencesDeep: schema.boolean({ defaultValue: true }),
          targetWorkspace: schema.string(),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const savedObjectsClient = context.core.savedObjects.client;
      const { objects, includeReferencesDeep, targetWorkspace } = req.body;

      // need to access the registry for type validation, can't use the schema for this
      const supportedTypes = context.core.savedObjects.typeRegistry
        .getImportableAndExportableTypes()
        .map((t) => t.name);

      const invalidObjects = objects.filter((obj) => !supportedTypes.includes(obj.type));
      if (invalidObjects.length) {
        return res.badRequest({
          body: {
            message: `Trying to duplicate object(s) with unsupported types: ${invalidObjects
              .map((obj) => `${obj.type}:${obj.id}`)
              .join(', ')}`,
          },
        });
      }

      // check whether the target workspace exists or not
      const getTargetWorkspaceResult = await client.get(
        {
          request: req,
        },
        targetWorkspace
      );
      if (!getTargetWorkspaceResult.success) {
        return res.badRequest({
          body: {
            message: `Get target workspace error: ${getTargetWorkspaceResult.error}`,
          },
        });
      }

      // fetch all the details of the specified saved objects
      const objectsListStream = await exportSavedObjectsToStream({
        savedObjectsClient,
        objects,
        exportSizeLimit: maxImportExportSize,
        includeReferencesDeep,
        excludeExportDetails: true,
      });

      // import the saved objects into the target workspace
      const result = await importSavedObjectsFromStream({
        savedObjectsClient: context.core.savedObjects.client,
        typeRegistry: context.core.savedObjects.typeRegistry,
        readStream: objectsListStream,
        objectLimit: maxImportExportSize,
        overwrite: false,
        createNewCopies: true,
        workspaces: [targetWorkspace],
        dataSourceEnabled: isDataSourceEnabled,
        isCopy: true,
      });

      return res.ok({ body: result });
    })
  );
};
