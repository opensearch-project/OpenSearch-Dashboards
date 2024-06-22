/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDefaultSearchParams, getAsyncOptions } from './get_default_search_params';
import { UI_SETTINGS } from '../../../common/constants';
import { IUiSettingsClient } from 'src/core/server';

import { coreMock } from '../../../../../../src/core/server/mocks';

describe('getDefaultSearchParams', () => {
  let uiSettings: IUiSettingsClient;

  beforeEach(async () => {
    const coreContext = coreMock.createRequestHandlerContext();
    uiSettings = coreContext.uiSettings.client;
  });

  describe('getDefaultSearchParams', () => {
    describe('maxConcurrentShardRequests', () => {
      it('returns as undefined if less than 0', async () => {
        uiSettings.get = jest.fn().mockReturnValue(-1);
        const result = await getDefaultSearchParams(uiSettings);
        expect(result.maxConcurrentShardRequests).toBeUndefined();
      });

      it('returns as value if greater than 0', async () => {
        uiSettings.get = jest.fn().mockReturnValue(5);
        const result = await getDefaultSearchParams(uiSettings);
        expect(result.maxConcurrentShardRequests).toBe(5);
      });
    });

    describe('ignoreThrottled', () => {
      it('returns as true if false', async () => {
        uiSettings.get = jest.fn().mockReturnValue(false);
        const result = await getDefaultSearchParams(uiSettings);
        expect(result.ignoreThrottled).toBe(true);
      });

      it('returns as false if true', async () => {
        uiSettings.get = jest.fn().mockReturnValue(true);
        const result = await getDefaultSearchParams(uiSettings);
        expect(result.ignoreThrottled).toBe(false);
      });
    });

    describe('dataFrameHydrationStrategy', () => {
      it('returns correct value', async () => {
        uiSettings.get = jest.fn().mockReturnValue('strategy');
        const result = await getDefaultSearchParams(uiSettings);
        expect(result.dataFrameHydrationStrategy).toBe('strategy');
      });
    });

    it('returns correct search params', async () => {
      uiSettings.get = jest.fn().mockImplementation((setting: string) => {
        switch (setting) {
          case UI_SETTINGS.SEARCH_INCLUDE_FROZEN:
            return false;
          case UI_SETTINGS.COURIER_MAX_CONCURRENT_SHARD_REQUESTS:
            return 5;
          case UI_SETTINGS.QUERY_DATAFRAME_HYDRATION_STRATEGY:
            return 'strategy';
          default:
            return undefined;
        }
      });

      const result = await getDefaultSearchParams(uiSettings);
      expect(result).toEqual({
        maxConcurrentShardRequests: 5,
        ignoreThrottled: true,
        dataFrameHydrationStrategy: 'strategy',
        ignoreUnavailable: true,
        trackTotalHits: true,
      });
    });
  });

  describe('getAsyncOptions', () => {
    it('returns correct async options', () => {
      expect(getAsyncOptions()).toEqual({
        waitForCompletionTimeout: '100ms',
        keepAlive: '1m',
      });
    });
  });
});
