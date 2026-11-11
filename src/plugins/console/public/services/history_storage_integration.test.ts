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

import { History } from './history';
import { Storage } from './storage';

/**
 * history.test.ts injects a fake storage, so it never covers the seam
 * addToHistory depends on: an engine quota error reaching it via Storage.set().
 */
class FakeEngine {
  // Storage.keys() reads own enumerable properties, as real localStorage exposes.
  [key: string]: unknown;
  store = new Map<string, string>();
  quotaBytes: number | undefined;

  private used(excludeKey?: string) {
    let total = 0;
    this.store.forEach((v, k) => {
      if (k !== excludeKey) total += (k.length + v.length) * 2;
    });
    return total;
  }

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string) {
    if (this.quotaBytes !== undefined) {
      if (this.used(key) + (key.length + value.length) * 2 > this.quotaBytes) {
        const err: any = new Error('quota');
        err.name = 'QuotaExceededError';
        throw err;
      }
    }
    this.store.set(key, value);
    this[key] = value;
  }
  removeItem(key: string) {
    this.store.delete(key);
    delete this[key];
  }
  public get length() {
    return this.store.size;
  }
  key(i: number) {
    return Array.from(this.store.keys())[i] ?? null;
  }
  clear() {
    this.store.forEach((_v, k) => delete this[k]);
    this.store.clear();
  }
}

const setup = () => {
  const engine = new FakeEngine();
  const storage = new Storage(engine as unknown as typeof window.localStorage, 'sense:');
  return { engine, history: new History(storage) };
};

const historyKeys = (engine: FakeEngine) =>
  Array.from(engine.store.keys()).filter((k) => k.startsWith('sense:hist_elem_'));

describe('History on the real Storage', () => {
  let nowSpy: jest.SpyInstance;

  beforeEach(() => {
    let tick = 1_700_000_000_000;
    nowSpy = jest.spyOn(Date.prototype, 'getTime').mockImplementation(() => (tick += 1));
  });

  afterEach(() => {
    nowSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('persists a request through Storage', () => {
    const { engine, history } = setup();

    history.addToHistory('/_search', 'GET', 'tiny');

    expect(historyKeys(engine)).toHaveLength(1);
    expect(history.getHistory()[0].endpoint).toBe('/_search');
  });

  it('sheds its own oldest entries when the engine reports a full store', () => {
    const { engine, history } = setup();
    for (let i = 0; i < 8; i++) {
      history.addToHistory(`/_search/${i}`, 'GET', 'x'.repeat(2000));
    }
    const oldest = historyKeys(engine).sort()[0];
    // Clamp to what is already used, so the next write needs room freed first.
    engine.quotaBytes = Array.from(engine.store.entries()).reduce(
      (sum, [k, v]) => sum + (k.length + v.length) * 2,
      0
    );

    expect(() => history.addToHistory('/_search/new', 'GET', 'x'.repeat(2000))).not.toThrow();

    expect(history.getHistory()[0].endpoint).toBe('/_search/new');
    expect(historyKeys(engine)).not.toContain(oldest);
  });

  it('rethrows the quota error so the caller can report it when nothing can be freed', () => {
    const { engine, history } = setup();
    engine.quotaBytes = 1;

    // The caller turns this into a "Could not save request to history" toast.
    expect(() => history.addToHistory('/_search', 'GET', 'tiny')).toThrow(
      expect.objectContaining({ name: 'QuotaExceededError' })
    );
  });

  it('propagates a non-quota engine failure', () => {
    const { engine, history } = setup();
    jest.spyOn(engine, 'setItem').mockImplementation(() => {
      throw new Error('disk on fire');
    });

    expect(() => history.addToHistory('/_search', 'GET', 'tiny')).toThrow('disk on fire');
  });
});
