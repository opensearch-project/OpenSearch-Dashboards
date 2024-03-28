/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter } from '../../http';
import { SavedObjectConfig } from '../saved_objects_config';
import { exportSavedObjectsToStream } from '../export';
import { importSavedObjectsFromStream } from '../import';

export const registerCopyRoute = (router: IRouter, config: SavedObjectConfig) => {
  const { maxImportExportSize } = config;

  router.post(
    {
      path: '/_copy',
      validate: {
        body: schema.object({
          objects: schema.arrayOf(
            schema.object({
              type: schema.string(),
              id: schema.string(),
            })
          ),
          includeReferencesDeep: schema.boolean({ defaultValue: false }),
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
            message: `Trying to copy object(s) with unsupported types: ${invalidObjects
              .map((obj) => `${obj.type}:${obj.id}`)
              .join(', ')}`,
          },
        });
      }

      const objectsListStream = await exportSavedObjectsToStream({
        savedObjectsClient,
        objects,
        exportSizeLimit: maxImportExportSize,
        includeReferencesDeep,
        excludeExportDetails: true,
      });

      const result = await importSavedObjectsFromStream({
        savedObjectsClient: context.core.savedObjects.client,
        typeRegistry: context.core.savedObjects.typeRegistry,
        readStream: objectsListStream,
        objectLimit: maxImportExportSize,
        overwrite: false,
        createNewCopies: true,
        workspaces: [targetWorkspace],
      });

      return res.ok({ body: result });
    })
  );
};
