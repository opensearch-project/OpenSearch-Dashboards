/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable, Subscriber, of } from 'rxjs';
import { waitFor } from '@testing-library/dom';
import { ChromeNavLink } from 'opensearch-dashboards/public';
import { workspaceClientMock, WorkspaceClientMock } from './workspace_client.mock';
import { applicationServiceMock, chromeServiceMock, coreMock } from '../../../core/public/mocks';
import { WorkspacePlugin } from './plugin';
import { WORKSPACE_FATAL_ERROR_APP_ID, WORKSPACE_OVERVIEW_APP_ID } from '../common/constants';
import { savedObjectsManagementPluginMock } from '../../saved_objects_management/public/mocks';

describe('Workspace plugin', () => {
  beforeEach(() => {
    WorkspaceClientMock.mockClear();
    Object.values(workspaceClientMock).forEach((item) => item.mockClear());
  });
  it('#setup', async () => {
    const setupMock = coreMock.createSetup();
    const workspacePlugin = new WorkspacePlugin();
    await workspacePlugin.setup(
      {
        ...setupMock,
        chrome: chromeServiceMock.createSetupContract(),
      },
      { savedObjectsManagement: savedObjectsManagementPluginMock.createSetupContract() }
    );
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
    await workspacePlugin.setup(
      {
        ...setupMock,
        chrome: chromeServiceMock.createSetupContract(),
      },
      { savedObjectsManagement: savedObjectsManagementPluginMock.createSetupContract() }
    );
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
    await workspacePlugin.setup(
      {
        ...setupMock,
        chrome: chromeServiceMock.createSetupContract(),
      },
      { savedObjectsManagement: savedObjectsManagementPluginMock.createSetupContract() }
    );
    currentAppIdSubscriber?.next(WORKSPACE_FATAL_ERROR_APP_ID);
    expect(applicationStartMock.navigateToApp).toBeCalledWith(WORKSPACE_OVERVIEW_APP_ID);
    windowSpy.mockRestore();
  });

  it('#start filter nav links according to workspace feature', () => {
    const workspacePlugin = new WorkspacePlugin();
    const coreStart = coreMock.createStart();
    const navLinksService = coreStart.chrome.navLinks;
    const devToolsNavLink = {
      id: 'dev_tools',
      category: { id: 'management', label: 'Management' },
    };
    const discoverNavLink = {
      id: 'discover',
      category: { id: 'opensearchDashboards', label: 'Library' },
    };
    const workspace = {
      id: 'test',
      name: 'test',
      features: ['dev_tools'],
    };
    const allNavLinks = of([devToolsNavLink, discoverNavLink] as ChromeNavLink[]);
    const filteredNavLinksMap = new Map<string, ChromeNavLink>();
    filteredNavLinksMap.set(devToolsNavLink.id, devToolsNavLink as ChromeNavLink);
    navLinksService.getAllNavLinks$.mockReturnValue(allNavLinks);
    coreStart.workspaces.currentWorkspace$.next(workspace);
    workspacePlugin.start(coreStart);
    expect(navLinksService.setNavLinks).toHaveBeenCalledWith(filteredNavLinksMap);
  });
});
