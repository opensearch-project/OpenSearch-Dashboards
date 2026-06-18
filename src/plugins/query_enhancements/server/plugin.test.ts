/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock, dynamicConfigServiceMock } from '../../../core/server/mocks';
import { dataPluginMock } from '../../data/server/mocks';
import { QueryEnhancementsPlugin } from './plugin';

describe('QueryEnhancementsPlugin pplLint capability', () => {
  const baseCapabilities = () =>
    ({
      navLinks: {},
      management: {},
      catalogue: {},
      queryEnhancements: { pplLint: false },
    } as any);

  // Run the real setup() against core mocks and hand back the registered
  // capability switcher plus the plugin's logger so the catch path is
  // observable. No production change is needed — the switcher is captured from
  // the registerSwitcher mock.
  const setupPlugin = () => {
    const initializerContext = coreMock.createPluginInitializerContext();
    const plugin = new QueryEnhancementsPlugin(initializerContext);
    const core = coreMock.createSetup();
    const deps = { data: dataPluginMock.createSetupContract() } as any;

    plugin.setup(core, deps);

    const registerSwitcher = core.capabilities.registerSwitcher as jest.Mock;
    const switcher = registerSwitcher.mock.calls[0][0];
    // this.logger = initializerContext.logger.get(); the loggingSystem mock
    // shares one logger instance, so this is the same logger the plugin holds.
    const logger = initializerContext.logger.get();
    return { core, switcher, logger };
  };

  const stubConfig = (
    core: any,
    getConfig: Record<string, any>,
    asyncLocalStore?: Map<string, any>
  ) => {
    const startContract = dynamicConfigServiceMock.createStartContract(
      {
        getConfig,
        bulkGetConfigs: new Map(),
        listConfigs: new Map(),
      },
      asyncLocalStore
    );
    core.dynamicConfigService.getStartService.mockResolvedValue(startContract);
    return startContract;
  };

  it('registers a disabled-by-default pplLint capability provider', () => {
    const { core } = setupPlugin();
    const registerProvider = core.capabilities.registerProvider as jest.Mock;
    const provided = registerProvider.mock.calls[0][0]();
    expect(provided).toEqual({ queryEnhancements: { pplLint: false } });
  });

  it('enables pplLint when the dynamic config flag is on', async () => {
    const { core, switcher } = setupPlugin();
    const startContract = stubConfig(core, { pplLint: { enabled: true } });

    const result = await switcher({} as any, baseCapabilities());

    expect(result.queryEnhancements.pplLint).toBe(true);
    // Guard the documented footgun: the lookup MUST use pluginConfigPath, not
    // { name: 'queryEnhancements' } (which snake-cases to the wrong namespace,
    // throws, gets swallowed, and disables pplLint forever). The shared mock
    // returns the stub for any argument, so without this assertion a regression
    // to { name } would pass every test.
    const getConfigMock = startContract.getClient().getConfig as jest.Mock;
    expect(getConfigMock).toHaveBeenCalledTimes(1);
    expect(getConfigMock.mock.calls[0][0]).toEqual({ pluginConfigPath: ['queryEnhancements'] });
  });

  it('passes the async local store as context when one is present', async () => {
    const { core, switcher } = setupPlugin();
    const store = new Map<string, any>([['k', 'v']]);
    const startContract = stubConfig(core, { pplLint: { enabled: true } }, store);

    await switcher({} as any, baseCapabilities());

    const getConfigMock = startContract.getClient().getConfig as jest.Mock;
    expect(getConfigMock.mock.calls[0][1]).toEqual({ asyncLocalStorageContext: store });
  });

  it('omits the options object when no async local store is present', async () => {
    const { core, switcher } = setupPlugin();
    // No store passed → getAsyncLocalStore() returns undefined. The switcher
    // must pass `undefined` rather than { asyncLocalStorageContext: undefined }.
    const startContract = stubConfig(core, { pplLint: { enabled: true } });

    await switcher({} as any, baseCapabilities());

    const getConfigMock = startContract.getClient().getConfig as jest.Mock;
    expect(getConfigMock.mock.calls[0][1]).toBeUndefined();
  });

  it('coerces a non-boolean stored flag to false (unvalidated dynamic config)', async () => {
    const { core, switcher } = setupPlugin();
    // Dynamic config writes are not schema-validated, so the store can hold a
    // string. Only a real boolean `true` may enable the flag.
    stubConfig(core, { pplLint: { enabled: 'true' } } as any);

    const result = await switcher({} as any, baseCapabilities());

    expect(result.queryEnhancements.pplLint).toBe(false);
  });

  it('leaves pplLint off when the dynamic config flag is false', async () => {
    const { core, switcher } = setupPlugin();
    stubConfig(core, { pplLint: { enabled: false } });

    const result = await switcher({} as any, baseCapabilities());

    expect(result.queryEnhancements.pplLint).toBe(false);
  });

  it('leaves pplLint off when the dynamic config is absent', async () => {
    const { core, switcher } = setupPlugin();
    stubConfig(core, {});

    const result = await switcher({} as any, baseCapabilities());

    expect(result.queryEnhancements.pplLint).toBe(false);
  });

  it('returns capabilities unchanged and logs when loading dynamic config throws', async () => {
    const { core, switcher, logger } = setupPlugin();
    core.dynamicConfigService.getStartService.mockRejectedValue(new Error('no config store'));

    const capabilities = baseCapabilities();
    const result = await switcher({} as any, capabilities);

    expect(result).toBe(capabilities);
    expect(result.queryEnhancements.pplLint).toBe(false);
    expect(logger.error).toHaveBeenCalled();
  });
});
