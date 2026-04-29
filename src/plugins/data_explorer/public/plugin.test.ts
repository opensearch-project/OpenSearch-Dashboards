/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../core/public/mocks';
import { DEFAULT_NAV_GROUPS } from '../../../core/public';
import { DataExplorerPlugin } from './plugin';
import { dataPluginMock } from '../../data/public/mocks';

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
});
