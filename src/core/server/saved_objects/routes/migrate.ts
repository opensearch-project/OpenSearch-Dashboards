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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { AuthStatus, IRouter, OpenSearchDashboardsRequest } from '../../http';
import { HttpAuth } from '../../http/types';
import { Logger } from '../../logging';
import { AuthInfo } from '../../utils/auth_info';
import { IOpenSearchDashboardsMigrator } from '../migrations';

interface MigrateRouteOptions {
  auth: HttpAuth;
  adminRoles: string[];
  logger: Logger;
}

/**
 * Re-running migrations reindexes the saved objects index with the internal user,
 * so it is restricted to admin roles whenever an auth provider is registered.
 * With no auth provider (status `unknown`) there are no users to tell apart.
 */
const isAllowed = (
  request: OpenSearchDashboardsRequest,
  { auth, adminRoles }: MigrateRouteOptions
): boolean => {
  const { status, state } = auth.get(request);
  if (status === AuthStatus.unknown) {
    return true;
  }
  if (status !== AuthStatus.authenticated) {
    return false;
  }
  const roles = (state as { authInfo?: AuthInfo } | undefined)?.authInfo?.roles ?? [];
  return roles.some((role) => adminRoles.includes(role));
};

export const registerMigrateRoute = (
  router: IRouter,
  migratorPromise: Promise<IOpenSearchDashboardsMigrator>,
  options: MigrateRouteOptions
) => {
  // `runMigrations({ rerun: true })` is not safe to run concurrently.
  let migrationInProgress = false;

  router.post(
    {
      path: '/_migrate',
      validate: false,
      options: {
        tags: ['access:migrateSavedObjects'],
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      if (!isAllowed(req, options)) {
        options.logger.warn('Rejected saved objects migration request from a non-admin user');
        return res.forbidden({
          body: { message: 'Re-running saved objects migrations requires an admin role' },
        });
      }
      if (migrationInProgress) {
        return res.customError({
          statusCode: 409,
          body: { message: 'A saved objects migration is already in progress' },
        });
      }

      migrationInProgress = true;
      try {
        const migrator = await migratorPromise;
        await migrator.runMigrations({ rerun: true });
      } finally {
        migrationInProgress = false;
      }
      return res.ok({
        body: {
          success: true,
        },
      });
    })
  );
};
