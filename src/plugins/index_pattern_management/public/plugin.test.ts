/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../core/public/mocks';
import { IndexPatternManagementPlugin } from './plugin';
import { urlForwardingPluginMock } from '../../url_forwarding/public/mocks';
import { managementPluginMock } from '../../management/public/mocks';

describe('DiscoverPlugin', () => {
  it('setup successfully', () => {
    const setupMock = coreMock.createSetup();
    const initializerContext = coreMock.createPluginInitializerContext();
    const pluginInstance = new IndexPatternManagementPlugin(initializerContext);
    expect(() =>
      pluginInstance.setup(setupMock, {
        urlForwarding: urlForwardingPluginMock.createSetupContract(),
        management: managementPluginMock.createSetupContract(),
      })
    ).not.toThrow();
    expect(setupMock.application.register).toBeCalledTimes(1);
    expect(setupMock.chrome.navGroup.addNavLinksToGroup).toBeCalledTimes(5);
  });
});
