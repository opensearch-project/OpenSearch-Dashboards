/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { httpServerMock, loggingSystemMock } from '../../../../core/server/mocks';
import { IDynamicConfigurationClient } from '../../../../core/server';
import { WORKSPACE_PLUGIN_CONFIG_PATH } from '../../common/constants';
import { ConfigSchema } from '../../config';
import { DynamicConfigServiceSetup, WorkspaceConfigService } from './workspace_config_service';

const createStartServiceMock = (
  options: {
    getConfig?: jest.Mock;
    asyncLocalStore?: Map<string, any>;
    storeFromRequest?: Map<string, any>;
  } = {}
) => {
  const getConfig = options.getConfig ?? jest.fn().mockResolvedValue({});
  // Only fall back to a populated store when the key is absent, so a test can opt into
  // an unresolvable context by passing an explicit undefined.
  const asyncLocalStore =
    'asyncLocalStore' in options ? options.asyncLocalStore : new Map<string, any>([['a', 'b']]);
  const storeFromRequest =
    'storeFromRequest' in options
      ? options.storeFromRequest
      : new Map<string, any>([['a', 'from-request']]);
  const client = { getConfig } as unknown as IDynamicConfigurationClient;

  return {
    getClient: jest.fn().mockReturnValue(client),
    getAsyncLocalStore: jest.fn().mockReturnValue(asyncLocalStore),
    createStoreFromRequest: jest.fn().mockReturnValue(storeFromRequest),
  };
};

const staticConfig = (maximumWorkspaces?: number): ConfigSchema => ({
  enabled: true,
  maximum_workspaces: maximumWorkspaces,
  aclEnforceEndpointPatterns: [],
});

describe('WorkspaceConfigService', () => {
  const request = httpServerMock.createOpenSearchDashboardsRequest();
  const logger = loggingSystemMock.create().get();

  const setupService = (
    startService: ReturnType<typeof createStartServiceMock>,
    maximumWorkspaces?: number
  ) => {
    const dynamicConfigService = {
      registerDynamicConfigClientFactory: jest.fn(),
      registerAsyncLocalStoreRequestHeader: jest.fn(),
      getStartService: jest.fn().mockResolvedValue(startService),
    } as unknown as jest.Mocked<DynamicConfigServiceSetup>;

    const service = new WorkspaceConfigService(logger);
    service.setup({ dynamicConfigService, staticConfig: staticConfig(maximumWorkspaces) });

    return service;
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('throws when asked for a client before setup', () => {
    expect(() =>
      new WorkspaceConfigService(logger).asScopedToRequest(request)
    ).toThrowErrorMatchingInlineSnapshot(
      `"WorkspaceConfigService#setup must be called before asScopedToRequest"`
    );
  });

  describe('get', () => {
    it('gets the config under the workspace plugin config path', async () => {
      const getConfig = jest.fn().mockResolvedValue({ maximum_workspaces: 3000 });
      const asyncLocalStore = new Map<string, any>([['header', 'value']]);
      const service = setupService(createStartServiceMock({ getConfig, asyncLocalStore }), 100);

      await expect(service.asScopedToRequest(request).get()).resolves.toEqual({
        enabled: true,
        maximum_workspaces: 3000,
        aclEnforceEndpointPatterns: [],
      });
      expect(getConfig).toHaveBeenCalledWith(
        { pluginConfigPath: WORKSPACE_PLUGIN_CONFIG_PATH },
        { asyncLocalStorageContext: asyncLocalStore }
      );
    });

    it('derives the context from the request when the async local store is absent', async () => {
      const getConfig = jest.fn().mockResolvedValue({});
      const storeFromRequest = new Map<string, any>([['a', 'from-request']]);
      const startService = createStartServiceMock({
        getConfig,
        asyncLocalStore: undefined,
        storeFromRequest,
      });

      await setupService(startService).asScopedToRequest(request).get();

      expect(startService.createStoreFromRequest).toHaveBeenCalledWith(request);
      expect(getConfig).toHaveBeenCalledWith(expect.anything(), {
        asyncLocalStorageContext: storeFromRequest,
      });
    });

    it('falls back to the static config and warns when no context can be resolved', async () => {
      const service = setupService(
        createStartServiceMock({ asyncLocalStore: undefined, storeFromRequest: undefined }),
        100
      );

      await expect(service.asScopedToRequest(request).get()).resolves.toEqual(staticConfig(100));
      expect(logger.warn).toHaveBeenCalled();
    });

    it('falls back to the static config and warns when the client throws', async () => {
      const service = setupService(
        createStartServiceMock({
          getConfig: jest.fn().mockRejectedValue(new Error('config store unavailable')),
        }),
        100
      );

      await expect(service.asScopedToRequest(request).get()).resolves.toEqual(staticConfig(100));
      expect(logger.warn).toHaveBeenCalled();
    });

    it('resolves the config once per scoped client', async () => {
      const getConfig = jest.fn().mockResolvedValue({ maximum_workspaces: 3000 });
      const client = setupService(createStartServiceMock({ getConfig })).asScopedToRequest(request);

      await Promise.all([client.get(), client.get(), client.getMaximumWorkspaces()]);

      expect(getConfig).toHaveBeenCalledTimes(1);
    });
  });

  describe('getMaximumWorkspaces', () => {
    it('prefers the dynamic config value', async () => {
      const service = setupService(
        createStartServiceMock({
          getConfig: jest.fn().mockResolvedValue({ maximum_workspaces: 5000 }),
        }),
        100
      );

      await expect(service.asScopedToRequest(request).getMaximumWorkspaces()).resolves.toBe(5000);
    });

    it('falls back to the static value when the dynamic config has no maximum', async () => {
      const service = setupService(createStartServiceMock(), 100);

      await expect(service.asScopedToRequest(request).getMaximumWorkspaces()).resolves.toBe(100);
    });

    it('falls back to the static value when the dynamic config cannot be read', async () => {
      const service = setupService(
        createStartServiceMock({
          getConfig: jest.fn().mockRejectedValue(new Error('config store unavailable')),
        }),
        100
      );

      await expect(service.asScopedToRequest(request).getMaximumWorkspaces()).resolves.toBe(100);
    });

    it('returns undefined when neither source configures a maximum', async () => {
      const service = setupService(createStartServiceMock());

      await expect(
        service.asScopedToRequest(request).getMaximumWorkspaces()
      ).resolves.toBeUndefined();
    });

    it('ignores non-positive and non-numeric values', async () => {
      for (const maximumWorkspaces of [0, -1, 'not-a-number', null]) {
        const service = setupService(
          createStartServiceMock({
            getConfig: jest.fn().mockResolvedValue({ maximum_workspaces: maximumWorkspaces }),
          }),
          100
        );

        await expect(service.asScopedToRequest(request).getMaximumWorkspaces()).resolves.toBe(100);
      }
    });
  });
});
