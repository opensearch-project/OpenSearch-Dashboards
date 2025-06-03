/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../core/public/mocks';
import { DashboardPlugin } from './plugin';
import { dataPluginMock } from '../../data/public/mocks';
import { embeddablePluginMock } from '../../embeddable/public/mocks';
import { opensearchDashboardsLegacyPluginMock } from '../../opensearch_dashboards_legacy/public/mocks';
import { urlForwardingPluginMock } from '../../url_forwarding/public/mocks';
import { uiActionsPluginMock } from '../../ui_actions/public/mocks';

describe('DashboardPlugin', () => {
  it('setup successfully', () => {
    const setupMock = coreMock.createSetup();
    const initializerContext = coreMock.createPluginInitializerContext();
    const pluginInstance = new DashboardPlugin(initializerContext);
    expect(() =>
      pluginInstance.setup(setupMock, {
        data: dataPluginMock.createSetupContract(),
        embeddable: embeddablePluginMock.createSetupContract(),
        opensearchDashboardsLegacy: opensearchDashboardsLegacyPluginMock.createSetupContract(),
        urlForwarding: urlForwardingPluginMock.createSetupContract(),
        uiActions: uiActionsPluginMock.createSetupContract(),
      })
    ).not.toThrow();
    expect(setupMock.chrome.navGroup.addNavLinksToGroup).toBeCalledTimes(5);
  });
});
