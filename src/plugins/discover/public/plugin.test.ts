/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../core/public/mocks';
import { DiscoverPlugin } from './plugin';
import { dataPluginMock } from '../../data/public/mocks';
import { embeddablePluginMock } from '../../embeddable/public/mocks';
import { opensearchDashboardsLegacyPluginMock } from '../../opensearch_dashboards_legacy/public/mocks';
import { urlForwardingPluginMock } from '../../url_forwarding/public/mocks';
import { uiActionsPluginMock } from '../../ui_actions/public/mocks';
import { visualizationsPluginMock } from '../../visualizations/public/mocks';
import { createHashHistory } from 'history';

jest.mock('history', () => ({
  createHashHistory: jest.fn(() => ({
    listen: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
    location: { pathname: '/', hash: '', search: '' },
  })),
}));

describe('DiscoverPlugin', () => {
  const locationMock = {
    hash: '#/',
    pathname: '/',
    search: '',
    href: 'http://[IP_ADDRESS]/#/',
    origin: 'http://[IP_ADDRESS]',
    protocol: 'http:',
    host: '[IP_ADDRESS]',
    hostname: '[IP_ADDRESS]',
    port: '',
    assign: jest.fn(),
    reload: jest.fn(),
    replace: jest.fn(),
    toString: jest.fn(),
  };

  Object.defineProperty(window, 'location', {
    value: locationMock,
    writable: true,
  });

  let plugin: DiscoverPlugin;
  let setupMock: ReturnType<typeof coreMock.createSetup>;
  let startMock: ReturnType<typeof coreMock.createStart>;

  beforeEach(() => {
    setupMock = coreMock.createSetup();
    startMock = coreMock.createStart();
    const initializerContext = coreMock.createPluginInitializerContext();
    plugin = new DiscoverPlugin(initializerContext);
  });

  it('setup successfully', () => {
    expect(() =>
      plugin.setup(setupMock, {
        data: dataPluginMock.createSetupContract(),
        embeddable: embeddablePluginMock.createSetupContract(),
        opensearchDashboardsLegacy: opensearchDashboardsLegacyPluginMock.createSetupContract(),
        urlForwarding: urlForwardingPluginMock.createSetupContract(),
        uiActions: uiActionsPluginMock.createSetupContract(),
        visualizations: visualizationsPluginMock.createSetupContract(),
        dataExplorer: {
          registerView: jest.fn(),
        },
      })
    ).not.toThrow();
    expect(setupMock.chrome.navGroup.addNavLinksToGroup).toBeCalledTimes(5);
  });

  it('should handle mount with data-explorer navigation', async () => {
    const setupContract = plugin.setup(setupMock, {
      data: dataPluginMock.createSetupContract(),
      embeddable: embeddablePluginMock.createSetupContract(),
      opensearchDashboardsLegacy: opensearchDashboardsLegacyPluginMock.createSetupContract(),
      urlForwarding: urlForwardingPluginMock.createSetupContract(),
      uiActions: uiActionsPluginMock.createSetupContract(),
      visualizations: visualizationsPluginMock.createSetupContract(),
      dataExplorer: {
        registerView: jest.fn(),
      },
    });

    const startContract = plugin.start(startMock, {
      data: {
        ...dataPluginMock.createStartContract(),
        indexPatterns: {
          ensureDefaultIndexPattern: jest.fn().mockResolvedValue(undefined),
        },
      },
      embeddable: embeddablePluginMock.createStartContract(),
      opensearchDashboardsLegacy: opensearchDashboardsLegacyPluginMock.createStartContract(),
      urlForwarding: urlForwardingPluginMock.createStartContract(),
      uiActions: uiActionsPluginMock.createStartContract(),
      navigation: {} as any,
      charts: {} as any,
      inspector: {} as any,
      visualizations: visualizationsPluginMock.createStartContract(),
    });

    const params = {
      element: document.createElement('div'),
      appBasePath: '',
      onAppLeave: () => Promise.resolve(true),
      setHeaderActionMenu: () => {},
      history: createHashHistory(),
    };

    await setupMock.application.register.mock.calls[0][0].mount(params);

    expect(startMock.application.navigateToApp).toHaveBeenCalledWith('data-explorer', {
      replace: true,
      path: '/discover/',
    });
  });
});
