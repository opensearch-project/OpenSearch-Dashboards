/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IUiSettingsClient, WorkspaceAttribute } from 'src/core/server';

import * as osdTestServer from '../../../../../core/test_helpers/osd_server';
import { httpServerMock } from '../../../../../core/server/mocks';
import { UiSettingScope } from '../../../../../core/server/types';

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
    await globalUiSettingsClient.set('defaultDatasource', 'global-ds', UiSettingScope.GLOBAL);
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

    expect(await globalUiSettingsClient.get('defaultDatasource', UiSettingScope.GLOBAL)).toBe(
      'global-ds'
    );

    // workspace defaultIndex is not set, it will not use the global value
    expect(
      await workspaceScopedUiSettingsClient.get('defaultDatasource', UiSettingScope.WORKSPACE)
    ).toBeUndefined();

    // update ui settings in a workspace
    await workspaceScopedUiSettingsClient.set(
      'defaultDatasource',
      'workspace-ds',
      UiSettingScope.WORKSPACE
    );

    // global ui settings remain unchanged
    expect(await globalUiSettingsClient.get('defaultDatasource', UiSettingScope.GLOBAL)).toBe(
      'global-ds'
    );

    // workspace ui settings updated to the new value
    expect(
      await workspaceScopedUiSettingsClient.get('defaultDatasource', UiSettingScope.WORKSPACE)
    ).toBe('workspace-ds');
  });

  it('should get and update global ui settings when currently not in a workspace', async () => {
    expect(await globalUiSettingsClient.get('defaultDatasource', UiSettingScope.GLOBAL)).toBe(
      'global-ds'
    );

    await globalUiSettingsClient.set('defaultDatasource', 'global-ds-new', UiSettingScope.GLOBAL);
    expect(await globalUiSettingsClient.get('defaultDatasource', UiSettingScope.GLOBAL)).toBe(
      'global-ds-new'
    );
  });
});
