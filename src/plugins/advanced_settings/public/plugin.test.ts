/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { managementPluginMock } from '../../management/public/mocks';
import { coreMock } from '../../../core/public/mocks';
import { AdvancedSettingsPlugin } from './plugin';
import { homePluginMock } from '../../home/public/mocks';
import { WorkspaceAvailability } from '../../../core/public';

describe('AdvancedSettingsPlugin', () => {
  it('setup successfully', () => {
    const pluginInstance = new AdvancedSettingsPlugin();
    const setupMock = coreMock.createSetup();
    expect(() =>
      // @ts-expect-error TS2345 TODO(ts-error): fixme
      pluginInstance.setup(setupMock, {
        management: managementPluginMock.createSetupContract(),
        home: homePluginMock.createSetupContract(),
      })
    ).not.toThrow();
    expect(setupMock.application.register).toBeCalledTimes(1);
  });
});

describe('AdvancedSettingsPlugin with nav group enabled', () => {
  const setupWithNavGroup = () => {
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
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    pluginInstance.setup(setupMock, {
      management: managementPluginMock.createSetupContract(),
      home: homePluginMock.createSetupContract(),
    });
    return { setupMock };
  };

  it('registers the application, user and workspace settings apps', () => {
    const { setupMock } = setupWithNavGroup();

    // application settings + user settings + workspace settings
    expect(setupMock.application.register).toHaveBeenCalledTimes(3);
    const registeredIds = setupMock.application.register.mock.calls.map(([app]) => app.id);
    expect(registeredIds).toEqual(expect.arrayContaining(['user_settings', 'workspace_settings']));
  });

  it('registers user and workspace apps with the correct workspace availability', () => {
    const { setupMock } = setupWithNavGroup();
    const registrations = setupMock.application.register.mock.calls.map(([app]) => app);

    const userApp = registrations.find((app) => app.id === 'user_settings');
    const workspaceApp = registrations.find((app) => app.id === 'workspace_settings');

    // User settings live outside a workspace; workspace settings only inside one.
    expect(userApp?.workspaceAvailability).toBe(WorkspaceAvailability.outsideWorkspace);
    expect(workspaceApp?.workspaceAvailability).toBe(WorkspaceAvailability.insideWorkspace);
  });
});
