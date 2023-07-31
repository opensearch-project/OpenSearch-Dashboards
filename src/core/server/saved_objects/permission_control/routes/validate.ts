/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter } from '../../../http';
import { SavedObjectsPermissionControlContract } from '../client';

export const registerValidateRoute = (
  router: IRouter,
  permissionControl: SavedObjectsPermissionControlContract
) => {
  router.post(
    {
      path: '/validate/{type}/{id}',
      validate: {
        params: schema.object({
          type: schema.string(),
          id: schema.string(),
        }),
        body: schema.object({
          permissionModes: schema.arrayOf(schema.string()),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const { type, id } = req.params;
      const result = await permissionControl.validate(
        req,
        {
          type,
          id,
        },
        req.body.permissionModes
      );
      return res.ok({ body: result });
    })
  );
};
