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

import { httpServerMock } from 'opensearch-dashboards/server/mocks';
import { updateWorkspaceState } from 'opensearch-dashboards/server/utils';
import * as utilsExports from 'opensearch-dashboards/server/utils/auth_info';
import { ISavedObjectsRepository, SavedObjectsClientContract } from 'opensearch-dashboards/server';
import {
  createRootWithCorePlugins,
  createTestServers,
  getOsdServer,
  TestOpenSearchDashboardsUtils,
  TestOpenSearchUtils,
} from '../../../test_helpers/osd_server';

interface TestServices {
  opensearchServer: TestOpenSearchUtils;
  osd: TestOpenSearchDashboardsUtils;
  osdServer: TestOpenSearchDashboardsUtils['osdServer'];
  savedObjectsClient: SavedObjectsClientContract;
  savedObjectsRepository: ISavedObjectsRepository;
}

export function docPermissionControlledSuite() {
  const settings = {
    opensearchDashboards: {
      dashboardAdmin: {
        users: ['dashboard_admin'],
      },
    },
    savedObjects: {
      permission: {
        enabled: true,
      },
    },
    workspace: {
      enabled: true,
    },
  };

  const startOpenSearchDashboards = async ({ isDashboardAdmin }: { isDashboardAdmin: boolean }) => {
    const root = createRootWithCorePlugins(settings);

    const coreSetup = await root.setup();
    coreSetup.http.registerOnPostAuth((request, response, t) => {
      updateWorkspaceState(request, { isDashboardAdmin });
      return t.next();
    });
    const coreStart = await root.start();
    const osdServer = getOsdServer(root);

    return {
      root,
      osdServer,
      coreStart,
      stop: async () => await root.shutdown(),
    };
  };

  const setup = async ({ isDashboardAdmin }: { isDashboardAdmin: boolean }) => {
    const servers = createTestServers({
      adjustTimeout: (t) => jest.setTimeout(t),
      settings: {
        osd: settings,
      },
    });
    const osd = await startOpenSearchDashboards({ isDashboardAdmin });
    const opensearchServer = await servers.startOpenSearch();
    const savedObjectsClient = osd.coreStart.savedObjects.getScopedClient(
      httpServerMock.createOpenSearchDashboardsRequest()
    );
    const savedObjectsRepository = osd.coreStart.savedObjects.createInternalRepository();

    jest.spyOn(utilsExports, 'getPrincipalsFromRequest').mockImplementation((request) => {
      if (isDashboardAdmin) {
        return { users: ['dashboard_admin'] };
      }
      return {
        users: ['foo'],
      };
    });

    return {
      opensearchServer,
      osd,
      osdServer: osd.osdServer,
      savedObjectsClient,
      savedObjectsRepository,
    };
  };

  describe('permission controlled settings with dashboard admin', () => {
    let services: TestServices;

    beforeAll(async () => {
      services = await setup({ isDashboardAdmin: true });
    });

    afterEach(async () => {
      await services.savedObjectsRepository.delete('config', '_dashboard_admin');
    });

    afterAll(async () => {
      await services.opensearchServer.stop();
      await services.osd.stop();
    });

    it('create should be allowed when the user is dashboard admin', async () => {
      const { osdServer } = services;

      const { statusCode, result } = await osdServer.inject({
        method: 'POST',
        url: '/api/opensearch-dashboards/settings?scope=dashboard_admin',
        payload: {
          changes: {
            'securitySetting.test': 'test-value',
          },
        },
      });

      expect(statusCode).toBe(200);
      expect(result).toEqual({
        settings: {
          'securitySetting.test': { userValue: 'test-value' },
        },
      });
    });

    it('update should be allowed when the user is dashboard admin', async () => {
      const { osdServer, savedObjectsRepository } = services;

      await savedObjectsRepository.create(
        'config',
        {
          'securitySetting.test': 'test-value',
        },
        {
          id: '_dashboard_admin',
          permissions: {
            read: { users: ['*'] },
          },
        }
      );

      const { statusCode, result } = await osdServer.inject({
        method: 'POST',
        url: '/api/opensearch-dashboards/settings?scope=dashboard_admin',
        payload: {
          changes: {
            'securitySetting.test': 'admin-value',
          },
        },
      });

      expect(statusCode).toBe(200);
      expect(result).toEqual({
        settings: {
          'securitySetting.test': { userValue: 'admin-value' },
        },
      });
    });

    it('get should be allow allowed when the user is dashboard admin', async () => {
      const { osdServer, savedObjectsRepository } = services;

      await savedObjectsRepository.create(
        'config',
        {
          'securitySetting.test': 'admin-value',
        },
        {
          id: '_dashboard_admin',
          permissions: {
            read: { users: ['*'] },
          },
        }
      );

      const { statusCode, result } = await osdServer.inject({
        method: 'GET',
        url: '/api/opensearch-dashboards/settings',
      });

      expect(statusCode).toBe(200);
      expect(result).toEqual({
        settings: {
          buildNum: { userValue: expect.any(Number) },
          'securitySetting.test': { userValue: 'admin-value' },
        },
      });
    });
  });

  describe('permission controlled settings with non-dashboard admin', () => {
    let services: TestServices;

    beforeAll(async () => {
      services = await setup({ isDashboardAdmin: false });
    });

    afterAll(async () => {
      await services.opensearchServer.stop();
      await services.osd.stop();
    });

    it('create should returns 403 when the user is not dashboard admin', async () => {
      const { osdServer } = services;

      const { statusCode, result } = await osdServer.inject({
        method: 'POST',
        url: '/api/opensearch-dashboards/settings?scope=dashboard_admin',
        payload: {
          changes: {
            'securitySetting.test': 'test-value',
          },
        },
      });

      expect(statusCode).toBe(403);
      expect(result).toEqual({
        error: 'Forbidden',
        message: 'No permission for admin UI settings operations',
        statusCode: 403,
      });
    });

    it('update should returns 403 when the user is not dashboard admin', async () => {
      const { osdServer, savedObjectsRepository } = services;

      await savedObjectsRepository.create(
        'config',
        {
          'securitySetting.test': 'test-value',
        },
        {
          id: '_dashboard_admin',
          permissions: {
            read: { users: ['*'] },
          },
          overwrite: true,
        }
      );

      const { statusCode, result } = await osdServer.inject({
        method: 'POST',
        url: '/api/opensearch-dashboards/settings?scope=dashboard_admin',
        payload: {
          changes: {
            'securitySetting.test': 'test-value',
          },
        },
      });

      expect(statusCode).toBe(403);
      expect(result).toEqual({
        error: 'Forbidden',
        message: 'Invalid saved objects permission',
        statusCode: 403,
      });
    });

    it('get should be allow allowed when the user is not dashboard admin', async () => {
      const { osdServer, savedObjectsRepository } = services;

      await savedObjectsRepository.create(
        'config',
        {
          'securitySetting.test': 'test-value',
        },
        {
          id: '_dashboard_admin',
          permissions: {
            read: { users: ['*'] },
          },
          overwrite: true,
        }
      );

      const { statusCode, result } = await osdServer.inject({
        method: 'GET',
        url: '/api/opensearch-dashboards/settings',
      });

      expect(statusCode).toBe(200);
      expect(result).toEqual({
        settings: {
          buildNum: { userValue: expect.any(Number) },
          'securitySetting.test': { userValue: 'test-value' },
        },
      });
    });
  });
}
