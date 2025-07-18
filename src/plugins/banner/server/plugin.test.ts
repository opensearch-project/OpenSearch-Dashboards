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

import { defineRoutesMock } from './plugin.test.mocks';
import { BannerPlugin } from './plugin';
import { coreMock, httpServiceMock } from '../../../core/server/mocks';
import { BehaviorSubject } from 'rxjs';
import { BannerPluginConfigType } from './config';

describe('BannerPlugin', () => {
  beforeEach(() => {
    defineRoutesMock.mockClear();
  });

  describe('setup', () => {
    let mockCoreSetup: ReturnType<typeof coreMock.createSetup>;
    let initContext: ReturnType<typeof coreMock.createPluginInitializerContext>;
    let routerMock: ReturnType<typeof httpServiceMock.createRouter>;
    let configSubject: BehaviorSubject<BannerPluginConfigType>;

    beforeEach(() => {
      mockCoreSetup = coreMock.createSetup();
      routerMock = httpServiceMock.createRouter();
      mockCoreSetup.http.createRouter.mockReturnValue(routerMock);

      // Create a config with default values
      configSubject = new BehaviorSubject<BannerPluginConfigType>({
        enabled: true,
        content: 'Test Banner Content',
        color: 'primary',
        iconType: 'iInCircle',
        isVisible: true,
        useMarkdown: true,
        size: 'm',
      });

      initContext = coreMock.createPluginInitializerContext();
      // Override the config.create method to return our configSubject
      jest.spyOn(initContext.config, 'create').mockReturnValue(configSubject);
    });

    test('registers routes and returns banner setup contract', async () => {
      const plugin = new BannerPlugin(initContext);
      const setup = await plugin.setup(mockCoreSetup);

      // Verify routes are registered
      expect(mockCoreSetup.http.createRouter).toHaveBeenCalledTimes(1);
      expect(defineRoutesMock).toHaveBeenCalledTimes(1);
      expect(defineRoutesMock).toHaveBeenCalledWith(routerMock, expect.anything());

      // Verify setup contract
      expect(setup).toHaveProperty('bannerEnabled');
      expect(setup).toHaveProperty('getConfig');
      expect(setup.bannerEnabled()).toBe(true);
      expect(setup.getConfig()).toEqual({
        content: 'Test Banner Content',
        color: 'primary',
        iconType: 'iInCircle',
        isVisible: true,
        useMarkdown: true,
        size: 'm',
      });
    });

    test('respects disabled config', async () => {
      // Update config to disable banner
      configSubject.next({
        enabled: false,
        content: 'Test Banner Content',
        color: 'primary',
        iconType: 'iInCircle',
        isVisible: true,
        useMarkdown: true,
        size: 'm',
      });

      const plugin = new BannerPlugin(initContext);
      const setup = await plugin.setup(mockCoreSetup);

      expect(setup.bannerEnabled()).toBe(false);
    });
  });

  describe('start', () => {
    test('returns an empty object', async () => {
      const initContext = coreMock.createPluginInitializerContext();
      const plugin = new BannerPlugin(initContext);
      const start = plugin.start(coreMock.createStart());

      expect(start).toEqual({});
    });
  });

  describe('stop', () => {
    test('does not throw errors', () => {
      const initContext = coreMock.createPluginInitializerContext();
      const plugin = new BannerPlugin(initContext);

      expect(() => plugin.stop()).not.toThrow();
    });
  });
});
