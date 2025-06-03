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

describe('DiscoverPlugin', () => {
  it('setup successfully', () => {
    const setupMock = coreMock.createSetup();
    const initializerContext = coreMock.createPluginInitializerContext();
    const pluginInstance = new DiscoverPlugin(initializerContext);
    expect(() =>
      pluginInstance.setup(setupMock, {
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
});
