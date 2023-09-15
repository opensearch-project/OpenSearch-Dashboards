/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter } from '../../../../../core/server';
import { SavedObjectsPermissionControlContract } from '../client';
import { WORKSPACES_API_BASE_URL } from '../../routes';

export const registerListRoute = (
  router: IRouter,
  permissionControl: SavedObjectsPermissionControlContract
) => {
  router.post(
    {
      path: `${WORKSPACES_API_BASE_URL}/principals`,
      validate: {
        body: schema.object({
          objects: schema.arrayOf(
            schema.object({
              type: schema.string(),
              id: schema.string(),
            })
          ),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const result = await permissionControl.getPrincipalsOfObjects(req, req.body.objects);
      return res.ok({ body: result });
    })
  );
};
