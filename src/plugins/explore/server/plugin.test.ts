/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../core/server/mocks';
import { ExplorePlugin } from './plugin';
import { capabilitiesProvider } from './capabilities_provider';

const mockInitializerContext = coreMock.createPluginInitializerContext();

describe('ExplorePlugin — capabilities and dynamic config feature flags', () => {
  describe('capabilitiesProvider', () => {
    it('keeps existing explore capabilities intact', () => {
      const caps = capabilitiesProvider();
      expect(caps.explore.show).toBe(true);
      expect(caps.explore.save).toBe(true);
    });
  });

  describe('setup — capability registration', () => {
    let plugin: ExplorePlugin;
    let core: ReturnType<typeof coreMock.createSetup>;

    beforeEach(() => {
      plugin = new ExplorePlugin(mockInitializerContext);
      core = coreMock.createSetup();
      (core as any).dynamicConfigService = {
        getStartService: jest.fn().mockRejectedValue(new Error('not available locally')),
      };
      plugin.setup(core as any);
    });

    it('registers capabilitiesProvider', () => {
      expect(core.capabilities.registerProvider).toHaveBeenCalledWith(capabilitiesProvider);
    });

    it('registers inline provider with discoverTracesEnabled and discoverMetricsEnabled false', () => {
      const calls = (core.capabilities.registerProvider as jest.Mock).mock.calls;
      const inlineProvider = calls[1][0];
      const result = inlineProvider();
      expect(result.explore.discoverTracesEnabled).toBe(false);
      expect(result.explore.discoverMetricsEnabled).toBe(false);
    });

    it('registers a capabilities switcher', () => {
      expect(core.capabilities.registerSwitcher).toHaveBeenCalled();
    });
  });

  describe('switcher — dynamic config fallback', () => {
    it('returns capabilities unchanged when dynamic config service is unavailable', async () => {
      const plugin = new ExplorePlugin(mockInitializerContext);
      const core = coreMock.createSetup();
      (core as any).dynamicConfigService = {
        getStartService: jest.fn().mockRejectedValue(new Error('not available')),
      };
      plugin.setup(core as any);

      const switcherCall = (core.capabilities.registerSwitcher as jest.Mock).mock.calls[0];
      const switcher = switcherCall[0];

      const mockCapabilities = {
        explore: { discoverTracesEnabled: false },
      } as any;
      const mockRequest = {} as any;

      const result = await switcher(mockRequest, mockCapabilities);
      expect(result).toBe(mockCapabilities);
    });

    it('applies discoverTracesEnabled from dynamic config when available', async () => {
      const plugin = new ExplorePlugin(mockInitializerContext);
      const core = coreMock.createSetup();
      (core as any).dynamicConfigService = {
        getStartService: jest.fn().mockResolvedValue({
          getClient: () => ({
            getConfig: jest.fn().mockResolvedValue({
              discoverTraces: { enabled: true },
              discoverMetrics: { enabled: false },
            }),
          }),
          getAsyncLocalStore: () => ({}),
        }),
      };
      plugin.setup(core as any);

      const switcherCall = (core.capabilities.registerSwitcher as jest.Mock).mock.calls[0];
      const switcher = switcherCall[0];

      const mockCapabilities = {
        explore: { discoverTracesEnabled: false },
      } as any;

      const result = await switcher({} as any, mockCapabilities);
      expect(result.explore.discoverTracesEnabled).toBe(true);
    });

    it('defaults discoverTracesEnabled to false when not in config', async () => {
      const plugin = new ExplorePlugin(mockInitializerContext);
      const core = coreMock.createSetup();
      (core as any).dynamicConfigService = {
        getStartService: jest.fn().mockResolvedValue({
          getClient: () => ({
            getConfig: jest.fn().mockResolvedValue({}),
          }),
          getAsyncLocalStore: () => ({}),
        }),
      };
      plugin.setup(core as any);

      const switcherCall = (core.capabilities.registerSwitcher as jest.Mock).mock.calls[0];
      const switcher = switcherCall[0];

      const mockCapabilities = { explore: { discoverTracesEnabled: false } } as any;
      const result = await switcher({} as any, mockCapabilities);
      expect(result.explore.discoverTracesEnabled).toBe(false);
    });
  });
});
