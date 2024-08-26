/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OnPostAuthHandler, OnPreRoutingHandler } from 'src/core/server';
import { coreMock, httpServerMock, uiSettingsServiceMock } from '../../../core/server/mocks';
import { WorkspacePlugin } from './plugin';
import { getWorkspaceState, updateWorkspaceState } from '../../../core/server/utils';
import * as utilsExports from './utils';
import { SavedObjectsPermissionControl } from './permission_control/client';

describe('Workspace server plugin', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('#setup', async () => {
    let value;
    const capabilities = {} as any;
    const setupMock = coreMock.createSetup();
    const initializerContextConfigMock = coreMock.createPluginInitializerContext({
      enabled: true,
    });
    const request = httpServerMock.createOpenSearchDashboardsRequest();

    setupMock.capabilities.registerProvider.mockImplementationOnce((fn) => (value = fn()));
    setupMock.capabilities.registerSwitcher.mockImplementationOnce((fn) => {
      return fn(request, capabilities);
    });

    const workspacePlugin = new WorkspacePlugin(initializerContextConfigMock);
    await workspacePlugin.setup(setupMock);
    expect(value).toMatchInlineSnapshot(`
      Object {
        "dashboards": Object {
          "isDashboardAdmin": false,
        },
        "workspaces": Object {
          "enabled": true,
          "permissionEnabled": true,
        },
      }
    `);
    expect(setupMock.savedObjects.addClientWrapper).toBeCalledTimes(4);

    let registerSwitcher;
    let result;
    updateWorkspaceState(request, { isDashboardAdmin: false });
    registerSwitcher = setupMock.capabilities.registerSwitcher.mock.calls[0][0];
    result = registerSwitcher(request, capabilities);
    expect(result).toEqual({ dashboards: { isDashboardAdmin: false } });

    updateWorkspaceState(request, { isDashboardAdmin: true });
    registerSwitcher = setupMock.capabilities.registerSwitcher.mock.calls[0][0];
    result = registerSwitcher(request, capabilities);
    expect(result).toEqual({ dashboards: { isDashboardAdmin: true } });

    updateWorkspaceState(request, { isDashboardAdmin: undefined });
    registerSwitcher = setupMock.capabilities.registerSwitcher.mock.calls[0][0];
    result = registerSwitcher(request, capabilities);
    expect(result).toEqual({ dashboards: { isDashboardAdmin: true } });
  });

  it('#proxyWorkspaceTrafficToRealHandler', async () => {
    const setupMock = coreMock.createSetup();
    const initializerContextConfigMock = coreMock.createPluginInitializerContext({
      enabled: true,
      permission: {
        enabled: true,
      },
    });
    let onPreRoutingFn: OnPreRoutingHandler = () => httpServerMock.createResponseFactory().ok();
    setupMock.http.registerOnPreRouting.mockImplementation((fn) => {
      onPreRoutingFn = fn;
      return fn;
    });
    const workspacePlugin = new WorkspacePlugin(initializerContextConfigMock);
    await workspacePlugin.setup(setupMock);
    const toolKitMock = httpServerMock.createToolkit();

    const requestWithWorkspaceInUrl = httpServerMock.createOpenSearchDashboardsRequest({
      path: '/w/foo/app',
    });
    onPreRoutingFn(requestWithWorkspaceInUrl, httpServerMock.createResponseFactory(), toolKitMock);
    expect(toolKitMock.rewriteUrl).toBeCalledWith('http://localhost/app');
    expect(toolKitMock.next).toBeCalledTimes(0);
    expect(getWorkspaceState(requestWithWorkspaceInUrl)).toEqual({
      requestWorkspaceId: 'foo',
    });

    const requestWithoutWorkspaceInUrl = httpServerMock.createOpenSearchDashboardsRequest({
      path: '/app',
    });
    onPreRoutingFn(
      requestWithoutWorkspaceInUrl,
      httpServerMock.createResponseFactory(),
      toolKitMock
    );
    expect(toolKitMock.next).toBeCalledTimes(1);
  });

  describe('#setupPermission', () => {
    const setupMock = coreMock.createSetup();
    const initializerContextConfigMock = coreMock.createPluginInitializerContext({
      enabled: true,
      permission: {
        enabled: true,
      },
    });
    let registerOnPostAuthFn: OnPostAuthHandler = () => httpServerMock.createResponseFactory().ok();
    setupMock.http.registerOnPostAuth.mockImplementation((fn) => {
      registerOnPostAuthFn = fn;
      return fn;
    });
    const workspacePlugin = new WorkspacePlugin(initializerContextConfigMock);
    const requestWithWorkspaceInUrl = httpServerMock.createOpenSearchDashboardsRequest({
      path: '/w/foo/app',
    });

    it('catch error', async () => {
      await workspacePlugin.setup(setupMock);
      const toolKitMock = httpServerMock.createToolkit();

      await registerOnPostAuthFn(
        requestWithWorkspaceInUrl,
        httpServerMock.createResponseFactory(),
        toolKitMock
      );
      expect(toolKitMock.next).toBeCalledTimes(1);
    });

    it('with yml config', async () => {
      jest
        .spyOn(utilsExports, 'getPrincipalsFromRequest')
        .mockImplementation(() => ({ users: [`user1`] }));
      jest
        .spyOn(utilsExports, 'getOSDAdminConfigFromYMLConfig')
        .mockResolvedValue([['group1'], ['user1']]);

      await workspacePlugin.setup(setupMock);
      const toolKitMock = httpServerMock.createToolkit();

      await registerOnPostAuthFn(
        requestWithWorkspaceInUrl,
        httpServerMock.createResponseFactory(),
        toolKitMock
      );
      expect(toolKitMock.next).toBeCalledTimes(1);
    });

    it('uninstall security plugin', async () => {
      jest.spyOn(utilsExports, 'getPrincipalsFromRequest').mockImplementation(() => ({}));

      await workspacePlugin.setup(setupMock);
      const toolKitMock = httpServerMock.createToolkit();

      await registerOnPostAuthFn(
        requestWithWorkspaceInUrl,
        httpServerMock.createResponseFactory(),
        toolKitMock
      );
      expect(toolKitMock.next).toBeCalledTimes(1);
    });

    it('should clear saved objects cache', async () => {
      jest.spyOn(utilsExports, 'getPrincipalsFromRequest').mockImplementation(() => ({}));
      const clearSavedObjectsCacheMock = jest
        .spyOn(SavedObjectsPermissionControl.prototype, 'clearSavedObjectsCache')
        .mockImplementationOnce(() => {});

      await workspacePlugin.setup(setupMock);
      const toolKitMock = httpServerMock.createToolkit();

      expect(setupMock.http.registerOnPreResponse).toHaveBeenCalled();
      const preResponseFn = setupMock.http.registerOnPreResponse.mock.calls[0][0];

      preResponseFn(requestWithWorkspaceInUrl, { statusCode: 200 }, toolKitMock);
      expect(clearSavedObjectsCacheMock).toHaveBeenCalled();
    });
  });

  describe('#setUpRedirectPage', () => {
    const setupMock = coreMock.createSetup();
    const uiSettingsMock = uiSettingsServiceMock.createClient();
    setupMock.getStartServices.mockResolvedValue([
      {
        ...coreMock.createStart(),
        uiSettings: {
          asScopedToClient: () => ({
            ...uiSettingsMock,
            get: jest.fn().mockImplementation((key) => {
              if (key === 'home:useNewHomePage') {
                return Promise.resolve(true);
              }
            }),
          }),
        },
      },
      {},
      {},
    ]);
    const initializerContextConfigMock = coreMock.createPluginInitializerContext({
      enabled: true,
      permission: {
        enabled: true,
      },
    });
    let registerOnPostAuthFn: OnPostAuthHandler = () => httpServerMock.createResponseFactory().ok();
    setupMock.http.registerOnPostAuth.mockImplementation((fn) => {
      registerOnPostAuthFn = fn;
      return fn;
    });
    const workspacePlugin = new WorkspacePlugin(initializerContextConfigMock);
    const response = httpServerMock.createResponseFactory();

    it('without / request path', async () => {
      const request = httpServerMock.createOpenSearchDashboardsRequest({
        path: '/foo',
      });
      await workspacePlugin.setup(setupMock);
      const toolKitMock = httpServerMock.createToolkit();

      await registerOnPostAuthFn(request, response, toolKitMock);
      expect(toolKitMock.next).toBeCalledTimes(1);
    });

    it('with / request path and no workspaces', async () => {
      const request = httpServerMock.createOpenSearchDashboardsRequest({
        path: '/',
      });
      await workspacePlugin.setup(setupMock);
      const toolKitMock = httpServerMock.createToolkit();

      await registerOnPostAuthFn(request, response, toolKitMock);
      expect(response.redirected).toBeCalledWith({
        headers: { location: '/mock-server-basepath/app/workspace_initial' },
      });
    });

    it('with / request path and one workspace', async () => {
      const request = httpServerMock.createOpenSearchDashboardsRequest({
        path: '/',
      });
      const workspaceSetup = await workspacePlugin.setup(setupMock);
      const client = workspaceSetup.client;
      jest.spyOn(client, 'list').mockResolvedValue({
        success: true,
        result: {
          total: 1,
          per_page: 100,
          page: 1,
          workspaces: [{ id: 'workspace-1', name: 'workspace-1' }],
        },
      });
      const toolKitMock = httpServerMock.createToolkit();

      await registerOnPostAuthFn(request, response, toolKitMock);
      expect(response.redirected).toBeCalledWith({
        headers: {
          location: '/mock-server-basepath/w/workspace-1/app/workspace_navigation',
        },
      });
    });

    it('with / request path and more than one workspaces', async () => {
      const request = httpServerMock.createOpenSearchDashboardsRequest({
        path: '/',
      });
      const workspaceSetup = await workspacePlugin.setup(setupMock);
      const client = workspaceSetup.client;
      jest.spyOn(client, 'list').mockResolvedValue({
        success: true,
        result: {
          total: 2,
          per_page: 100,
          page: 1,
          workspaces: [
            { id: 'workspace-1', name: 'workspace-1' },
            { id: 'workspace-2', name: 'workspace-2' },
          ],
        },
      });
      const toolKitMock = httpServerMock.createToolkit();

      await registerOnPostAuthFn(request, response, toolKitMock);
      expect(response.redirected).toBeCalledWith({
        headers: {
          location: '/mock-server-basepath/app/home',
        },
      });
    });

    it('with / request path and default workspace', async () => {
      const request = httpServerMock.createOpenSearchDashboardsRequest({
        path: '/',
      });
      setupMock.getStartServices.mockResolvedValue([
        {
          ...coreMock.createStart(),
          uiSettings: {
            asScopedToClient: () => ({
              ...uiSettingsMock,
              get: jest.fn().mockImplementation((key) => {
                if (key === 'defaultWorkspace') {
                  return Promise.resolve('defaultWorkspace');
                } else if (key === 'home:useNewHomePage') {
                  return Promise.resolve('true');
                }
              }),
            }),
          },
        },
        {},
        {},
      ]);
      const workspaceSetup = await workspacePlugin.setup(setupMock);
      const client = workspaceSetup.client;
      jest.spyOn(client, 'list').mockResolvedValue({
        success: true,
        result: {
          total: 2,
          per_page: 100,
          page: 1,
          workspaces: [
            { id: 'defaultWorkspace', name: 'default-workspace' },
            { id: 'workspace-2', name: 'workspace-2' },
          ],
        },
      });
      const toolKitMock = httpServerMock.createToolkit();

      await registerOnPostAuthFn(request, response, toolKitMock);
      expect(response.redirected).toBeCalledWith({
        headers: {
          location: '/mock-server-basepath/w/defaultWorkspace/app/workspace_navigation',
        },
      });
    });

    it('with / request path and home:useNewHomePage is false', async () => {
      const request = httpServerMock.createOpenSearchDashboardsRequest({
        path: '/',
      });
      setupMock.getStartServices.mockResolvedValue([
        {
          ...coreMock.createStart(),
          uiSettings: {
            asScopedToClient: () => ({
              ...uiSettingsMock,
              get: jest.fn().mockResolvedValue(false),
            }),
          },
        },
        {},
        {},
      ]);
      const toolKitMock = httpServerMock.createToolkit();

      await registerOnPostAuthFn(request, response, toolKitMock);
      expect(toolKitMock.next).toBeCalledTimes(1);
    });
  });

  it('#start', async () => {
    const setupMock = coreMock.createSetup();
    const startMock = coreMock.createStart();
    const initializerContextConfigMock = coreMock.createPluginInitializerContext({
      enabled: true,
      permission: {
        enabled: true,
      },
    });

    const workspacePlugin = new WorkspacePlugin(initializerContextConfigMock);
    await workspacePlugin.setup(setupMock);
    await workspacePlugin.start(startMock);
    expect(startMock.savedObjects.createSerializer).toBeCalledTimes(1);
  });

  it('#stop', () => {
    const initializerContextConfigMock = coreMock.createPluginInitializerContext();
    const workspacePlugin = new WorkspacePlugin(initializerContextConfigMock);
    workspacePlugin.stop();
  });
});
