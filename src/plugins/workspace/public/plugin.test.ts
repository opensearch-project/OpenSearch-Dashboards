/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { workspaceClientMock, WorkspaceClientMock } from './workspace_client.mock';
import { chromeServiceMock, coreMock } from '../../../core/public/mocks';
import { WorkspacePlugin } from './plugin';

describe('Workspace plugin', () => {
  const getSetupMock = () => ({
    ...coreMock.createSetup(),
    chrome: chromeServiceMock.createSetupContract(),
  });
  beforeEach(() => {
    WorkspaceClientMock.mockClear();
    Object.values(workspaceClientMock).forEach((item) => item.mockClear());
  });
  it('#setup', async () => {
    const setupMock = getSetupMock();
    const workspacePlugin = new WorkspacePlugin();
    await workspacePlugin.setup(setupMock);
    expect(WorkspaceClientMock).toBeCalledTimes(1);
  });

  it('#call savedObjectsClient.setCurrentWorkspace when current workspace id changed', () => {
    const workspacePlugin = new WorkspacePlugin();
    const coreStart = coreMock.createStart();
    workspacePlugin.start(coreStart);
    coreStart.workspaces.currentWorkspaceId$.next('foo');
    expect(coreStart.savedObjects.client.setCurrentWorkspace).toHaveBeenCalledWith('foo');
  });

  it('#setup when workspace id is in url and enterWorkspace return error', async () => {
    const windowSpy = jest.spyOn(window, 'window', 'get');
    windowSpy.mockImplementation(
      () =>
        ({
          location: {
            href: 'http://localhost/w/workspaceId/app',
          },
        } as any)
    );
    const setupMock = getSetupMock();

    const workspacePlugin = new WorkspacePlugin();
    await workspacePlugin.setup(setupMock);
    expect(setupMock.workspaces.currentWorkspaceId$.getValue()).toEqual('workspaceId');
    windowSpy.mockRestore();
  });
});
