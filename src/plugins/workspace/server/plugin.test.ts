/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OnPostAuthHandler, OnPreRoutingHandler } from 'src/core/server';
import { coreMock, httpServerMock } from '../../../core/server/mocks';
import { WorkspacePlugin } from './plugin';
import { getWorkspaceState, updateWorkspaceState } from '../../../core/server/utils';
import * as utilsExports from './utils';

describe('Workspace server plugin', () => {
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
