/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpServiceSetup } from '../../../../../core/server';
import { SavedObjectsPermissionControlContract } from '../client';
import { registerListRoute } from './principals';
import { registerValidateRoute } from './validate';

export function registerPermissionCheckRoutes({
  http,
  permissionControl,
}: {
  http: HttpServiceSetup;
  permissionControl: SavedObjectsPermissionControlContract;
}) {
  const router = http.createRouter();

  registerValidateRoute(router, permissionControl);
  registerListRoute(router, permissionControl);
}
