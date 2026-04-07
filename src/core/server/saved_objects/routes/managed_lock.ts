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

/**
 * Managed-by read-only lock for Dashboards-as-Code.
 *
 * When a saved object has `attributes.labels['managed-by'] === 'osdctl'`, it is
 * considered "code-managed". The standard create/update UI routes should check for
 * this label and return a 409 Conflict with a message like:
 *
 *   "This object is managed by code. Use the `_bulk_apply` endpoint or add
 *    `?force=true` to override."
 *
 * The UI should display a warning badge on managed objects and link to the
 * emergency unlock endpoint below so operators can break the lock if needed.
 *
 * Emergency unlock endpoint:
 *   POST /api/saved_objects/_unlock/{type}/{id}
 *
 * This removes the `managed-by` label from the object, allowing normal
 * CRUD operations through the UI again.
 */

/**
 * Checks whether a saved object is managed by code.
 * Utility that can be imported by create/update routes to enforce the lock.
 */
export function isManagedByCode(attributes: Record<string, unknown>): boolean {
  const labels = attributes?.labels as Record<string, string> | undefined;
  return labels?.['managed-by'] === 'osdctl';
}

/**
 * Returns a 409 Conflict response body for managed objects.
 */
export function managedLockConflictMessage(type: string, id: string) {
  return {
    statusCode: 409,
    error: 'Conflict',
    message:
      `Saved object [${type}/${id}] is managed by code (managed-by: osdctl). ` +
      `Use the \`_bulk_apply\` endpoint to modify it, or POST to ` +
      `\`/api/saved_objects/_unlock/${type}/${id}\` to remove the lock. ` +
      `You can also add \`?force=true\` to override.`,
  };
}

/**
 * Registers the emergency unlock route:
 *   POST /api/saved_objects/_unlock/{type}/{id}
 *
 * This fetches the saved object, removes the `managed-by` key from
 * `attributes.labels`, and persists the update.
 */
export const registerManagedLockRoute = (router: IRouter) => {
  router.post(
    {
      path: '/_unlock/{type}/{id}',
      validate: {
        params: schema.object({
          type: schema.string(),
          id: schema.string(),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const { type, id } = req.params;
      const savedObjectsClient = context.core.savedObjects.client;

      // Fetch the current object
      const savedObject = await savedObjectsClient.get(type, id);
      const attributes = (savedObject.attributes as Record<string, unknown>) || {};
      const labels = (attributes.labels as Record<string, string>) || {};

      if (!labels['managed-by']) {
        return res.ok({
          body: {
            type,
            id,
            unlocked: false,
            message: 'Object is not managed by code. No lock to remove.',
          },
        });
      }

      // Remove the managed-by label.
      // We must explicitly set 'managed-by' to null because the saved objects
      // client uses OpenSearch's partial doc update, which deep-merges nested
      // objects. Simply omitting the key would leave it in place.
      const { 'managed-by': _, ...remainingLabels } = labels;
      const updatedLabels: Record<string, unknown> = { ...remainingLabels, 'managed-by': null };
      const updatedAttributes = {
        ...attributes,
        labels: updatedLabels,
      };

      // Persist the update
      await savedObjectsClient.update(type, id, updatedAttributes);

      return res.ok({
        body: {
          type,
          id,
          unlocked: true,
          message: `Lock removed. Object [${type}/${id}] is no longer managed by code.`,
        },
      });
    })
  );
};
