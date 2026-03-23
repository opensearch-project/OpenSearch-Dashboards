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
import { SavedObjectSchemaRegistry } from '../schemas/schema_registry';

/**
 * Shared schema registry instance used by both the /_validate and /_schemas routes.
 * Loads all JSON Schema definitions from disk on first access.
 */
const registry = new SavedObjectSchemaRegistry();

/** Expose the registry for use by the schemas route. */
export function getSchemaRegistry(): SavedObjectSchemaRegistry {
  return registry;
}

export const registerValidateRoute = (router: IRouter) => {
  router.post(
    {
      path: '/_validate',
      validate: {
        query: schema.object({
          mode: schema.oneOf([schema.literal('schema'), schema.literal('full')], {
            defaultValue: 'schema',
          }),
        }),
        body: schema.object({
          type: schema.string(),
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
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const { type, attributes, references } = req.body;
      const { mode } = req.query;

      // Check that the type exists in the saved objects type registry
      const typeRegistry = context.core.savedObjects.typeRegistry;
      const registeredType = typeRegistry.getType(type);
      if (!registeredType) {
        return res.badRequest({
          body: {
            message: `Unknown saved object type: ${type}`,
          },
        });
      }

      // Determine the latest version for this type
      const versions = registry.getVersions(type);
      const warnings: string[] = [];

      if (versions.length === 0) {
        warnings.push(
          `No JSON Schema registered for type "${type}". Skipping schema validation.`
        );
        return res.ok({
          body: { valid: true, warnings },
        });
      }

      // Use the latest version
      const latestVersion = versions[versions.length - 1];
      const result = registry.validate(type, latestVersion, attributes);

      // In 'full' mode, also verify that referenced saved objects exist
      if (mode === 'full' && references && references.length > 0) {
        const savedObjectsClient = context.core.savedObjects.client;
        for (const ref of references) {
          try {
            await savedObjectsClient.get(ref.type, ref.id);
          } catch (e) {
            warnings.push(
              `Referenced object "${ref.name}" (type="${ref.type}", id="${ref.id}") may not exist`
            );
          }
        }
      }

      return res.ok({
        body: {
          valid: result.valid,
          ...(result.errors.length > 0
            ? {
                errors: result.errors.map((e) => ({
                  path: e.path,
                  message: e.message,
                  schemaPath: '',
                })),
              }
            : {}),
          ...(warnings.length > 0 ? { warnings } : {}),
        },
      });
    })
  );
};
