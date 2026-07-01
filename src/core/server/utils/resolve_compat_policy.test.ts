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

import { resolveCompatPolicy } from './resolve_compat_policy';

describe('resolveCompatPolicy (core mirror of the env-keyed compat-policy defaults)', () => {
  it('non-prod defaults: block incompatible, warn-load unknown, strict singletons', () => {
    expect(resolveCompatPolicy(undefined, true)).toEqual({
      onIncompatible: 'block',
      onMissing: 'warn-load',
      strictShared: true,
    });
  });

  it('prod defaults: skip incompatible, skip unknown, strict singletons', () => {
    expect(resolveCompatPolicy(undefined, false)).toEqual({
      onIncompatible: 'skip',
      onMissing: 'skip',
      strictShared: true,
    });
  });

  it('honors explicit config in any env (config wins)', () => {
    expect(resolveCompatPolicy({ onIncompatible: 'block' }, false).onIncompatible).toBe('block');
    expect(resolveCompatPolicy({ onMissing: 'skip' }, true).onMissing).toBe('skip');
    expect(resolveCompatPolicy({ strictShared: false }, true).strictShared).toBe(false);
  });

  it('matches the browser-side default matrix exactly (kept in lockstep)', () => {
    // Same shape/values as packages/osd-mfe/src/bootstrap/compat_policy.ts.
    expect(resolveCompatPolicy({}, true)).toEqual({
      onIncompatible: 'block',
      onMissing: 'warn-load',
      strictShared: true,
    });
    expect(resolveCompatPolicy({}, false)).toEqual({
      onIncompatible: 'skip',
      onMissing: 'skip',
      strictShared: true,
    });
  });
});
