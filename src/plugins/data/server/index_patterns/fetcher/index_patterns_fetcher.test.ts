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

import {
  IndexPatternsFetcher,
  __getFieldCapsInFlightSizeForTests,
  __resetFieldCapsCacheForTests,
} from './index_patterns_fetcher';
import * as lib from './lib';

jest.mock('./lib', () => {
  const actual = jest.requireActual('./lib');
  return {
    ...actual,
    getFieldCapabilities: jest.fn(),
  };
});

const mockedGetFieldCapabilities = lib.getFieldCapabilities as jest.MockedFunction<
  typeof lib.getFieldCapabilities
>;

const stubFields = (names: string[]) =>
  names.map((name) => ({
    aggregatable: true,
    name,
    readFromDocValues: true,
    searchable: true,
    type: 'string',
    esTypes: ['text'],
  }));

describe('IndexPatternsFetcher.getFieldsForWildcard cache + dedupe', () => {
  beforeEach(() => {
    __resetFieldCapsCacheForTests();
    mockedGetFieldCapabilities.mockReset();
  });

  test('serves a fresh fetch from the cache on the second call', async () => {
    mockedGetFieldCapabilities.mockResolvedValue(stubFields(['a', 'b']));
    const fetcher = new IndexPatternsFetcher(jest.fn() as any);

    const first = await fetcher.getFieldsForWildcard({ pattern: 'logs-*' });
    const second = await fetcher.getFieldsForWildcard({ pattern: 'logs-*' });

    expect(first.map((f) => f.name)).toEqual(['a', 'b']);
    expect(second.map((f) => f.name)).toEqual(['a', 'b']);
    expect(mockedGetFieldCapabilities).toHaveBeenCalledTimes(1);
  });

  test('refetches after the TTL has elapsed', async () => {
    mockedGetFieldCapabilities.mockResolvedValue(stubFields(['a']));
    const fetcher = new IndexPatternsFetcher(jest.fn() as any);
    const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => 1000);

    await fetcher.getFieldsForWildcard({ pattern: 'logs-*' });
    nowSpy.mockImplementation(() => 1000 + 6000); // TTL is 5000 ms
    await fetcher.getFieldsForWildcard({ pattern: 'logs-*' });

    expect(mockedGetFieldCapabilities).toHaveBeenCalledTimes(2);
    nowSpy.mockRestore();
  });

  test('deduplicates concurrent callers waiting on the same fetch', async () => {
    let resolve!: (value: ReturnType<typeof stubFields>) => void;
    mockedGetFieldCapabilities.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      })
    );
    const fetcher = new IndexPatternsFetcher(jest.fn() as any);

    const p1 = fetcher.getFieldsForWildcard({ pattern: 'logs-*' });
    const p2 = fetcher.getFieldsForWildcard({ pattern: 'logs-*' });
    const p3 = fetcher.getFieldsForWildcard({ pattern: 'logs-*' });

    resolve(stubFields(['a']));
    const results = await Promise.all([p1, p2, p3]);

    expect(results[0]).toBe(results[1]);
    expect(results[1]).toBe(results[2]);
    expect(mockedGetFieldCapabilities).toHaveBeenCalledTimes(1);
  });

  test('does not coalesce across different patterns or meta fields', async () => {
    mockedGetFieldCapabilities.mockResolvedValue(stubFields(['a']));
    const fetcher = new IndexPatternsFetcher(jest.fn() as any);

    await fetcher.getFieldsForWildcard({ pattern: 'logs-*' });
    await fetcher.getFieldsForWildcard({ pattern: 'metrics-*' });
    await fetcher.getFieldsForWildcard({ pattern: 'logs-*', metaFields: ['_id'] });

    expect(mockedGetFieldCapabilities).toHaveBeenCalledTimes(3);
  });

  test('drops the in-flight entry when the fetch rejects so retries are possible', async () => {
    mockedGetFieldCapabilities.mockRejectedValueOnce(new Error('boom'));
    mockedGetFieldCapabilities.mockResolvedValueOnce(stubFields(['a']));
    const fetcher = new IndexPatternsFetcher(jest.fn() as any);

    await expect(fetcher.getFieldsForWildcard({ pattern: 'logs-*' })).rejects.toThrow('boom');
    const second = await fetcher.getFieldsForWildcard({ pattern: 'logs-*' });

    expect(second.map((f) => f.name)).toEqual(['a']);
    expect(mockedGetFieldCapabilities).toHaveBeenCalledTimes(2);
  });

  test('sweeps stale in-flight entries past the timeout to prevent unbounded growth', () => {
    // Make every fetch hang so entries stay in flight.
    mockedGetFieldCapabilities.mockReturnValue(new Promise(() => {}));
    const fetcher = new IndexPatternsFetcher(jest.fn() as any);
    const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => 1000);

    for (let i = 0; i < 5; i++) {
      void fetcher.getFieldsForWildcard({ pattern: `stuck-${i}` });
    }
    expect(__getFieldCapsInFlightSizeForTests()).toBe(5);

    // Advance past the 30 s in-flight timeout, then trigger a sweep via a fresh fetch.
    nowSpy.mockImplementation(() => 1000 + 31000);
    void fetcher.getFieldsForWildcard({ pattern: 'fresh' });

    expect(__getFieldCapsInFlightSizeForTests()).toBe(1);
    nowSpy.mockRestore();
  });

  test('shares the cache between different IndexPatternsFetcher instances', async () => {
    mockedGetFieldCapabilities.mockResolvedValue(stubFields(['a']));
    const fetcherA = new IndexPatternsFetcher(jest.fn() as any);
    const fetcherB = new IndexPatternsFetcher(jest.fn() as any);

    await fetcherA.getFieldsForWildcard({ pattern: 'logs-*' });
    await fetcherB.getFieldsForWildcard({ pattern: 'logs-*' });

    expect(mockedGetFieldCapabilities).toHaveBeenCalledTimes(1);
  });
});
