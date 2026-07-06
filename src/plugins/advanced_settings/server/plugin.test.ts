/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { of } from 'rxjs';
import { coreMock, httpServerMock } from '../../../core/server/mocks';
import { AdvancedSettingsServerPlugin } from './plugin';
import { extractUserName } from './utils';

jest.mock('./utils', () => ({
  extractUserName: jest.fn(),
}));

const extractUserNameMock = extractUserName as jest.Mock;

// Builds a plugin initializer context whose legacy global config reports the given
// saved-objects permission.enabled value.
const createInitializerContext = (permissionEnabled: boolean) => {
  const context = coreMock.createPluginInitializerContext();
  context.config.legacy.globalConfig$ = of({
    savedObjects: { permission: { enabled: permissionEnabled } },
  }) as any;
  return context;
};

// Runs setup and returns the capabilities switcher that resolves userSettings and
// advancedSettings.permissionControlEnabled (registered third).
const setupAndGetUserSettingsSwitcher = async (permissionEnabled: boolean) => {
  const coreSetup = coreMock.createSetup();
  const plugin = new AdvancedSettingsServerPlugin(createInitializerContext(permissionEnabled));
  await plugin.setup(coreSetup);
  const switchers = coreSetup.capabilities.registerSwitcher.mock.calls.map(([fn]) => fn);
  return switchers[switchers.length - 1];
};

describe('AdvancedSettingsServerPlugin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a capabilities provider and switchers on setup', async () => {
    const coreSetup = coreMock.createSetup();
    const plugin = new AdvancedSettingsServerPlugin(createInitializerContext(true));

    await expect(plugin.setup(coreSetup)).resolves.toEqual({});
    expect(coreSetup.capabilities.registerProvider).toHaveBeenCalledTimes(1);
    expect(coreSetup.capabilities.registerSwitcher).toHaveBeenCalledTimes(3);
  });

  it('reports permissionControlEnabled=true and enables userSettings when a user is resolved', async () => {
    extractUserNameMock.mockReturnValue('some-user');
    const switcher = await setupAndGetUserSettingsSwitcher(true);

    const result: any = await switcher(httpServerMock.createOpenSearchDashboardsRequest(), {
      advancedSettings: { show: true },
    } as any);

    expect(result.advancedSettings.permissionControlEnabled).toBe(true);
    expect(result.userSettings.enabled).toBe(true);
    // Existing advancedSettings capabilities are preserved.
    expect(result.advancedSettings.show).toBe(true);
  });

  it('disables userSettings when no authenticated user can be resolved', async () => {
    extractUserNameMock.mockReturnValue(undefined);
    const switcher = await setupAndGetUserSettingsSwitcher(true);

    const result: any = await switcher(httpServerMock.createOpenSearchDashboardsRequest(), {
      advancedSettings: {},
    } as any);

    expect(result.userSettings.enabled).toBe(false);
  });

  it('reports permissionControlEnabled=false when permission control is disabled', async () => {
    extractUserNameMock.mockReturnValue('some-user');
    const switcher = await setupAndGetUserSettingsSwitcher(false);

    const result: any = await switcher(httpServerMock.createOpenSearchDashboardsRequest(), {
      advancedSettings: {},
    } as any);

    expect(result.advancedSettings.permissionControlEnabled).toBe(false);
    // A user is resolved, so userSettings stays enabled regardless of permission control.
    expect(result.userSettings.enabled).toBe(true);
  });
});
