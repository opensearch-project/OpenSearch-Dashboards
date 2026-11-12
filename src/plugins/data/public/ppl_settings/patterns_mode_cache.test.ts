/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { patternsModeCache } from './patterns_mode_cache';

const ENDPOINT = '/api/enhancements/ppl/pattern_mode_settings';
const BARE_PATTERNS = 'source=logs | patterns message';

const createHttp = (response: unknown) =>
  ({
    get: jest.fn().mockResolvedValue(response),
  }) as any;

describe('patternsModeCache', () => {
  afterEach(() => {
    patternsModeCache.dispose();
  });

  it.each([
    ['no patterns command', 'source=logs | stats count() by host'],
    ['an explicit mode=label', 'source=logs | patterns message mode=label'],
    ['an explicit mode=aggregation', 'source=logs | patterns message mode=aggregation'],
    // Callers pass the masked query, so a patterns inside a string or subquery is already gone.
    ['a masked patterns', 'source=logs | where msg = \0\0\0\0\0\0\0\0\0\0\0\0'],
  ])('does not fetch for a query with %s', async (_, query) => {
    const http = createHttp({ patternMode: 'aggregation', patternModeMeasured: true });

    await expect(patternsModeCache.ensure(http, query)).resolves.toBeUndefined();

    expect(http.get).not.toHaveBeenCalled();
  });

  it('fetches once for a patterns without mode= and caches the result', async () => {
    const http = createHttp({ patternMode: 'aggregation', patternModeMeasured: true });

    await expect(patternsModeCache.ensure(http, BARE_PATTERNS)).resolves.toBe('aggregation');
    await expect(patternsModeCache.ensure(http, BARE_PATTERNS)).resolves.toBe('aggregation');

    expect(http.get).toHaveBeenCalledTimes(1);
    expect(http.get).toHaveBeenCalledWith(ENDPOINT, { query: {} });
    expect(patternsModeCache.getCached()).toBe('aggregation');
  });

  it('deduplicates concurrent requests for the same data source', async () => {
    const http = createHttp({ patternMode: 'label', patternModeMeasured: true });

    const results = await Promise.all([
      patternsModeCache.ensure(http, BARE_PATTERNS, 'ds-1'),
      patternsModeCache.ensure(http, BARE_PATTERNS, 'ds-1'),
    ]);

    expect(results).toEqual(['label', 'label']);
    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it('caches per data source and passes the dataSourceId', async () => {
    const http = {
      get: jest
        .fn()
        .mockResolvedValueOnce({ patternMode: 'aggregation', patternModeMeasured: true })
        .mockResolvedValueOnce({ patternMode: 'label', patternModeMeasured: true }),
    } as any;

    await patternsModeCache.ensure(http, BARE_PATTERNS, 'ds-1');
    await patternsModeCache.ensure(http, BARE_PATTERNS, 'ds-2');

    expect(http.get).toHaveBeenNthCalledWith(1, ENDPOINT, { query: { dataSourceId: 'ds-1' } });
    expect(http.get).toHaveBeenNthCalledWith(2, ENDPOINT, { query: { dataSourceId: 'ds-2' } });
    expect(patternsModeCache.getCached('ds-1')).toBe('aggregation');
    expect(patternsModeCache.getCached('ds-2')).toBe('label');
    expect(patternsModeCache.getCached()).toBeUndefined();
  });

  it.each([
    ['an unmeasured response', { patternMode: 'label', patternModeMeasured: false }],
    ['a response from an older server', { calciteEnabled: true }],
  ])('treats %s as unknown and does not ask again', async (_, response) => {
    const http = createHttp(response);

    await expect(patternsModeCache.ensure(http, BARE_PATTERNS)).resolves.toBeUndefined();
    await patternsModeCache.ensure(http, BARE_PATTERNS);

    expect(http.get).toHaveBeenCalledTimes(1);
    expect(patternsModeCache.getCached()).toBeUndefined();
  });

  it('resolves to unknown instead of rejecting when the request fails', async () => {
    const http = { get: jest.fn().mockRejectedValue(new Error('network')) } as any;

    await expect(patternsModeCache.ensure(http, BARE_PATTERNS)).resolves.toBeUndefined();
  });

  it('fetches again after invalidate', async () => {
    const http = createHttp({ patternMode: 'label', patternModeMeasured: true });

    await patternsModeCache.ensure(http, BARE_PATTERNS);
    patternsModeCache.invalidate();
    await patternsModeCache.ensure(http, BARE_PATTERNS);

    expect(http.get).toHaveBeenCalledTimes(2);
  });

  it('needsFetch is true only for an uncached patterns without mode=', async () => {
    const http = createHttp({ patternMode: 'label', patternModeMeasured: true });

    expect(patternsModeCache.needsFetch('source=logs | stats count()')).toBe(false);
    expect(patternsModeCache.needsFetch('source=logs | patterns message mode=label')).toBe(false);
    expect(patternsModeCache.needsFetch(BARE_PATTERNS, 'ds-1')).toBe(true);

    await patternsModeCache.ensure(http, BARE_PATTERNS, 'ds-1');

    expect(patternsModeCache.needsFetch(BARE_PATTERNS, 'ds-1')).toBe(false);
    expect(patternsModeCache.needsFetch(BARE_PATTERNS, 'ds-2')).toBe(true);
  });
});
