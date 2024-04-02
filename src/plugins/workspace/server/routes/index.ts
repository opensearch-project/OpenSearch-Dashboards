/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import {
  CoreSetup,
  Logger,
  exportSavedObjectsToStream,
  importSavedObjectsFromStream,
} from '../../../../core/server';
import { IWorkspaceClientImpl } from '../types';
import { registerDuplicateRoute } from './duplicate';

const WORKSPACES_API_BASE_URL = '/api/workspaces';

const workspaceAttributesSchema = schema.object({
  description: schema.maybe(schema.string()),
  name: schema.string(),
  features: schema.maybe(schema.arrayOf(schema.string())),
  color: schema.maybe(schema.string()),
  icon: schema.maybe(schema.string()),
  defaultVISTheme: schema.maybe(schema.string()),
  reserved: schema.maybe(schema.boolean()),
});

export function registerRoutes({
  client,
  logger,
  http,
  maxImportExportSize,
}: {
  client: IWorkspaceClientImpl;
  logger: Logger;
  http: CoreSetup['http'];
  maxImportExportSize: number;
}) {
  const router = http.createRouter();
  router.post(
    {
      path: `${WORKSPACES_API_BASE_URL}/_list`,
      validate: {
        body: schema.object({
          search: schema.maybe(schema.string()),
          sortOrder: schema.maybe(schema.string()),
          perPage: schema.number({ min: 0, defaultValue: 20 }),
          page: schema.number({ min: 0, defaultValue: 1 }),
          sortField: schema.maybe(schema.string()),
          searchFields: schema.maybe(schema.arrayOf(schema.string())),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const result = await client.list(
        {
          context,
          request: req,
          logger,
        },
        req.body
      );
      if (!result.success) {
        return res.ok({ body: result });
      }
      return res.ok({
        body: result,
      });
    })
  );
  router.get(
    {
      path: `${WORKSPACES_API_BASE_URL}/{id}`,
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const { id } = req.params;
      const result = await client.get(
        {
          context,
          request: req,
          logger,
        },
        id
      );

      return res.ok({
        body: result,
      });
    })
  );
  router.post(
    {
      path: `${WORKSPACES_API_BASE_URL}`,
      validate: {
        body: schema.object({
          attributes: workspaceAttributesSchema,
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const { attributes } = req.body;

      const result = await client.create(
        {
          context,
          request: req,
          logger,
        },
        attributes
      );
      return res.ok({ body: result });
    })
  );
  router.put(
    {
      path: `${WORKSPACES_API_BASE_URL}/{id?}`,
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
        body: schema.object({
          attributes: workspaceAttributesSchema,
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const { id } = req.params;
      const { attributes } = req.body;

      const result = await client.update(
        {
          context,
          request: req,
          logger,
        },
        id,
        attributes
      );
      return res.ok({ body: result });
    })
  );
  router.delete(
    {
      path: `${WORKSPACES_API_BASE_URL}/{id?}`,
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const { id } = req.params;

      const result = await client.delete(
        {
          context,
          request: req,
          logger,
        },
        id
      );
      return res.ok({ body: result });
    })
  );

  // duplicate saved objects among workspaces
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
            message: `Trying to duplicate object(s) with unsupported types: ${invalidObjects
              .map((obj) => `${obj.type}:${obj.id}`)
              .join(', ')}`,
          },
        });
      }

      // check whether the target workspace exists or not
      const getTargetWorkspaceResult = await client.get(
        {
          context,
          request: req,
          logger,
        },
        targetWorkspace
      );
      if (!getTargetWorkspaceResult.success) {
        return res.badRequest({
          body: {
            message: `Get target workspace ${targetWorkspace} error: ${getTargetWorkspaceResult.error}`,
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
      });

      return res.ok({ body: result });
    })
  );
}
