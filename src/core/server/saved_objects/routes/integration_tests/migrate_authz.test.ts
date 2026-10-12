/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import supertest from 'supertest';
import { UnwrapPromise } from '@osd/utility-types';
import { registerMigrateRoute } from '../migrate';
import { setupServer } from '../test_utils';
import { dynamicConfigServiceMock } from '../../../config/dynamic_config_service.mock';
import { loggingSystemMock } from '../../../logging/logging_system.mock';
import { mockOpenSearchDashboardsMigrator } from '../../migrations/opensearch_dashboards/opensearch_dashboards_migrator.mock';
import { AuthenticationHandler } from '../../../http';

type SetupServerReturn = UnwrapPromise<ReturnType<typeof setupServer>>;

describe('POST /internal/saved_objects/_migrate authorization', () => {
  let server: SetupServerReturn['server'];
  let httpSetup: SetupServerReturn['httpSetup'];
  let migrator: ReturnType<typeof mockOpenSearchDashboardsMigrator.create>;

  const startServer = async (authHandler?: AuthenticationHandler) => {
    ({ server, httpSetup } = await setupServer());
    migrator = mockOpenSearchDashboardsMigrator.create();

    const router = httpSetup.createRouter('/internal/saved_objects/');
    registerMigrateRoute(router, Promise.resolve(migrator), {
      auth: httpSetup.auth,
      adminRoles: ['all_access'],
      logger: loggingSystemMock.createLogger(),
    });
    if (authHandler) {
      await httpSetup.registerAuth(authHandler);
    }

    const dynamicConfigService = dynamicConfigServiceMock.createInternalStartContract();
    await server.start({ dynamicConfigService });
  };

  const withRoles =
    (roles: string[]): AuthenticationHandler =>
    (req, res, toolkit) =>
      toolkit.authenticated({ state: { authInfo: { user_name: 'user', roles } } });

  const migrate = () =>
    supertest(httpSetup.server.listener).post('/internal/saved_objects/_migrate').send({});

  afterEach(async () => {
    await server.stop();
  });

  it('allows the request when no auth provider is registered', async () => {
    await startServer();

    await migrate().expect(200);
    expect(migrator.runMigrations).toHaveBeenCalledWith({ rerun: true });
  });

  it('allows a user with an admin role', async () => {
    await startServer(withRoles(['own_index', 'all_access']));

    await migrate().expect(200);
    expect(migrator.runMigrations).toHaveBeenCalledTimes(1);
  });

  it('rejects a user without an admin role', async () => {
    await startServer(withRoles(['own_index', 'opensearch_dashboards_user']));

    await migrate().expect(403);
    expect(migrator.runMigrations).not.toHaveBeenCalled();
  });

  it('rejects an authenticated request without role information', async () => {
    await startServer((req, res, toolkit) => toolkit.authenticated());

    await migrate().expect(403);
    expect(migrator.runMigrations).not.toHaveBeenCalled();
  });

  it('rejects a second request while a migration is in progress', async () => {
    await startServer(withRoles(['all_access']));
    let finishMigration: () => void = () => {};
    migrator.runMigrations.mockImplementationOnce(
      () => new Promise((resolve) => (finishMigration = () => resolve([])))
    );

    const first = migrate().then((res) => res);
    // wait until the first request reaches the migrator
    while (migrator.runMigrations.mock.calls.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, 5));
    }

    await migrate().expect(409);
    finishMigration();
    expect((await first).status).toBe(200);
    expect(migrator.runMigrations).toHaveBeenCalledTimes(1);

    await migrate().expect(200);
    expect(migrator.runMigrations).toHaveBeenCalledTimes(2);
  });
});
