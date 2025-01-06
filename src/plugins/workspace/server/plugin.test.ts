/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OnPostAuthHandler, OnPreRoutingHandler } from 'src/core/server';
import { coreMock, httpServerMock, uiSettingsServiceMock } from '../../../core/server/mocks';
import { WorkspacePlugin, WorkspacePluginDependencies } from './plugin';
import {
  getACLAuditor,
  getClientCallAuditor,
  getWorkspaceState,
  updateWorkspaceState,
} from '../../../core/server/utils';
import * as serverUtils from '../../../core/server/utils/auth_info';
import { SavedObjectsPermissionControl } from './permission_control/client';
import { DataSourcePluginSetup } from '../../data_source/server';
import { DataSourceError } from '../../data_source/common/data_sources';

describe('Workspace server plugin', () => {
  const mockDataSourcePluginSetup: DataSourcePluginSetup = {
    createDataSourceError(err: any): DataSourceError {
      return new DataSourceError({});
    },
    dataSourceEnabled: jest.fn(() => true),
    registerCredentialProvider: jest.fn(),
    registerCustomApiSchema(schema: any): void {
      throw new Error('Function not implemented.');
    },
  };
  const mockDeps: WorkspacePluginDependencies = { dataSource: mockDataSourcePluginSetup };
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
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
    await workspacePlugin.setup(setupMock, mockDeps);
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
    expect(setupMock.savedObjects.addClientWrapper).toBeCalledTimes(5);

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
    await workspacePlugin.setup(setupMock, mockDeps);
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
    const getConfigMock = jest.fn().mockResolvedValue({
      dashboardAdmin: {
        users: ['dashboard-admin-user'],
        groups: [],
      },
    });
    jest.spyOn(setupMock.dynamicConfigService, 'getStartService').mockResolvedValue({
      ...setupMock.dynamicConfigService.getStartService(),
      getAsyncLocalStore: jest.fn(),
      getClient: () => ({
        getConfig: getConfigMock,
        bulkGetConfigs: jest.fn(),
        listConfigs: jest.fn(),
      }),
    });
    const initializerContextConfigMock = coreMock.createPluginInitializerContext({
      enabled: true,
      permission: {
        enabled: true,
      },
    });
    let registerOnPostAuthFn: OnPostAuthHandler = () => httpServerMock.createResponseFactory().ok();
    setupMock.http.registerOnPostAuth.mockImplementationOnce((fn) => {
      registerOnPostAuthFn = fn;
      return fn;
    });
    const workspacePlugin = new WorkspacePlugin(initializerContextConfigMock);
    const requestWithWorkspaceInUrl = httpServerMock.createOpenSearchDashboardsRequest({
      path: '/w/foo/app',
    });

    it('catch error', async () => {
      await workspacePlugin.setup(setupMock, mockDeps);
      const toolKitMock = httpServerMock.createToolkit();

      await registerOnPostAuthFn(
        requestWithWorkspaceInUrl,
        httpServerMock.createResponseFactory(),
        toolKitMock
      );
      expect(toolKitMock.next).toBeCalledTimes(1);
    });

    it('with dynamic config and user is dashboard admin', async () => {
      jest
        .spyOn(serverUtils, 'getPrincipalsFromRequest')
        .mockImplementation(() => ({ users: [`dashboard-admin-user`] }));

      await workspacePlugin.setup(setupMock, mockDeps);
      const toolKitMock = httpServerMock.createToolkit();

      await registerOnPostAuthFn(
        requestWithWorkspaceInUrl,
        httpServerMock.createResponseFactory(),
        toolKitMock
      );

      expect(getWorkspaceState(requestWithWorkspaceInUrl)).toEqual({
        isDashboardAdmin: true,
      });
      expect(toolKitMock.next).toBeCalledTimes(1);
    });

    it('with dynamic config and user is not dashboard admin', async () => {
      jest
        .spyOn(serverUtils, 'getPrincipalsFromRequest')
        .mockImplementation(() => ({ users: [`none-dashboard-admin-user`] }));

      await workspacePlugin.setup(setupMock, mockDeps);
      const toolKitMock = httpServerMock.createToolkit();

      await registerOnPostAuthFn(
        requestWithWorkspaceInUrl,
        httpServerMock.createResponseFactory(),
        toolKitMock
      );

      expect(getWorkspaceState(requestWithWorkspaceInUrl)).toEqual({
        isDashboardAdmin: false,
      });
      expect(toolKitMock.next).toBeCalledTimes(1);
    });

    it('with configuring wildcard * and anyone will be OSD admin', async () => {
      jest
        .spyOn(serverUtils, 'getPrincipalsFromRequest')
        .mockImplementation(() => ({ users: [`user1`] }));
      getConfigMock.mockResolvedValueOnce({
        dashboardAdmin: {
          users: ['*'],
          groups: [],
        },
      });

      await workspacePlugin.setup(setupMock, mockDeps);
      const toolKitMock = httpServerMock.createToolkit();

      await registerOnPostAuthFn(
        requestWithWorkspaceInUrl,
        httpServerMock.createResponseFactory(),
        toolKitMock
      );

      expect(getWorkspaceState(requestWithWorkspaceInUrl)).toEqual({
        isDashboardAdmin: true,
      });
      expect(toolKitMock.next).toBeCalledTimes(1);
    });

    it('without configuring yml config and anyone will be not OSD admin', async () => {
      jest
        .spyOn(serverUtils, 'getPrincipalsFromRequest')
        .mockImplementation(() => ({ users: [`user1`] }));
      getConfigMock.mockResolvedValueOnce({
        dashboardAdmin: {
          users: [],
          groups: [],
        },
      });

      await workspacePlugin.setup(setupMock, mockDeps);
      const toolKitMock = httpServerMock.createToolkit();

      await registerOnPostAuthFn(
        requestWithWorkspaceInUrl,
        httpServerMock.createResponseFactory(),
        toolKitMock
      );

      expect(getWorkspaceState(requestWithWorkspaceInUrl)).toEqual({
        isDashboardAdmin: false,
      });
      expect(toolKitMock.next).toBeCalledTimes(1);
    });

    it('uninstall security plugin and anyone will be OSD admin', async () => {
      jest.spyOn(serverUtils, 'getPrincipalsFromRequest').mockImplementation(() => ({}));

      await workspacePlugin.setup(setupMock, mockDeps);
      const toolKitMock = httpServerMock.createToolkit();

      await registerOnPostAuthFn(
        requestWithWorkspaceInUrl,
        httpServerMock.createResponseFactory(),
        toolKitMock
      );

      expect(getWorkspaceState(requestWithWorkspaceInUrl)).toEqual({
        isDashboardAdmin: true,
      });
      expect(toolKitMock.next).toBeCalledTimes(1);
    });

    it('should clear saved objects cache', async () => {
      jest.spyOn(serverUtils, 'getPrincipalsFromRequest').mockImplementation(() => ({}));
      const clearSavedObjectsCacheMock = jest
        .spyOn(SavedObjectsPermissionControl.prototype, 'clearSavedObjectsCache')
        .mockImplementationOnce(() => {});

      await workspacePlugin.setup(setupMock, mockDeps);
      const toolKitMock = httpServerMock.createToolkit();

      expect(setupMock.http.registerOnPreResponse).toHaveBeenCalled();
      const preResponseFn = setupMock.http.registerOnPreResponse.mock.calls[0][0];

      preResponseFn(requestWithWorkspaceInUrl, { statusCode: 200 }, toolKitMock);
      expect(clearSavedObjectsCacheMock).toHaveBeenCalled();
    });

    describe('#ACL auditor', () => {
      it('should initialize 2 auditors when permission control is enabled', async () => {
        const coreSetupMock = coreMock.createSetup();
        await workspacePlugin.setup(coreSetupMock, mockDeps);
        const toolKitMock = httpServerMock.createToolkit();

        const postAuthFn = coreSetupMock.http.registerOnPostAuth.mock.calls[1][0];
        const mockedRequest = httpServerMock.createOpenSearchDashboardsRequest();

        postAuthFn(mockedRequest, httpServerMock.createResponseFactory(), toolKitMock);
        expect(getACLAuditor(mockedRequest)).toBeTruthy();
        expect(getClientCallAuditor(mockedRequest)).toBeTruthy();
      });

      it('should clean up 2 auditors when permission control is enabled and non dashboard admin', async () => {
        const coreSetupMock = coreMock.createSetup();
        await workspacePlugin.setup(coreSetupMock, mockDeps);
        const toolKitMock = httpServerMock.createToolkit();

        const postAuthFn = coreSetupMock.http.registerOnPostAuth.mock.calls[1][0];
        const preResponse = coreSetupMock.http.registerOnPreResponse.mock.calls[1][0];

        const nonDashboardAdminRequest = httpServerMock.createOpenSearchDashboardsRequest();
        postAuthFn(nonDashboardAdminRequest, httpServerMock.createResponseFactory(), toolKitMock);
        const aclAuditorForNonDashboardAdmin = getACLAuditor(nonDashboardAdminRequest);
        let checkoutSpy;
        if (aclAuditorForNonDashboardAdmin) {
          checkoutSpy = jest.spyOn(aclAuditorForNonDashboardAdmin, 'checkout');
        }

        preResponse(nonDashboardAdminRequest, { statusCode: 200 }, toolKitMock);

        expect(checkoutSpy).toBeCalled();
        expect(getACLAuditor(nonDashboardAdminRequest)).toBeFalsy();
        expect(getClientCallAuditor(nonDashboardAdminRequest)).toBeFalsy();
      });

      it('should not checkout when request user is dashboard admin', async () => {
        const coreSetupMock = coreMock.createSetup();
        await workspacePlugin.setup(coreSetupMock, mockDeps);
        const toolKitMock = httpServerMock.createToolkit();

        const postAuthFn = coreSetupMock.http.registerOnPostAuth.mock.calls[1][0];
        const preResponse = coreSetupMock.http.registerOnPreResponse.mock.calls[1][0];

        // request flow for dashboard admin
        const dashboardAdminRequest = httpServerMock.createOpenSearchDashboardsRequest();
        updateWorkspaceState(dashboardAdminRequest, {
          isDashboardAdmin: true,
        });
        postAuthFn(dashboardAdminRequest, httpServerMock.createResponseFactory(), toolKitMock);
        const aclAuditorForDashboardAdmin = getACLAuditor(dashboardAdminRequest);
        let checkoutSpy;
        if (aclAuditorForDashboardAdmin) {
          checkoutSpy = jest.spyOn(aclAuditorForDashboardAdmin, 'checkout');
        }
        preResponse(dashboardAdminRequest, { statusCode: 200 }, toolKitMock);

        expect(checkoutSpy).toBeCalledTimes(0);
      });
    });
  });

  describe('#setUpRedirectPage', () => {
    const setupMock = coreMock.createSetup();
    const uiSettingsMock = uiSettingsServiceMock.createClient();
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
      await workspacePlugin.setup(setupMock, mockDeps);
      const toolKitMock = httpServerMock.createToolkit();

      await registerOnPostAuthFn(request, response, toolKitMock);
      expect(toolKitMock.next).toBeCalledTimes(1);
    });

    it('with / request path and no workspaces', async () => {
      const request = httpServerMock.createOpenSearchDashboardsRequest({
        path: '/',
      });
      await workspacePlugin.setup(setupMock, mockDeps);
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
      const workspaceSetup = await workspacePlugin.setup(setupMock, mockDeps);
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
      const workspaceSetup = await workspacePlugin.setup(setupMock, mockDeps);
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
                }
              }),
            }),
          },
        },
        {},
        {},
      ]);
      const workspaceSetup = await workspacePlugin.setup(setupMock, mockDeps);
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
    await workspacePlugin.setup(setupMock, mockDeps);
    await workspacePlugin.start(startMock);
    expect(startMock.savedObjects.createSerializer).toBeCalledTimes(1);
  });

  it('#stop', () => {
    const initializerContextConfigMock = coreMock.createPluginInitializerContext();
    const workspacePlugin = new WorkspacePlugin(initializerContextConfigMock);
    workspacePlugin.stop();
  });
});
