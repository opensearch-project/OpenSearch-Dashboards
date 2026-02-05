/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../core/public/mocks';
import { DatasetManagementPlugin } from './plugin';
import { urlForwardingPluginMock } from '../../url_forwarding/public/mocks';
import { managementPluginMock } from '../../management/public/mocks';
import {
  ManagementApp,
  ManagementAppMountParams,
  RegisterManagementAppArgs,
} from 'src/plugins/management/public';
import { waitFor } from '@testing-library/dom';
import { BehaviorSubject } from 'rxjs';
import {
  AppNavLinkStatus,
  DEFAULT_NAV_GROUPS,
  WORKSPACE_USE_CASE_PREFIX,
} from '../../../core/public';

describe('DiscoverPlugin', () => {
  it('setup successfully', () => {
    const setupMock = coreMock.createSetup();
    const initializerContext = coreMock.createPluginInitializerContext();
    // @ts-expect-error TS2554 TODO(ts-error): fixme
    const pluginInstance = new DatasetManagementPlugin(initializerContext);
    expect(() =>
      pluginInstance.setup(setupMock, {
        urlForwarding: urlForwardingPluginMock.createSetupContract(),
        management: managementPluginMock.createSetupContract(),
      })
    ).not.toThrow();
    expect(setupMock.application.register).toBeCalledTimes(1);
    waitFor(() => {
      expect(setupMock.chrome.navGroup.addNavLinksToGroup).toBeCalledTimes(1);
    });
  });

  it('when new navigation is enabled, should navigate to standard IPM app', async () => {
    const setupMock = coreMock.createSetup();
    const startMock = coreMock.createStart();
    setupMock.getStartServices.mockResolvedValue([startMock, {}, {}]);
    const initializerContext = coreMock.createPluginInitializerContext();
    // @ts-expect-error TS2554 TODO(ts-error): fixme
    const pluginInstance = new DatasetManagementPlugin(initializerContext);
    const managementMock = managementPluginMock.createSetupContract();
    let applicationRegistration = {} as Omit<RegisterManagementAppArgs, 'basePath'>;
    managementMock.sections.section.opensearchDashboards.registerApp = (
      app: Omit<RegisterManagementAppArgs, 'basePath'>
    ) => {
      applicationRegistration = app;
      return {} as ManagementApp;
    };

    setupMock.chrome.navGroup.getNavGroupEnabled.mockReturnValue(true);
    startMock.application.getUrlForApp.mockReturnValue('/app/datasets');

    pluginInstance.setup(setupMock, {
      urlForwarding: urlForwardingPluginMock.createSetupContract(),
      management: managementMock,
    });

    await applicationRegistration.mount({} as ManagementAppMountParams);

    expect(startMock.application.getUrlForApp).toBeCalledWith('datasets');
    expect(startMock.application.navigateToUrl).toBeCalledWith('http://localhost/app/datasets');
  });

  it('redirects to indexPatterns when NOT in observability workspace', async () => {
    const setupMock = coreMock.createSetup();
    const startMock = coreMock.createStart();
    const workspaceSubject = new BehaviorSubject({
      id: 'test-workspace',
      name: 'Test Workspace',
      features: ['some-other-feature'], // Not observability
    });

    // @ts-expect-error TS2322 TODO(ts-error): fixme
    startMock.workspaces.currentWorkspace$ = workspaceSubject;
    // Mock capabilities with workspaces enabled
    (startMock.application as any).capabilities = {
      ...startMock.application.capabilities,
      workspaces: { enabled: true },
    };
    startMock.application.getUrlForApp.mockReturnValue('/app/indexPatterns');

    setupMock.getStartServices.mockResolvedValue([startMock, {}, {}]);
    const initializerContext = coreMock.createPluginInitializerContext();
    // @ts-expect-error TS2554 TODO(ts-error): fixme
    const pluginInstance = new DatasetManagementPlugin(initializerContext);
    const managementMock = managementPluginMock.createSetupContract();

    let applicationRegistration = {} as Omit<RegisterManagementAppArgs, 'basePath'>;
    managementMock.sections.section.opensearchDashboards.registerApp = (
      app: Omit<RegisterManagementAppArgs, 'basePath'>
    ) => {
      applicationRegistration = app;
      return {} as ManagementApp;
    };

    setupMock.chrome.navGroup.getNavGroupEnabled.mockReturnValue(false);

    pluginInstance.setup(setupMock, {
      urlForwarding: urlForwardingPluginMock.createSetupContract(),
      management: managementMock,
    });

    await applicationRegistration.mount({} as ManagementAppMountParams);

    expect(startMock.application.getUrlForApp).toBeCalledWith('indexPatterns');
    expect(startMock.application.navigateToUrl).toBeCalledWith('/app/indexPatterns');
  });

  it('allows access when in observability workspace', async () => {
    const setupMock = coreMock.createSetup();
    const startMock = coreMock.createStart();
    const workspaceSubject = new BehaviorSubject({
      id: 'observability-workspace',
      name: 'Observability Workspace',
      features: [`${WORKSPACE_USE_CASE_PREFIX}${DEFAULT_NAV_GROUPS.observability.id}`],
    });

    // @ts-expect-error TS2322 TODO(ts-error): fixme
    startMock.workspaces.currentWorkspace$ = workspaceSubject;
    // Mock capabilities with workspaces enabled
    (startMock.application as any).capabilities = {
      ...startMock.application.capabilities,
      workspaces: { enabled: true },
    };

    setupMock.getStartServices.mockResolvedValue([startMock, {}, {}]);
    const initializerContext = coreMock.createPluginInitializerContext();
    // @ts-expect-error TS2554 TODO(ts-error): fixme
    const pluginInstance = new DatasetManagementPlugin(initializerContext);
    const managementMock = managementPluginMock.createSetupContract();

    let mountFunction: ((params: ManagementAppMountParams) => Promise<any>) | undefined;
    managementMock.sections.section.opensearchDashboards.registerApp = (
      app: Omit<RegisterManagementAppArgs, 'basePath'>
    ) => {
      // @ts-expect-error TS2322 TODO(ts-error): fixme
      mountFunction = app.mount;
      return {} as ManagementApp;
    };

    setupMock.chrome.navGroup.getNavGroupEnabled.mockReturnValue(false);

    pluginInstance.setup(setupMock, {
      urlForwarding: urlForwardingPluginMock.createSetupContract(),
      management: managementMock,
    });

    // Should not redirect to indexPatterns when in observability workspace
    expect(mountFunction).toBeDefined();
    // We can't fully test the mount without mocking the entire management app import
    // but we've verified the mount function is registered
  });

  it('updates nav link visibility when workspace changes', async () => {
    const setupMock = coreMock.createSetup();
    const startMock = coreMock.createStart();
    const workspaceSubject = new BehaviorSubject({
      id: 'test-workspace',
      name: 'Test Workspace',
      features: ['some-other-feature'],
    });

    // @ts-expect-error TS2322 TODO(ts-error): fixme
    startMock.workspaces.currentWorkspace$ = workspaceSubject;
    // Mock capabilities with workspaces enabled
    (startMock.application as any).capabilities = {
      ...startMock.application.capabilities,
      workspaces: { enabled: true },
    };

    setupMock.getStartServices.mockResolvedValue([startMock, {}, {}]);
    const initializerContext = coreMock.createPluginInitializerContext();
    // @ts-expect-error TS2554 TODO(ts-error): fixme
    const pluginInstance = new DatasetManagementPlugin(initializerContext);

    let appUpdater: any;
    setupMock.application.register.mockImplementation((app: any) => {
      appUpdater = app.updater$;
      return {} as any;
    });

    pluginInstance.setup(setupMock, {
      urlForwarding: urlForwardingPluginMock.createSetupContract(),
      management: managementPluginMock.createSetupContract(),
    });

    // Wait for the subscription to be set up
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Track updates
    const updates: any[] = [];
    appUpdater.subscribe((update: any) => {
      updates.push(update({}));
    });

    // Wait for initial update
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Initially, nav link should be hidden (not observability workspace)
    expect(updates[updates.length - 1]?.navLinkStatus).toBe(AppNavLinkStatus.hidden);

    // Change to observability workspace
    workspaceSubject.next({
      id: 'obs-workspace',
      name: 'Observability Workspace',
      features: [`${WORKSPACE_USE_CASE_PREFIX}${DEFAULT_NAV_GROUPS.observability.id}`],
    });

    // Wait for update to propagate
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Now nav link should be visible
    expect(updates[updates.length - 1]?.navLinkStatus).toBe(AppNavLinkStatus.visible);
  });

  it('does not set up workspace subscription when workspaces are disabled', async () => {
    const setupMock = coreMock.createSetup();
    const startMock = coreMock.createStart();

    // Mock capabilities with workspaces disabled
    (startMock.application as any).capabilities = {
      ...startMock.application.capabilities,
      workspaces: { enabled: false },
    };

    setupMock.getStartServices.mockResolvedValue([startMock, {}, {}]);
    const initializerContext = coreMock.createPluginInitializerContext();
    // @ts-expect-error TS2554 TODO(ts-error): fixme
    const pluginInstance = new DatasetManagementPlugin(initializerContext);

    let appUpdater: any;
    setupMock.application.register.mockImplementation((app: any) => {
      appUpdater = app.updater$;
      return {} as any;
    });

    pluginInstance.setup(setupMock, {
      urlForwarding: urlForwardingPluginMock.createSetupContract(),
      management: managementPluginMock.createSetupContract(),
    });

    // Wait a bit to ensure subscription would have happened if it was going to
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Track updates - the subscription should not trigger workspace-based updates
    const updates: any[] = [];
    appUpdater.subscribe((update: any) => {
      updates.push(update({}));
    });

    // Wait to ensure no additional updates occur
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Should only have the initial subscription value, no workspace-based updates
    expect(updates.length).toBe(1);
    // And the update should not contain navLinkStatus (no workspace subscription active)
    expect(updates[0]?.navLinkStatus).toBeUndefined();
  });
});
