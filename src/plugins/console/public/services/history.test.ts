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
  History,
  MAX_ENTRY_DATA_CHARS,
  MAX_HISTORY_ENTRIES,
  MAX_HISTORY_STORED_BYTES,
} from './history';
import { Storage } from './storage';

/** In-memory Storage stand-in; the real mock is jest.fn() stubs that cannot model eviction. */
class FakeStorage {
  values = new Map<string, any>();
  /** Byte ceiling that makes set() throw QuotaExceededError like a browser. */
  quotaBytes: number | undefined;

  private usedBytes(excludeKey?: string) {
    let total = 0;
    this.values.forEach((value, key) => {
      if (key === excludeKey) return;
      total += (key.length + JSON.stringify(value).length) * 2;
    });
    return total;
  }

  set(key: string, val: any) {
    if (this.quotaBytes !== undefined) {
      const incoming = (key.length + JSON.stringify(val).length) * 2;
      if (this.usedBytes(key) + incoming > this.quotaBytes) {
        const err: any = new Error('quota');
        err.name = 'QuotaExceededError';
        throw err;
      }
    }
    this.values.set(key, val);
    return val;
  }
  get(key: string) {
    return this.values.get(key);
  }
  has(key: string) {
    return this.values.has(key);
  }
  delete(key: string) {
    this.values.delete(key);
  }
  keys() {
    return Array.from(this.values.keys());
  }
  encodeKey(key: string) {
    return key;
  }
  encode(val: any) {
    return JSON.stringify(val);
  }
  rawByteLength(key: string) {
    if (!this.values.has(key)) return 0;
    return (key.length + JSON.stringify(this.values.get(key)).length) * 2;
  }
}

const makeHistory = (storage: FakeStorage) => new History(storage as unknown as Storage);

/** A body of `n` characters. */
const bodyOfChars = (chars: number) => 'x'.repeat(chars);

const historyEntries = (storage: FakeStorage) =>
  storage.keys().filter((k) => k.indexOf('hist_elem') === 0);

describe('History', () => {
  let storage: FakeStorage;
  let nowSpy: jest.SpyInstance;

  beforeEach(() => {
    storage = new FakeStorage();
    // Keys are 'hist_elem_' + getTime(), so same-millisecond sends collide.
    // A monotonic clock keeps these tests on eviction, not that collision.
    let tick = 1_700_000_000_000;
    nowSpy = jest.spyOn(Date.prototype, 'getTime').mockImplementation(() => (tick += 1));
  });

  afterEach(() => {
    nowSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('per-entry body cap', () => {
    it('persists a body under the cap', () => {
      const history = makeHistory(storage);
      const body = bodyOfChars(1024);

      history.addToHistory('/_search', 'GET', body);

      const [entry] = history.getHistory();
      expect(entry.data).toBe(body);
      expect(entry.dataOmitted).toBeUndefined();
    });

    it('omits a body over the cap but keeps the entry', () => {
      const history = makeHistory(storage);

      history.addToHistory(
        '/_component_template/big',
        'PUT',
        bodyOfChars(MAX_ENTRY_DATA_CHARS * 2)
      );

      const [entry] = history.getHistory();
      expect(entry.endpoint).toBe('/_component_template/big');
      expect(entry.method).toBe('PUT');
      expect(entry.data).toBeUndefined();
      expect(entry.dataOmitted).toBe(true);
    });

    it('does not mark small or absent bodies as omitted', () => {
      const history = makeHistory(storage);

      history.addToHistory('/_search', 'GET', undefined);

      const [entry] = history.getHistory();
      expect(entry.dataOmitted).toBeUndefined();
      expect(entry.data).toBeUndefined();
    });
  });

  describe('cumulative byte budget', () => {
    it('evicts oldest entries so total stays bounded', () => {
      const history = makeHistory(storage);

      // Each body is just under the per-entry cap, so only the total can bound them.
      for (let i = 0; i < 40; i++) {
        history.addToHistory(`/_search/${i}`, 'GET', bodyOfChars(MAX_ENTRY_DATA_CHARS - 1024));
      }

      const totalBytes = historyEntries(storage).reduce(
        (sum, key) => sum + (key.length + JSON.stringify(storage.get(key)).length) * 2,
        0
      );

      expect(totalBytes).toBeLessThanOrEqual(MAX_HISTORY_STORED_BYTES);
      expect(historyEntries(storage).length).toBeGreaterThan(0);
      expect(historyEntries(storage).length).toBeLessThan(40);
    });

    it('keeps the newest entry and drops the oldest', () => {
      const history = makeHistory(storage);

      for (let i = 0; i < 30; i++) {
        history.addToHistory(`/_search/${i}`, 'GET', bodyOfChars(MAX_ENTRY_DATA_CHARS - 1024));
      }

      const endpoints = history.getHistory().map((r: any) => r.endpoint);
      expect(endpoints[0]).toBe('/_search/29');
      expect(endpoints).not.toContain('/_search/0');
    });
  });

  describe('entry count cap', () => {
    it('retains no more than the maximum number of entries', () => {
      const history = makeHistory(storage);

      for (let i = 0; i < MAX_HISTORY_ENTRIES + 25; i++) {
        history.addToHistory(`/_search/${i}`, 'GET', 'tiny');
      }

      // Pre-existing behaviour trims to the cap then writes, so cap + 1.
      expect(historyEntries(storage).length).toBeLessThanOrEqual(MAX_HISTORY_ENTRIES + 1);
    });
  });

  describe('when the origin quota is exhausted by other keys', () => {
    it('sheds its own oldest entries so the write still lands', () => {
      const history = makeHistory(storage);
      for (let i = 0; i < 10; i++) {
        history.addToHistory(`/_search/${i}`, 'GET', bodyOfChars(8 * 1024));
      }

      // Clamp to what is already used so the next write needs room freed.
      storage.quotaBytes = historyEntries(storage).reduce(
        (sum, key) => sum + (key.length + JSON.stringify(storage.get(key)).length) * 2,
        0
      );

      expect(() =>
        history.addToHistory('/_search/new', 'GET', bodyOfChars(8 * 1024))
      ).not.toThrow();
      expect(history.getHistory()[0].endpoint).toBe('/_search/new');
    });

    it('rethrows when even an empty history cannot fit, so the caller can notify', () => {
      const history = makeHistory(storage);
      storage.quotaBytes = 1;

      expect(() => history.addToHistory('/_search', 'GET', 'tiny')).toThrow();
    });

    it('does not swallow non-quota storage failures', () => {
      const history = makeHistory(storage);
      jest.spyOn(storage, 'set').mockImplementation(() => {
        throw new Error('something else went wrong');
      });

      expect(() => history.addToHistory('/_search', 'GET', 'tiny')).toThrow(
        'something else went wrong'
      );
    });

    it('terminates when deletes do not free space', () => {
      const history = makeHistory(storage);
      for (let i = 0; i < 5; i++) {
        history.addToHistory(`/_search/${i}`, 'GET', 'tiny');
      }
      // A store that never frees: set always rejects and delete does nothing.
      jest.spyOn(storage, 'delete').mockImplementation(() => undefined);
      jest.spyOn(storage, 'set').mockImplementation(() => {
        const err: any = new Error('quota');
        err.name = 'QuotaExceededError';
        throw err;
      });

      expect(() => history.addToHistory('/_search/new', 'GET', 'tiny')).toThrow('quota');
    });
  });

  describe('clearHistory', () => {
    it('removes all history entries', () => {
      const history = makeHistory(storage);
      history.addToHistory('/_search', 'GET', 'tiny');

      history.clearHistory();

      expect(historyEntries(storage)).toHaveLength(0);
    });
  });
});
