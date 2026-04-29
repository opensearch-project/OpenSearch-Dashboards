/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../core/public/mocks';
import { DEFAULT_NAV_GROUPS } from '../../../core/public';
import { DashboardPlugin } from './plugin';
import { dataPluginMock } from '../../data/public/mocks';
import { embeddablePluginMock } from '../../embeddable/public/mocks';
import { opensearchDashboardsLegacyPluginMock } from '../../opensearch_dashboards_legacy/public/mocks';
import { urlForwardingPluginMock } from '../../url_forwarding/public/mocks';
import { uiActionsPluginMock } from '../../ui_actions/public/mocks';

const getSetupDeps = () => ({
  data: dataPluginMock.createSetupContract(),
  embeddable: embeddablePluginMock.createSetupContract(),
  opensearchDashboardsLegacy: opensearchDashboardsLegacyPluginMock.createSetupContract(),
  urlForwarding: urlForwardingPluginMock.createSetupContract(),
  uiActions: uiActionsPluginMock.createSetupContract(),
});

describe('DashboardPlugin', () => {
  it('setup successfully', () => {
    const setupMock = coreMock.createSetup();
    const initializerContext = coreMock.createPluginInitializerContext();
    const pluginInstance = new DashboardPlugin(initializerContext);
    expect(() => pluginInstance.setup(setupMock, getSetupDeps())).not.toThrow();
    expect(setupMock.chrome.navGroup.addNavLinksToGroup).toBeCalledTimes(5);
  });

  it('should register dashboard in observability with order 100 when icon side nav is enabled', () => {
    const setupMock = coreMock.createSetup();
    setupMock.chrome.getIsIconSideNavEnabled.mockReturnValue(true);
    const initializerContext = coreMock.createPluginInitializerContext();
    const pluginInstance = new DashboardPlugin(initializerContext);
    pluginInstance.setup(setupMock, getSetupDeps());

    const observabilityCall = setupMock.chrome.navGroup.addNavLinksToGroup.mock.calls.find(
      (call) => call[0] === DEFAULT_NAV_GROUPS.observability
    );
    expect(observabilityCall).toBeDefined();
    expect(observabilityCall![1]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'dashboards',
          order: 100,
          euiIconType: 'dashboardApp',
        }),
      ])
    );
  });

  it('should register dashboard in observability with order 400 when icon side nav is disabled', () => {
    const setupMock = coreMock.createSetup();
    setupMock.chrome.getIsIconSideNavEnabled.mockReturnValue(false);
    const initializerContext = coreMock.createPluginInitializerContext();
    const pluginInstance = new DashboardPlugin(initializerContext);
    pluginInstance.setup(setupMock, getSetupDeps());

    const observabilityCall = setupMock.chrome.navGroup.addNavLinksToGroup.mock.calls.find(
      (call) => call[0] === DEFAULT_NAV_GROUPS.observability
    );
    expect(observabilityCall).toBeDefined();
    expect(observabilityCall![1]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'dashboards',
          order: 400,
          euiIconType: 'dashboardApp',
        }),
      ])
    );
  });
});
