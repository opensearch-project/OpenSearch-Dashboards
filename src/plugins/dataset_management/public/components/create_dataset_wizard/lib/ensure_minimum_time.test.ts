/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ensureMinimumTime } from './ensure_minimum_time';

describe('ensureMinimumTime', () => {
  it('resolves single promise', async () => {
    const promiseA = new Promise((resolve) => resolve('a'));
    const a = await ensureMinimumTime(promiseA, 0);
    expect(a).toBe('a');
  });

  it('resolves multiple promises', async () => {
    const promiseA = new Promise((resolve) => resolve('a'));
    const promiseB = new Promise((resolve) => resolve('b'));
    const [a, b] = await ensureMinimumTime([promiseA, promiseB], 0);
    expect(a).toBe('a');
    expect(b).toBe('b');
  });

  it('resolves in the amount of time provided, at minimum', async () => {
    const startTime = new Date().getTime();
    // @ts-expect-error TS2794 TODO(ts-error): fixme
    const promise = new Promise((resolve) => resolve());
    await ensureMinimumTime(promise, 100);
    const endTime = new Date().getTime();
    expect(endTime - startTime).toBeGreaterThanOrEqual(100);
  });
});
