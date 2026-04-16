/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LRUCache } from './lru_cache';

describe('LRUCache', () => {
  it('returns undefined for missing keys', () => {
    const cache = new LRUCache<string>(1000);
    expect(cache.get('missing')).toBeUndefined();
  });

  it('stores and retrieves values', () => {
    const cache = new LRUCache<number>(1000);
    cache.set('a', 1);
    expect(cache.get('a')).toBe(1);
  });

  it('expires entries after TTL', () => {
    jest.useFakeTimers();
    const cache = new LRUCache<string>(100);
    cache.set('key', 'val');
    expect(cache.get('key')).toBe('val');

    jest.advanceTimersByTime(101);
    expect(cache.get('key')).toBeUndefined();
    jest.useRealTimers();
  });

  it('evicts the oldest entry when maxEntries is reached', () => {
    const cache = new LRUCache<number>(10_000, 2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3); // should evict 'a'
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
  });

  it('promotes accessed entries (LRU order)', () => {
    const cache = new LRUCache<number>(10_000, 2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.get('a'); // promote 'a', so 'b' is now oldest
    cache.set('c', 3); // should evict 'b'
    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBeUndefined();
  });

  it('clears all entries', () => {
    const cache = new LRUCache<number>(10_000);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBeUndefined();
  });
});
