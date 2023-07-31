/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter } from '../../../http';
import { SavedObjectsPermissionControlContract } from '../client';

export const registerListRoute = (
  router: IRouter,
  permissionControl: SavedObjectsPermissionControlContract
) => {
  router.post(
    {
      path: '/principles',
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
      const result = await permissionControl.getPrinciplesOfObjects(req, req.body.objects);
      return res.ok({ body: result });
    })
  );
};
