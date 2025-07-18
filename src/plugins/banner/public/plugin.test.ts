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
    test('calls renderBanner with http client', async () => {
      const coreStart = coreMock.createStart();
      const plugin = new BannerPlugin();
      const start = await plugin.start(coreStart);

      expect(start).toEqual({});
      expect(renderBannerMock).toHaveBeenCalledTimes(1);
      expect(renderBannerMock).toHaveBeenCalledWith(coreStart.http);
    });
  });

  describe('stop', () => {
    test('calls unmountBanner', () => {
      const plugin = new BannerPlugin();
      plugin.stop();

      expect(unmountBannerMock).toHaveBeenCalledTimes(1);
    });
  });
});
