/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../core/public/mocks';
import { DEFAULT_NAV_GROUPS } from '../../../core/public';
import { DiscoverPlugin } from './plugin';
import { dataPluginMock } from '../../data/public/mocks';
import { embeddablePluginMock } from '../../embeddable/public/mocks';
import { opensearchDashboardsLegacyPluginMock } from '../../opensearch_dashboards_legacy/public/mocks';
import { urlForwardingPluginMock } from '../../url_forwarding/public/mocks';
import { uiActionsPluginMock } from '../../ui_actions/public/mocks';
import { visualizationsPluginMock } from '../../visualizations/public/mocks';

const getSetupDeps = (overrides?: { explore?: {} }) => ({
  data: dataPluginMock.createSetupContract(),
  embeddable: embeddablePluginMock.createSetupContract(),
  opensearchDashboardsLegacy: opensearchDashboardsLegacyPluginMock.createSetupContract(),
  urlForwarding: urlForwardingPluginMock.createSetupContract(),
  uiActions: uiActionsPluginMock.createSetupContract(),
  visualizations: visualizationsPluginMock.createSetupContract(),
  dataExplorer: {
    registerView: jest.fn(),
  },
  ...overrides,
});

describe('DiscoverPlugin', () => {
  it('setup successfully', () => {
    const setupMock = coreMock.createSetup();
    const initializerContext = coreMock.createPluginInitializerContext();
    const pluginInstance = new DiscoverPlugin(initializerContext);
    expect(() =>
      // @ts-expect-error TS2345 TODO(ts-error): fixme
      pluginInstance.setup(setupMock, getSetupDeps())
    ).not.toThrow();
    expect(setupMock.chrome.navGroup.addNavLinksToGroup).toBeCalledTimes(5);
  });

  it('should not register discover in observability when icon side nav is enabled', () => {
    const setupMock = coreMock.createSetup();
    setupMock.chrome.getIsIconSideNavEnabled.mockReturnValue(true);
    const initializerContext = coreMock.createPluginInitializerContext();
    const pluginInstance = new DiscoverPlugin(initializerContext);
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    pluginInstance.setup(setupMock, getSetupDeps());

    const observabilityCall = setupMock.chrome.navGroup.addNavLinksToGroup.mock.calls.find(
      (call) => call[0] === DEFAULT_NAV_GROUPS.observability
    );
    expect(observabilityCall).toBeUndefined();
  });

  it('should register discover in observability when icon side nav is disabled and explore is not present', () => {
    const setupMock = coreMock.createSetup();
    setupMock.chrome.getIsIconSideNavEnabled.mockReturnValue(false);
    const initializerContext = coreMock.createPluginInitializerContext();
    const pluginInstance = new DiscoverPlugin(initializerContext);
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    pluginInstance.setup(setupMock, getSetupDeps());

    const observabilityCall = setupMock.chrome.navGroup.addNavLinksToGroup.mock.calls.find(
      (call) => call[0] === DEFAULT_NAV_GROUPS.observability
    );
    expect(observabilityCall).toBeDefined();
    expect(observabilityCall![1]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'discover',
          order: 300,
        }),
      ])
    );
  });
});
