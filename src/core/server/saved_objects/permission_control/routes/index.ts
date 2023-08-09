/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { InternalHttpServiceSetup } from '../../../http';
import { SavedObjectsPermissionControlContract } from '../client';
import { registerListRoute } from './principals';
import { registerValidateRoute } from './validate';

export function registerPermissionCheckRoutes({
  http,
  permissionControl,
}: {
  http: InternalHttpServiceSetup;
  permissionControl: SavedObjectsPermissionControlContract;
}) {
  const router = http.createRouter('/api/saved_objects_permission_control/');

  registerValidateRoute(router, permissionControl);
  registerListRoute(router, permissionControl);
}
