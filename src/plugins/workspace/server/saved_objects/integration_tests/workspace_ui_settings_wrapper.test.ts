/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IUiSettingsClient, WorkspaceAttribute } from 'src/core/server';

import * as osdTestServer from '../../../../../core/test_helpers/osd_server';
import { httpServerMock } from '../../../../../core/server/mocks';
import * as utilsExports from '../../../../../core/server/utils/auth_info';
import { SavedObjectsErrorHelpers } from '../../../../../core/server';

describe('workspace ui settings saved object client wrapper', () => {
  let opensearchServer: osdTestServer.TestOpenSearchUtils;
  let osd: osdTestServer.TestOpenSearchDashboardsUtils;
  let globalUiSettingsClient: IUiSettingsClient;
  let testWorkspace: WorkspaceAttribute = {
    id: '',
    name: '',
  };

  beforeAll(async () => {
    const servers = osdTestServer.createTestServers({
      adjustTimeout: (t: number) => jest.setTimeout(t),
      settings: {
        osd: {
          workspace: {
            enabled: true,
          },
          savedObjects: {
            permission: {
              enabled: true,
            },
          },
          migrations: {
            skip: false,
          },
        },
      },
    });
    opensearchServer = await servers.startOpenSearch();
    osd = await servers.startOpenSearchDashboards();

    const savedObjectsClient = osd.coreStart.savedObjects.getScopedClient(
      httpServerMock.createOpenSearchDashboardsRequest()
    );
    globalUiSettingsClient = osd.coreStart.uiSettings.asScopedToClient(savedObjectsClient);

    const res = await osdTestServer.request.post(osd.root, '/api/workspaces').send({
      attributes: { name: 'test workspace', features: ['use-case-all'] },
    });
    testWorkspace = res.body.result;
  }, 30000);

  afterAll(async () => {
    await opensearchServer.stop();
    await osd.stop();
  }, 30000);

  beforeEach(async () => {
    await globalUiSettingsClient.set('defaultIndex', 'global-index');
  });

  it('should get and update workspace ui settings when currently in a workspace', async () => {
    const workspaceScopedSavedObjectsClient = osd.coreStart.savedObjects.getScopedClient(
      httpServerMock.createOpenSearchDashboardsRequest({
        opensearchDashboardsRequestState: { requestWorkspaceId: testWorkspace.id },
      })
    );
    const workspaceScopedUiSettingsClient = osd.coreStart.uiSettings.asScopedToClient(
      workspaceScopedSavedObjectsClient
    );

    expect(await globalUiSettingsClient.get('defaultIndex')).toBe('global-index');

    // workspace defaultIndex is not set, it will not use the global value
    expect(await workspaceScopedUiSettingsClient.get('defaultIndex')).toBeUndefined();

    // update ui settings in a workspace
    await workspaceScopedUiSettingsClient.set('defaultIndex', 'workspace-index');

    // global ui settings remain unchanged
    expect(await globalUiSettingsClient.get('defaultIndex')).toBe('global-index');

    // workspace ui settings updated to the new value
    expect(await workspaceScopedUiSettingsClient.get('defaultIndex')).toBe('workspace-index');
  });

  it('should get and update global ui settings when currently not in a workspace', async () => {
    expect(await globalUiSettingsClient.get('defaultIndex')).toBe('global-index');

    await globalUiSettingsClient.set('defaultIndex', 'global-index-new');
    expect(await globalUiSettingsClient.get('defaultIndex')).toBe('global-index-new');
  });

  describe('default index pattern', () => {
    const workspaceId = 'test-1';
    let internalSavedObjectsRepository;

    beforeAll(async () => {
      internalSavedObjectsRepository = osd.coreStart.savedObjects.createInternalRepository([
        'workspace',
      ]);
    });

    beforeEach(async () => {
      await internalSavedObjectsRepository.create(
        'workspace',
        {
          name: 'test default index workspace',
          features: ['use-case-all'],
          uiSettings: {
            defaultIndex: 'index-pattern-1',
          },
        },
        {
          id: workspaceId,
          permissions: {
            write: { users: ['foo'] },
            library_write: { users: ['foo'] },
            read: { users: ['bar'] },
            library_read: { users: ['bar'] },
          },
          overwrite: true,
        }
      );
      await internalSavedObjectsRepository.create(
        'index-pattern',
        {},
        {
          id: 'index-pattern-1',
          workspaces: [workspaceId],
          overwrite: true,
        }
      );
    });

    it('should not able to delete default index pattern if not permitted', async () => {
      const notPermittedRequest = httpServerMock.createOpenSearchDashboardsRequest();

      jest.spyOn(utilsExports, 'getPrincipalsFromRequest').mockImplementation((request) => {
        if (request === notPermittedRequest) {
          return { users: ['bar'] };
        }
        return { users: ['foo'] };
      });

      const notPermittedSavedObjectedClient = osd.coreStart.savedObjects.getScopedClient(
        notPermittedRequest
      );

      let error;
      try {
        await notPermittedSavedObjectedClient.delete('index-pattern', 'index-pattern-1');
      } catch (e) {
        error = e;
      }
      expect(SavedObjectsErrorHelpers.isBadRequestError(error)).toBeTruthy();
    });

    it('should not able to delete default index pattern if permitted', async () => {
      const savedObjectsClient = osd.coreStart.savedObjects.getScopedClient(
        httpServerMock.createOpenSearchDashboardsRequest()
      );

      jest.spyOn(utilsExports, 'getPrincipalsFromRequest').mockImplementation((request) => {
        return { users: ['foo'] };
      });

      let error;
      try {
        await savedObjectsClient.delete('index-pattern', 'index-pattern-1');
      } catch (e) {
        error = e;
      }
      expect(error).toBeUndefined();

      try {
        await savedObjectsClient.get('index-pattern', 'index-pattern-1');
      } catch (e) {
        error = e;
      }
      expect(SavedObjectsErrorHelpers.isNotFoundError(error)).toBeTruthy();
    });
  });
});
