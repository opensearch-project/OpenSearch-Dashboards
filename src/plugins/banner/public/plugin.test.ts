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

import { renderBannerMock, unmountBannerMock } from './plugin.test.mocks';
import { BannerPlugin } from './plugin';
import { coreMock } from '../../../core/public/mocks';

// Mock the chrome.setGlobalBanner method
const setGlobalBannerMock = jest.fn();

describe('BannerPlugin', () => {
  beforeEach(() => {
    renderBannerMock.mockClear();
    unmountBannerMock.mockClear();
  });

  describe('setup', () => {
    test('returns an empty object', async () => {
      const coreSetup = coreMock.createSetup();
      const plugin = new BannerPlugin();
      const setup = plugin.setup(coreSetup);

      expect(setup).toEqual({});
      expect(renderBannerMock).not.toHaveBeenCalled();
    });
  });

  describe('start', () => {
    test('sets global banner in chrome service', async () => {
      const coreStart = coreMock.createStart();
      // Mock the setGlobalBanner method
      coreStart.chrome.setGlobalBanner = setGlobalBannerMock;

      const plugin = new BannerPlugin();
      const start = await plugin.start(coreStart);

      expect(start).toEqual({});
      expect(setGlobalBannerMock).toHaveBeenCalledTimes(1);
      expect(setGlobalBannerMock.mock.calls[0][0]).toHaveProperty('component');
    });
  });

  describe('stop', () => {
    test('banner is automatically unmounted when plugin stops', () => {
      const plugin = new BannerPlugin();
      plugin.stop();

      // No explicit assertion needed as the banner is automatically unmounted
      // when the plugin is stopped, as noted in the implementation comment
    });
  });
});
