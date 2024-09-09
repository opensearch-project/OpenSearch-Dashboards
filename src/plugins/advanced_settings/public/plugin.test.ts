/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { managementPluginMock } from '../../management/public/mocks';
import { coreMock } from '../../../core/public/mocks';
import { AdvancedSettingsPlugin } from './plugin';
import { homePluginMock } from '../../home/public/mocks';

describe('AdvancedSettingsPlugin', () => {
  it('setup successfully', () => {
    const pluginInstance = new AdvancedSettingsPlugin();
    const setupMock = coreMock.createSetup();
    expect(() =>
      pluginInstance.setup(setupMock, {
        management: managementPluginMock.createSetupContract(),
        home: homePluginMock.createSetupContract(),
      })
    ).not.toThrow();
    expect(setupMock.application.register).toBeCalledTimes(1);
  });
});

describe('UserSettingsPlugin', () => {
  it('setup successfully', () => {
    const pluginInstance = new AdvancedSettingsPlugin();
    const setupMock = {
      ...coreMock.createSetup(),
      chrome: {
        ...coreMock.createSetup().chrome,
        navGroup: {
          ...coreMock.createSetup().chrome.navGroup,
          getNavGroupEnabled: () => true,
        },
      },
    };
    expect(() =>
      pluginInstance.setup(setupMock, {
        management: managementPluginMock.createSetupContract(),
        home: homePluginMock.createSetupContract(),
      })
    ).not.toThrow();
    expect(setupMock.application.register).toHaveBeenCalledTimes(2);
  });
});
