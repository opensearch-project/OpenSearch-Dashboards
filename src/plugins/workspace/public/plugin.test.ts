/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { waitFor } from '@testing-library/dom';
import { workspaceClientMock, WorkspaceClientMock } from './workspace_client.mock';
import { applicationServiceMock, chromeServiceMock, coreMock } from '../../../core/public/mocks';
import { WorkspacePlugin } from './plugin';
import { WORKSPACE_FATAL_ERROR_APP_ID, WORKSPACE_OVERVIEW_APP_ID } from '../common/constants';
import { Observable, Subscriber } from 'rxjs';
import { savedObjectsManagementPluginMock } from '../../saved_objects_management/public/mocks';

describe('Workspace plugin', () => {
  beforeEach(() => {
    WorkspaceClientMock.mockClear();
    Object.values(workspaceClientMock).forEach((item) => item.mockClear());
  });
  it('#setup', async () => {
    const setupMock = coreMock.createSetup();
    const savedObjectManagementSetupMock = savedObjectsManagementPluginMock.createSetupContract();
    const workspacePlugin = new WorkspacePlugin();
    await workspacePlugin.setup(setupMock, {
      savedObjectsManagement: savedObjectManagementSetupMock,
    });
    expect(setupMock.application.register).toBeCalledTimes(4);
    expect(WorkspaceClientMock).toBeCalledTimes(1);
    expect(workspaceClientMock.enterWorkspace).toBeCalledTimes(0);
    expect(savedObjectManagementSetupMock.columns.register).toBeCalledTimes(1);
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
    workspaceClientMock.enterWorkspace.mockResolvedValue({
      success: false,
      error: 'error',
    });
    const setupMock = coreMock.createSetup();
    const applicationStartMock = applicationServiceMock.createStartContract();
    const chromeStartMock = chromeServiceMock.createStartContract();
    setupMock.getStartServices.mockImplementation(() => {
      return Promise.resolve([
        {
          application: applicationStartMock,
          chrome: chromeStartMock,
        },
        {},
        {},
      ]) as any;
    });

    const workspacePlugin = new WorkspacePlugin();
    await workspacePlugin.setup(setupMock, {
      savedObjectsManagement: savedObjectsManagementPluginMock.createSetupContract(),
    });
    expect(setupMock.application.register).toBeCalledTimes(4);
    expect(WorkspaceClientMock).toBeCalledTimes(1);
    expect(workspaceClientMock.enterWorkspace).toBeCalledWith('workspaceId');
    expect(setupMock.getStartServices).toBeCalledTimes(1);
    await waitFor(
      () => {
        expect(applicationStartMock.navigateToApp).toBeCalledWith(WORKSPACE_FATAL_ERROR_APP_ID, {
          replace: true,
          state: {
            error: 'error',
          },
        });
      },
      {
        container: document.body,
      }
    );
    windowSpy.mockRestore();
  });

  it('#setup when workspace id is in url and enterWorkspace return success', async () => {
    const windowSpy = jest.spyOn(window, 'window', 'get');
    windowSpy.mockImplementation(
      () =>
        ({
          location: {
            href: 'http://localhost/w/workspaceId/app',
          },
        } as any)
    );
    workspaceClientMock.enterWorkspace.mockResolvedValue({
      success: true,
      error: 'error',
    });
    const setupMock = coreMock.createSetup();
    const applicationStartMock = applicationServiceMock.createStartContract();
    let currentAppIdSubscriber: Subscriber<string> | undefined;
    setupMock.getStartServices.mockImplementation(() => {
      return Promise.resolve([
        {
          application: {
            ...applicationStartMock,
            currentAppId$: new Observable((subscriber) => {
              currentAppIdSubscriber = subscriber;
            }),
          },
        },
        {},
        {},
      ]) as any;
    });

    const workspacePlugin = new WorkspacePlugin();
    await workspacePlugin.setup(setupMock, {
      savedObjectsManagement: savedObjectsManagementPluginMock.createSetupContract(),
    });
    currentAppIdSubscriber?.next(WORKSPACE_FATAL_ERROR_APP_ID);
    expect(applicationStartMock.navigateToApp).toBeCalledWith(WORKSPACE_OVERVIEW_APP_ID);
    windowSpy.mockRestore();
  });

  it('#call savedObjectsClient.setCurrentWorkspace when current workspace id changed', () => {
    const workspacePlugin = new WorkspacePlugin();
    const coreStart = coreMock.createStart();
    workspacePlugin.start(coreStart);
    coreStart.workspaces.currentWorkspaceId$.next('foo');
    expect(coreStart.savedObjects.client.setCurrentWorkspace).toHaveBeenCalledWith('foo');
  });

  it('#setup register workspace dropdown menu when setup', async () => {
    const setupMock = coreMock.createSetup();
    const workspacePlugin = new WorkspacePlugin();
    await workspacePlugin.setup(setupMock, {
      savedObjectsManagement: savedObjectsManagementPluginMock.createSetupContract(),
    });
    expect(setupMock.chrome.registerCollapsibleNavHeader).toBeCalledTimes(1);
  });
});
