/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter } from '../../http';
import { exportSavedObjectsToStream } from '../export';
import { filterInvalidObjects } from './utils';
import { collectSavedObjects } from '../import/collect_saved_objects';
import { WORKSPACE_TYPE } from '../../../utils';

const SHARE_LIMIT = 10000;

export const registerShareRoute = (router: IRouter) => {
  router.post(
    {
      path: '/_share',
      validate: {
        body: schema.object({
          sourceWorkspaceId: schema.maybe(schema.string()),
          objects: schema.arrayOf(
            schema.object({
              id: schema.string(),
              type: schema.string(),
            })
          ),
          targetWorkspaceIds: schema.arrayOf(schema.string()),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const savedObjectsClient = context.core.savedObjects.client;
      const { sourceWorkspaceId, objects, targetWorkspaceIds } = req.body;

      // need to access the registry for type validation, can't use the schema for this
      const supportedTypes = context.core.savedObjects.typeRegistry
        .getAllTypes()
        .filter((type) => type.name !== WORKSPACE_TYPE)
        .map((t) => t.name);

      if (objects.length) {
        const invalidObjects = filterInvalidObjects(objects, supportedTypes);
        if (invalidObjects.length) {
          return res.badRequest({
            body: {
              message: `Trying to share object(s) with non-shareable types: ${invalidObjects
                .map((obj) => `${obj.type}:${obj.id}`)
                .join(', ')}`,
            },
          });
        }
      }

      const objectsListStream = await exportSavedObjectsToStream({
        savedObjectsClient,
        objects,
        exportSizeLimit: SHARE_LIMIT,
        includeReferencesDeep: true,
        excludeExportDetails: true,
      });

      const collectSavedObjectsResult = await collectSavedObjects({
        readStream: objectsListStream,
        objectLimit: SHARE_LIMIT,
        supportedTypes,
      });

      const savedObjects = collectSavedObjectsResult.collectedObjects;

      const sharedObjects = savedObjects
        .filter((obj) => obj.workspaces && obj.workspaces.length > 0)
        .map((obj) => ({ id: obj.id, type: obj.type, workspaces: obj.workspaces }));

      if (sharedObjects.length === 0) {
        return res.ok({
          body: savedObjects.map((savedObject) => ({
            type: savedObject.type,
            id: savedObject.id,
            workspaces: savedObject.workspaces,
          })),
        });
      }

      const response = await savedObjectsClient.addToWorkspaces(sharedObjects, targetWorkspaceIds, {
        workspaces: sourceWorkspaceId ? [sourceWorkspaceId] : undefined,
      });
      return res.ok({
        body: response,
      });
    })
  );
};
