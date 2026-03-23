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

import { schema } from '@osd/config-schema';
import { IRouter } from '../../http';
import { SavedObjectConfig } from '../saved_objects_config';
import { deepEqual, resolveDependencyOrder } from './utils';

interface ApplyResult {
  type: string;
  id: string;
  status: 'created' | 'updated' | 'unchanged' | 'error';
  error?: string;
}

export const registerBulkApplyRoute = (router: IRouter, config: SavedObjectConfig) => {
  const { maxImportExportSize } = config;

  router.post(
    {
      path: '/_bulk_apply',
      validate: {
        body: schema.object({
          resources: schema.arrayOf(
            schema.object({
              type: schema.string(),
              id: schema.string(),
              attributes: schema.recordOf(schema.string(), schema.any()),
              labels: schema.maybe(schema.recordOf(schema.string(), schema.string())),
              references: schema.maybe(
                schema.arrayOf(
                  schema.object({
                    name: schema.string(),
                    type: schema.string(),
                    id: schema.string(),
                  })
                )
              ),
            }),
            { maxSize: maxImportExportSize }
          ),
          options: schema.maybe(
            schema.object({
              dryRun: schema.boolean({ defaultValue: false }),
              overwrite: schema.boolean({ defaultValue: true }),
            })
          ),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const { resources, options } = req.body;
      const dryRun = options?.dryRun ?? false;
      const overwrite = options?.overwrite ?? true;
      const savedObjectsClient = context.core.savedObjects.client;

      // Phase 1: Validate all resources (schema validation is handled by the route schema above)
      const validationErrors: ApplyResult[] = [];
      for (const resource of resources) {
        if (!resource.type || !resource.id) {
          validationErrors.push({
            type: resource.type,
            id: resource.id,
            status: 'error',
            error: 'Missing required fields: type and id',
          });
        }
      }

      // If any validation errors, return 400 without writing anything
      if (validationErrors.length > 0) {
        return res.badRequest({
          body: {
            message: 'Validation failed for one or more resources',
            errors: validationErrors,
          },
        });
      }

      // Phase 1.5: Resolve dependency order using topological sort
      const dependencyResult = resolveDependencyOrder(resources);
      if (dependencyResult.circular) {
        return res.badRequest({
          body: {
            message: 'Circular dependency detected among resources',
            circular: dependencyResult.circular,
          },
        });
      }
      const orderedResources = dependencyResult.ordered as typeof resources;

      // Phase 2: Bulk get existing objects to determine which exist
      const bulkGetInput = orderedResources.map(({ type, id }) => ({ type, id }));
      let existingObjects: Map<string, Record<string, unknown>> = new Map();

      try {
        const bulkGetResult = await savedObjectsClient.bulkGet(bulkGetInput);
        for (const savedObject of bulkGetResult.saved_objects) {
          if (!savedObject.error) {
            existingObjects.set(
              `${savedObject.type}:${savedObject.id}`,
              (savedObject.attributes as Record<string, unknown>) || {}
            );
          }
        }
      } catch (e) {
        // If bulk get fails entirely, treat all as new
        existingObjects = new Map();
      }

      // Phase 3: Compute per-resource actions and check for overwrite conflicts
      const results: ApplyResult[] = [];
      const objectsToWrite: Array<{
        type: string;
        id: string;
        attributes: Record<string, unknown>;
        references?: Array<{ name: string; type: string; id: string }>;
      }> = [];
      const writeIndexToResultIndex: Map<number, number> = new Map();
      let hasErrors = false;

      for (let i = 0; i < orderedResources.length; i++) {
        const resource = orderedResources[i];
        const key = `${resource.type}:${resource.id}`;
        const existing = existingObjects.get(key);

        // Always set/preserve the managed-by label for resources applied via _bulk_apply.
        // This marks the object as code-managed so the UI and standard CRUD routes can
        // enforce the read-only lock (see managed_lock.ts).
        const labels = { ...resource.labels, 'managed-by': 'osdctl' };
        const attributesWithLabels = { ...resource.attributes, labels };

        if (existing === undefined) {
          // Object doesn't exist - will create
          results.push({ type: resource.type, id: resource.id, status: 'created' });
          writeIndexToResultIndex.set(objectsToWrite.length, i);
          objectsToWrite.push({
            type: resource.type,
            id: resource.id,
            attributes: attributesWithLabels,
            references: resource.references,
          });
        } else if (deepEqual(existing, attributesWithLabels)) {
          // Object exists and attributes are identical
          results.push({ type: resource.type, id: resource.id, status: 'unchanged' });
        } else if (overwrite) {
          // Object exists and attributes differ - will update
          results.push({ type: resource.type, id: resource.id, status: 'updated' });
          writeIndexToResultIndex.set(objectsToWrite.length, i);
          objectsToWrite.push({
            type: resource.type,
            id: resource.id,
            attributes: attributesWithLabels,
            references: resource.references,
          });
        } else {
          // Overwrite disabled and object exists with different attributes
          hasErrors = true;
          results.push({
            type: resource.type,
            id: resource.id,
            status: 'error',
            error: 'Object already exists and overwrite is disabled',
          });
        }
      }

      // If any errors during planning, return 400 without writing anything (atomic)
      if (hasErrors) {
        return res.badRequest({
          body: {
            message: 'Apply failed: one or more resources had errors',
            results,
          },
        });
      }

      // Phase 4: Write all at once using bulkCreate (skip if dry-run or nothing to write)
      if (!dryRun && objectsToWrite.length > 0) {
        const bulkCreateObjects = objectsToWrite.map((obj) => ({
          type: obj.type,
          id: obj.id,
          attributes: obj.attributes,
          ...(obj.references ? { references: obj.references } : {}),
        }));

        const bulkCreateResult = await savedObjectsClient.bulkCreate(bulkCreateObjects, {
          overwrite: true,
        });

        // Check for per-object errors from bulkCreate
        for (let wi = 0; wi < bulkCreateResult.saved_objects.length; wi++) {
          const savedObj = bulkCreateResult.saved_objects[wi];
          const resultIdx = writeIndexToResultIndex.get(wi);
          if (resultIdx !== undefined && savedObj.error) {
            results[resultIdx] = {
              type: savedObj.type,
              id: savedObj.id,
              status: 'error',
              error: savedObj.error.message || 'Unknown error',
            };
          }
        }
      }

      return res.ok({ body: { results } });
    })
  );
};
