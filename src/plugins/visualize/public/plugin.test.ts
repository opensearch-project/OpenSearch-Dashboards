/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../core/public/mocks';
import { DEFAULT_NAV_GROUPS } from '../../../core/public';
import { VisualizePlugin } from './plugin';
import { dataPluginMock } from '../../data/public/mocks';
import { urlForwardingPluginMock } from '../../url_forwarding/public/mocks';
import { uiActionsPluginMock } from '../../ui_actions/public/mocks';

const getSetupDeps = () => ({
  data: dataPluginMock.createSetupContract(),
  urlForwarding: urlForwardingPluginMock.createSetupContract(),
  uiActions: uiActionsPluginMock.createSetupContract(),
});

describe('VisualizePlugin', () => {
  it('should not register visualize in observability when icon side nav is enabled', async () => {
    const setupMock = coreMock.createSetup();
    setupMock.chrome.getIsIconSideNavEnabled.mockReturnValue(true);
    const initializerContext = coreMock.createPluginInitializerContext();
    const pluginInstance = new VisualizePlugin(initializerContext);
    await pluginInstance.setup(setupMock, getSetupDeps());

    const observabilityCall = setupMock.chrome.navGroup.addNavLinksToGroup.mock.calls.find(
      (call) => call[0] === DEFAULT_NAV_GROUPS.observability
    );
    expect(observabilityCall).toBeUndefined();
  });

  it('should register visualize in observability when icon side nav is disabled', async () => {
    const setupMock = coreMock.createSetup();
    setupMock.chrome.getIsIconSideNavEnabled.mockReturnValue(false);
    const initializerContext = coreMock.createPluginInitializerContext();
    const pluginInstance = new VisualizePlugin(initializerContext);
    await pluginInstance.setup(setupMock, getSetupDeps());

    const observabilityCall = setupMock.chrome.navGroup.addNavLinksToGroup.mock.calls.find(
      (call) => call[0] === DEFAULT_NAV_GROUPS.observability
    );
    expect(observabilityCall).toBeDefined();
    expect(observabilityCall![1]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'visualize',
          order: 100,
          euiIconType: 'visualizeApp',
        }),
      ])
    );
  });
});
