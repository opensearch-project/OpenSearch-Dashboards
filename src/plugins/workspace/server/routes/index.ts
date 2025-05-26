/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import {
  IRouter,
  Logger,
  PrincipalType,
  ACL,
  DEFAULT_NAV_GROUPS,
  WorkspacePermissionMode,
} from '../../../../core/server';
import {
  MAX_WORKSPACE_NAME_LENGTH,
  MAX_WORKSPACE_DESCRIPTION_LENGTH,
} from '../../common/constants';
import { IWorkspaceClientImpl, WorkspaceAttributeWithPermission } from '../types';
import { SavedObjectsPermissionControlContract } from '../permission_control/client';
import { registerDuplicateRoute } from './duplicate';
import { transferCurrentUserInPermissions, translatePermissionsToRole } from '../utils';
import { validateWorkspaceColor } from '../../common/utils';
import { getUseCaseFeatureConfig } from '../../../../core/server';
import { cos_sim, pipeline } from '@huggingface/transformers';

export const WORKSPACES_API_BASE_URL = '/api/workspaces';

const workspacePermissionMode = schema.oneOf([
  schema.literal(WorkspacePermissionMode.Read),
  schema.literal(WorkspacePermissionMode.Write),
  schema.literal(WorkspacePermissionMode.LibraryRead),
  schema.literal(WorkspacePermissionMode.LibraryWrite),
]);

const principalType = schema.oneOf([
  schema.literal(PrincipalType.Users),
  schema.literal(PrincipalType.Groups),
]);

const workspacePermissions = schema.recordOf(
  workspacePermissionMode,
  schema.recordOf(principalType, schema.arrayOf(schema.string()), {})
);

const dataSourceIds = schema.arrayOf(schema.string());
const dataConnectionIds = schema.arrayOf(schema.string());

const settingsSchema = schema.object({
  permissions: schema.maybe(workspacePermissions),
  dataSources: schema.maybe(dataSourceIds),
  dataConnections: schema.maybe(dataConnectionIds),
});

const featuresSchema = schema.arrayOf(schema.string(), {
  minSize: 1,
  validate: (featureConfigs) => {
    const validateUseCaseConfigs = [
      DEFAULT_NAV_GROUPS.all,
      DEFAULT_NAV_GROUPS.observability,
      DEFAULT_NAV_GROUPS['security-analytics'],
      DEFAULT_NAV_GROUPS.essentials,
      DEFAULT_NAV_GROUPS.search,
    ].map(({ id }) => getUseCaseFeatureConfig(id));

    const useCaseConfigCount = featureConfigs.filter((config) =>
      validateUseCaseConfigs.includes(config)
    ).length;

    if (useCaseConfigCount === 0) {
      return `At least one use case is required. Valid options: ${validateUseCaseConfigs.join(
        ', '
      )}`;
    } else if (useCaseConfigCount > 1) {
      return 'Only one use case is allowed per workspace.';
    }
  },
});

const workspaceOptionalAttributesSchema = {
  description: schema.maybe(schema.string({ maxLength: MAX_WORKSPACE_DESCRIPTION_LENGTH })),
  color: schema.maybe(
    schema.string({
      validate: (color) => {
        if (!validateWorkspaceColor(color)) {
          return 'invalid workspace color format';
        }
      },
    })
  ),
  icon: schema.maybe(schema.string()),
  defaultVISTheme: schema.maybe(schema.string()),
  reserved: schema.maybe(schema.boolean()),
};

const workspaceNameSchema = schema.string({
  maxLength: MAX_WORKSPACE_NAME_LENGTH,
  validate(value) {
    if (!value || value.trim().length === 0) {
      return "can't be empty or blank.";
    }
  },
});

const createWorkspaceAttributesSchema = schema.object({
  name: workspaceNameSchema,
  features: featuresSchema,
  ...workspaceOptionalAttributesSchema,
});

const updateWorkspaceAttributesSchema = schema.object({
  name: schema.maybe(workspaceNameSchema),
  features: schema.maybe(featuresSchema),
  ...workspaceOptionalAttributesSchema,
});

// Declare a variable outside the route handler to cache the model.
let semanticExtractor: any = null;

export function registerRoutes({
  client,
  logger,
  router,
  maxImportExportSize,
  permissionControlClient,
  isPermissionControlEnabled,
  isDataSourceEnabled,
}: {
  client: IWorkspaceClientImpl;
  logger: Logger;
  router: IRouter;
  maxImportExportSize: number;
  permissionControlClient?: SavedObjectsPermissionControlContract;
  isPermissionControlEnabled: boolean;
  isDataSourceEnabled: boolean;
}) {
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
          permissionModes: schema.maybe(schema.arrayOf(workspacePermissionMode)),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const result = await client.list(
        {
          request: req,
        },
        req.body
      );
      if (!result.success) {
        return res.ok({ body: result });
      }
      const { workspaces } = result.result;

      // enrich workspace permissionMode
      const principals = permissionControlClient?.getPrincipalsFromRequest(req);
      workspaces.forEach((workspace) => {
        const permissionMode = translatePermissionsToRole(
          isPermissionControlEnabled,
          workspace.permissions,
          principals
        );
        workspace.permissionMode = permissionMode;
      });

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
          request: req,
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
          attributes: createWorkspaceAttributesSchema,
          settings: settingsSchema,
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const { attributes, settings } = req.body;
      const principals = permissionControlClient?.getPrincipalsFromRequest(req);
      const createPayload: Omit<WorkspaceAttributeWithPermission, 'id'> & {
        dataSources?: string[];
        dataConnections?: string[];
      } = attributes;

      if (isPermissionControlEnabled) {
        createPayload.permissions = settings.permissions;
        if (!!principals?.users?.length) {
          const currentUserId = principals.users[0];
          const acl = new ACL(
            transferCurrentUserInPermissions(currentUserId, settings.permissions)
          );
          createPayload.permissions = acl.getPermissions();
        }
      }

      createPayload.dataSources = settings.dataSources;
      createPayload.dataConnections = settings.dataConnections;

      const result = await client.create(
        {
          request: req,
        },
        createPayload
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
          attributes: updateWorkspaceAttributesSchema,
          settings: settingsSchema,
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const { id } = req.params;
      const { attributes, settings } = req.body;

      const result = await client.update(
        {
          request: req,
        },
        id,
        {
          ...attributes,
          ...(isPermissionControlEnabled ? { permissions: settings.permissions } : {}),
          ...{ dataSources: settings.dataSources },
          ...{ dataConnections: settings.dataConnections },
        }
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
          request: req,
        },
        id
      );
      return res.ok({ body: result });
    })
  );

  router.post(
    {
      path: `${WORKSPACES_API_BASE_URL}/_associate`,
      validate: {
        body: schema.object({
          workspaceId: schema.string(),
          savedObjects: schema.arrayOf(
            schema.object({ id: schema.string(), type: schema.string() })
          ),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const { workspaceId, savedObjects } = req.body;

      const result = await client.associate(
        {
          request: req,
        },
        workspaceId,
        savedObjects
      );
      return res.ok({ body: result });
    })
  );

  router.post(
    {
      path: `${WORKSPACES_API_BASE_URL}/_dissociate`,
      validate: {
        body: schema.object({
          workspaceId: schema.string(),
          savedObjects: schema.arrayOf(
            schema.object({ id: schema.string(), type: schema.string() })
          ),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const { workspaceId, savedObjects } = req.body;

      const result = await client.dissociate(
        {
          request: req,
        },
        workspaceId,
        savedObjects
      );
      return res.ok({ body: result });
    })
  );

  router.post(
    {
      path: `${WORKSPACES_API_BASE_URL}/_semantic_search`,
      validate: {
        body: schema.object({
          query: schema.string(),
          links: schema.arrayOf(
            schema.object({
              id: schema.string(),
              title: schema.string(),
              description: schema.maybe(schema.string()),
            })
          ),
        }),
      },
    },
    async (context, req, res) => {
      try {
        const { query, links } = req.body;

        // Filter links to ensure they have a description for the semantic search
        let linksWithDescription = links.filter((link) => !!link.description);
        linksWithDescription = Array.from(new Set(linksWithDescription.map((link) => link.id))).map(
          (id) => linksWithDescription.find((link) => link.id === id)!
        );

        console.log('-------------Enter semanticSearch (Node.js)-------------');

        // Load the model only once and reuse it later
        if (!semanticExtractor) {
          console.log('Model not yet loaded. Initializing pipeline...');
          const startTime = performance.now();
          semanticExtractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
            progress_callback: (args: any) => {
              if (args.status === 'progress') {
                console.log(`[Node.js Model Loading] ${args.file}: ${args.progress.toFixed(2)}%`);
              } else if (args.status === 'done') {
                console.log(`[Node.js Model Loading] Finished loading ${args.file}.`);
              }
            },
          });
          const endTime = performance.now();
          const loadingTimeMs = endTime - startTime;

          console.log('[Node.js] Model loaded and ready for inference.');
          console.log(`Model loading took: ${loadingTimeMs.toFixed(2)} ms`);
        } else {
          console.log('[Node.js] Model already loaded. Reusing existing pipeline.');
        }

        // Generate embeddings for links
        const linkEmbeddings = await Promise.all(
          linksWithDescription.map(async (link) => {
            const output = await semanticExtractor(link.title + link.description || '', {
              pooling: 'mean',
              normalize: true,
            });
            return { ...link, embedding: Array.from(output.data) };
          })
        );

        // Generate embedding for the query
        const queryEmbedding = Array.from(
          (await semanticExtractor(query, { pooling: 'mean', normalize: true })).data
        );

        // Calculate scores and sort
        const scored = linkEmbeddings.map((link) => ({
          ...link,
          // score: cosineSimilarity(queryEmbedding as number[], link.embedding as number[]),
          score: cos_sim(queryEmbedding as number[], link.embedding as number[]),
        }));

        scored.sort((a, b) => b.score - a.score);

        const semanticSearchResult = scored
          .slice(0, 8)
          .filter((item) => item.score > 0.08)
          .map(({ embedding, ...rest }) => rest);
        console.log('semanticSearchResult: ', semanticSearchResult);

        return res.ok({ body: semanticSearchResult });
      } catch (error) {
        console.error('Error during semantic search:', error);
        return res.badRequest({
          body: { message: 'Failed to perform semantic search' },
        });
      }
    }
  );

  // duplicate saved objects among workspaces
  registerDuplicateRoute(router, logger, client, maxImportExportSize, isDataSourceEnabled);
}
