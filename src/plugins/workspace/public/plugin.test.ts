/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, Observable, Subscriber } from 'rxjs';
import { waitFor } from '@testing-library/dom';
import { ChromeBreadcrumb } from 'opensearch-dashboards/public';
import { workspaceClientMock, WorkspaceClientMock } from './workspace_client.mock';
import { applicationServiceMock, chromeServiceMock, coreMock } from '../../../core/public/mocks';
import { WorkspacePlugin } from './plugin';
import { WORKSPACE_FATAL_ERROR_APP_ID, WORKSPACE_OVERVIEW_APP_ID } from '../common/constants';
import { savedObjectsManagementPluginMock } from '../../saved_objects_management/public/mocks';
import { managementPluginMock } from '../../management/public/mocks';

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
    const savedObjectManagementSetupMock = savedObjectsManagementPluginMock.createSetupContract();
    const workspacePlugin = new WorkspacePlugin();
    await workspacePlugin.setup(setupMock, {
      savedObjectsManagement: savedObjectManagementSetupMock,
      management: managementPluginMock.createSetupContract(),
    });
    expect(setupMock.application.register).toBeCalledTimes(5);
    expect(WorkspaceClientMock).toBeCalledTimes(1);
    expect(savedObjectManagementSetupMock.columns.register).toBeCalledTimes(1);
  });

  it('#call savedObjectsClient.setCurrentWorkspace when current workspace id changed', async () => {
    const workspacePlugin = new WorkspacePlugin();
    const setupMock = getSetupMock();
    const coreStart = coreMock.createStart();
    await workspacePlugin.setup(setupMock, {});
    workspacePlugin.start(coreStart);
    coreStart.workspaces.currentWorkspaceId$.next('foo');
    expect(coreStart.savedObjects.client.setCurrentWorkspace).toHaveBeenCalledWith('foo');
    expect(setupMock.application.register).toBeCalledTimes(5);
    expect(WorkspaceClientMock).toBeCalledTimes(1);
    expect(workspaceClientMock.enterWorkspace).toBeCalledTimes(0);
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
    const setupMock = getSetupMock();
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
      management: managementPluginMock.createSetupContract(),
    });
    expect(setupMock.application.register).toBeCalledTimes(5);
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
    const setupMock = getSetupMock();
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
      management: managementPluginMock.createSetupContract(),
    });
    currentAppIdSubscriber?.next(WORKSPACE_FATAL_ERROR_APP_ID);
    expect(applicationStartMock.navigateToApp).toBeCalledWith(WORKSPACE_OVERVIEW_APP_ID);
    windowSpy.mockRestore();
  });

  it('#setup register workspace dropdown menu when setup', async () => {
    const setupMock = coreMock.createSetup();
    const workspacePlugin = new WorkspacePlugin();
    await workspacePlugin.setup(setupMock, {
      management: managementPluginMock.createSetupContract(),
    });
    expect(setupMock.chrome.registerCollapsibleNavHeader).toBeCalledTimes(1);
  });

  it('#start add workspace overview page to breadcrumbs when start', async () => {
    const startMock = coreMock.createStart();
    const workspaceObject = {
      id: 'foo',
      name: 'bar',
    };
    startMock.workspaces.currentWorkspace$.next(workspaceObject);
    const breadcrumbs = new BehaviorSubject<ChromeBreadcrumb[]>([{ text: 'dashboards' }]);
    startMock.chrome.getBreadcrumbs$.mockReturnValue(breadcrumbs);
    const workspacePlugin = new WorkspacePlugin();
    workspacePlugin.start(startMock);
    expect(startMock.chrome.setBreadcrumbs).toBeCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          text: 'bar',
        }),
        expect.objectContaining({
          text: 'Home',
        }),
      ])
    );
  });

  it('#start do not add workspace overview page to breadcrumbs when already exists', async () => {
    const startMock = coreMock.createStart();
    const workspaceObject = {
      id: 'foo',
      name: 'bar',
    };
    startMock.workspaces.currentWorkspace$.next(workspaceObject);
    const breadcrumbs = new BehaviorSubject<ChromeBreadcrumb[]>([
      { text: 'home' },
      { text: 'bar' },
    ]);
    startMock.chrome.getBreadcrumbs$.mockReturnValue(breadcrumbs);
    const workspacePlugin = new WorkspacePlugin();
    workspacePlugin.start(startMock);
    expect(startMock.chrome.setBreadcrumbs).not.toHaveBeenCalled();
  });
});
