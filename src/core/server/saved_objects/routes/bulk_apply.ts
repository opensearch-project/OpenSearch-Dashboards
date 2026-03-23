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

interface ApplyResult {
  type: string;
  id: string;
  status: 'created' | 'updated' | 'unchanged' | 'error';
  error?: string;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (typeof a === 'object' && typeof b === 'object') {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, idx) => deepEqual(val, b[idx]));
    }
    if (Array.isArray(a) || Array.isArray(b)) return false;
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) => deepEqual(aObj[key], bObj[key]));
  }
  return false;
}

export const registerBulkApplyRoute = (router: IRouter) => {
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
              references: schema.maybe(
                schema.arrayOf(
                  schema.object({
                    name: schema.string(),
                    type: schema.string(),
                    id: schema.string(),
                  })
                )
              ),
            })
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
      const results: ApplyResult[] = [];

      // Bulk get existing objects to determine which exist
      const bulkGetInput = resources.map(({ type, id }) => ({ type, id }));
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

      for (const resource of resources) {
        const key = `${resource.type}:${resource.id}`;
        const existing = existingObjects.get(key);

        try {
          if (existing === undefined) {
            // Object doesn't exist - create it
            if (!dryRun) {
              await savedObjectsClient.create(resource.type, resource.attributes, {
                id: resource.id,
                references: resource.references,
                overwrite: false,
              });
            }
            results.push({ type: resource.type, id: resource.id, status: 'created' });
          } else if (deepEqual(existing, resource.attributes)) {
            // Object exists and attributes are identical
            results.push({ type: resource.type, id: resource.id, status: 'unchanged' });
          } else if (overwrite) {
            // Object exists and attributes differ - update it
            if (!dryRun) {
              await savedObjectsClient.update(resource.type, resource.id, resource.attributes, {
                references: resource.references,
              });
            }
            results.push({ type: resource.type, id: resource.id, status: 'updated' });
          } else {
            results.push({
              type: resource.type,
              id: resource.id,
              status: 'error',
              error: 'Object already exists and overwrite is disabled',
            });
          }
        } catch (e) {
          results.push({
            type: resource.type,
            id: resource.id,
            status: 'error',
            error: e.message || 'Unknown error',
          });
        }
      }

      return res.ok({ body: { results } });
    })
  );
};
