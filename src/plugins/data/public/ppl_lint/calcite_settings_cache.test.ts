/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from '../../../../core/public';
import { calciteSettingsCache } from './calcite_settings_cache';

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
};

describe('calciteSettingsCache', () => {
  let http: jest.Mocked<HttpSetup>;

  beforeEach(() => {
    calciteSettingsCache.dispose();
    http = ({
      get: jest.fn(),
    } as unknown) as jest.Mocked<HttpSetup>;
  });

  afterEach(() => {
    calciteSettingsCache.dispose();
  });

  it('returns undefined before warmUp is called', () => {
    expect(calciteSettingsCache.getCached('ds-1')).toBeUndefined();
    expect(calciteSettingsCache.getCached(undefined)).toBeUndefined();
  });

  it('caches a successful fetch and returns via getCached', async () => {
    http.get.mockResolvedValue({ calciteEnabled: true, allJoinTypesAllowed: true });

    calciteSettingsCache.warmUp(http, 'ds-1');
    await flushPromises();

    const cached = calciteSettingsCache.getCached('ds-1');
    expect(cached).toEqual({ calciteEnabled: true, allJoinTypesAllowed: true });
    expect(http.get).toHaveBeenCalledWith('/api/enhancements/ppl/calcite_settings', {
      query: { dataSourceId: 'ds-1' },
    });
  });

  it('uses an empty key for local cluster (no dataSourceId)', async () => {
    http.get.mockResolvedValue({ calciteEnabled: true, allJoinTypesAllowed: false });

    calciteSettingsCache.warmUp(http, undefined);
    await flushPromises();

    expect(calciteSettingsCache.getCached(undefined)).toEqual({
      calciteEnabled: true,
      allJoinTypesAllowed: false,
    });
    expect(http.get).toHaveBeenCalledWith('/api/enhancements/ppl/calcite_settings', { query: {} });
  });

  it('deduplicates in-flight requests for the same dataSourceId', async () => {
    http.get.mockResolvedValue({ calciteEnabled: true, allJoinTypesAllowed: false });

    calciteSettingsCache.warmUp(http, 'ds-1');
    calciteSettingsCache.warmUp(http, 'ds-1');
    calciteSettingsCache.warmUp(http, 'ds-1');
    await flushPromises();

    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it('does not refetch once cached', async () => {
    http.get.mockResolvedValue({ calciteEnabled: true, allJoinTypesAllowed: false });

    calciteSettingsCache.warmUp(http, 'ds-1');
    await flushPromises();

    calciteSettingsCache.warmUp(http, 'ds-1');
    await flushPromises();

    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it('allows different data sources to be cached independently', async () => {
    http.get
      .mockResolvedValueOnce({ calciteEnabled: true, allJoinTypesAllowed: true })
      .mockResolvedValueOnce({ calciteEnabled: true, allJoinTypesAllowed: false });

    calciteSettingsCache.warmUp(http, 'ds-1');
    calciteSettingsCache.warmUp(http, 'ds-2');
    await flushPromises();

    expect(calciteSettingsCache.getCached('ds-1')).toEqual({
      calciteEnabled: true,
      allJoinTypesAllowed: true,
    });
    expect(calciteSettingsCache.getCached('ds-2')).toEqual({
      calciteEnabled: true,
      allJoinTypesAllowed: false,
    });
  });

  it('notifies listeners on successful fetch', async () => {
    http.get.mockResolvedValue({ calciteEnabled: true, allJoinTypesAllowed: true });
    const listener = jest.fn();

    calciteSettingsCache.subscribe(listener);
    calciteSettingsCache.warmUp(http, 'ds-1');
    await flushPromises();

    expect(listener).toHaveBeenCalledWith({ dataSourceId: 'ds-1' });
  });

  it('unsubscribe stops notifications', async () => {
    http.get.mockResolvedValue({ calciteEnabled: true, allJoinTypesAllowed: true });
    const listener = jest.fn();

    const unsub = calciteSettingsCache.subscribe(listener);
    unsub();
    calciteSettingsCache.warmUp(http, 'ds-1');
    await flushPromises();

    expect(listener).not.toHaveBeenCalled();
  });

  it('swallows fetch errors gracefully (getCached returns undefined)', async () => {
    http.get.mockRejectedValue(new Error('network error'));

    calciteSettingsCache.warmUp(http, 'ds-1');
    await flushPromises();

    expect(calciteSettingsCache.getCached('ds-1')).toBeUndefined();
  });

  it('does not cache a malformed response', async () => {
    http.get.mockResolvedValue({ calciteEnabled: 'yes' });

    calciteSettingsCache.warmUp(http, 'ds-1');
    await flushPromises();

    expect(calciteSettingsCache.getCached('ds-1')).toBeUndefined();
  });

  it('invalidate removes a cached entry and allows re-fetch', async () => {
    http.get.mockResolvedValue({ calciteEnabled: true, allJoinTypesAllowed: false });

    calciteSettingsCache.warmUp(http, 'ds-1');
    await flushPromises();
    expect(calciteSettingsCache.getCached('ds-1')).toBeDefined();

    calciteSettingsCache.invalidate('ds-1');
    expect(calciteSettingsCache.getCached('ds-1')).toBeUndefined();

    // Re-fetch after invalidation
    http.get.mockResolvedValue({ calciteEnabled: true, allJoinTypesAllowed: true });
    calciteSettingsCache.warmUp(http, 'ds-1');
    await flushPromises();
    expect(calciteSettingsCache.getCached('ds-1')).toEqual({
      calciteEnabled: true,
      allJoinTypesAllowed: true,
    });
  });

  it('dispose clears everything', async () => {
    http.get.mockResolvedValue({ calciteEnabled: true, allJoinTypesAllowed: true });
    const listener = jest.fn();

    calciteSettingsCache.subscribe(listener);
    calciteSettingsCache.warmUp(http, 'ds-1');
    await flushPromises();

    calciteSettingsCache.dispose();
    expect(calciteSettingsCache.getCached('ds-1')).toBeUndefined();

    // Listener should be cleared — no notifications from subsequent warmUps
    http.get.mockResolvedValue({ calciteEnabled: true, allJoinTypesAllowed: false });
    calciteSettingsCache.warmUp(http, 'ds-1');
    await flushPromises();
    expect(listener).toHaveBeenCalledTimes(1); // only the first call, not after dispose
  });
});
