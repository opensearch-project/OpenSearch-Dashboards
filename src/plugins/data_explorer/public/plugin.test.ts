/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../core/public/mocks';
import { DEFAULT_NAV_GROUPS } from '../../../core/public';
import { DataExplorerPlugin } from './plugin';
import { dataPluginMock } from '../../data/public/mocks';
import { embeddablePluginMock } from '../../embeddable/public/mocks';
import { expressionsPluginMock } from '../../expressions/public/mocks';
import { PLUGIN_ID } from '../common';
import { renderApp } from './application';
import { getPreloadedStore } from './utils/state_management';

jest.mock('./application', () => ({
  renderApp: jest.fn(() => jest.fn()),
}));

jest.mock('./utils/state_management', () => ({
  getPreloadedStore: jest.fn(async () => ({ store: {}, unsubscribe: jest.fn() })),
}));

const getSetupDeps = () => ({
  data: dataPluginMock.createSetupContract(),
  usageCollection: { reportUiCounter: jest.fn(), METRIC_TYPE: {} } as any,
});

describe('DataExplorerPlugin', () => {
  it('should not register data_explorer in observability when icon side nav is enabled', () => {
    const setupMock = coreMock.createSetup();
    setupMock.chrome.getIsIconSideNavEnabled.mockReturnValue(true);
    const pluginInstance = new DataExplorerPlugin();
    pluginInstance.setup(setupMock, getSetupDeps());

    const observabilityCall = setupMock.chrome.navGroup.addNavLinksToGroup.mock.calls.find(
      (call) => call[0] === DEFAULT_NAV_GROUPS.observability
    );
    expect(observabilityCall).toBeUndefined();
  });

  it('should register data_explorer in observability when icon side nav is disabled', () => {
    const setupMock = coreMock.createSetup();
    setupMock.chrome.getIsIconSideNavEnabled.mockReturnValue(false);
    const pluginInstance = new DataExplorerPlugin();
    pluginInstance.setup(setupMock, getSetupDeps());

    const observabilityCall = setupMock.chrome.navGroup.addNavLinksToGroup.mock.calls.find(
      (call) => call[0] === DEFAULT_NAV_GROUPS.observability
    );
    expect(observabilityCall).toBeDefined();
    expect(observabilityCall![1]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'data-explorer',
          order: 301,
          euiIconType: 'discoverApp',
        }),
      ])
    );
  });

  it('sets the initial view active nav link during mount without clearing it on unmount', async () => {
    const coreStart = coreMock.createStart();
    const pluginsStart = {
      data: dataPluginMock.createStartContract(),
      embeddable: embeddablePluginMock.createStartContract(),
      expressions: expressionsPluginMock.createStartContract(),
    };
    const setupMock = coreMock.createSetup({ pluginStartDeps: pluginsStart });
    setupMock.getStartServices.mockResolvedValue([coreStart, pluginsStart, {}]);
    const pluginInstance = new DataExplorerPlugin();
    const setup = pluginInstance.setup(setupMock, getSetupDeps());
    setup.registerView({
      id: 'discover',
      title: 'Discover',
      activeNavLinkId: 'discover',
    } as any);
    const dataExplorerApp = setupMock.application.register.mock.calls
      .map(([app]) => app)
      .find(({ id }) => id === 'data-explorer');

    const unmount = await dataExplorerApp!.mount({
      element: document.createElement('div'),
      history: {
        location: { pathname: '/discover', search: '', hash: '' },
        listen: jest.fn(() => jest.fn()),
      },
    } as any);

    expect(coreStart.chrome.setActiveNavLink).toHaveBeenCalledWith('discover', PLUGIN_ID);
    expect(coreStart.chrome.setActiveNavLink.mock.invocationCallOrder[0]).toBeLessThan(
      (getPreloadedStore as jest.Mock).mock.invocationCallOrder[0]
    );
    expect(renderApp).toHaveBeenCalled();

    const callsBeforeUnmount = coreStart.chrome.setActiveNavLink.mock.calls.length;
    unmount();
    expect(coreStart.chrome.setActiveNavLink).toHaveBeenCalledTimes(callsBeforeUnmount);
  });
});
