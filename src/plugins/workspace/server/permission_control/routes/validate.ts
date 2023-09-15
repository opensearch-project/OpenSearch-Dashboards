/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter } from '../../../../../core/server';
import { SavedObjectsPermissionControlContract } from '../client';
import { WORKSPACES_API_BASE_URL } from '../../routes';

export const registerValidateRoute = (
  router: IRouter,
  permissionControl: SavedObjectsPermissionControlContract
) => {
  router.post(
    {
      path: `${WORKSPACES_API_BASE_URL}/validate/{type}/{id}`,
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
