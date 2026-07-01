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

import { resolveCompatPolicy } from './compat_policy';

describe('resolveCompatPolicy (env-keyed compat policy defaults)', () => {
  describe('env-keyed defaults when unset', () => {
    it('non-prod (dev=true): block incompatible, warn-load unknown, strict singletons', () => {
      expect(resolveCompatPolicy(undefined, true)).toEqual({
        onIncompatible: 'block',
        onMissing: 'warn-load',
        strictShared: true,
      });
    });

    it('prod (dev=false): skip incompatible, skip unknown, strict singletons', () => {
      expect(resolveCompatPolicy(undefined, false)).toEqual({
        onIncompatible: 'skip',
        onMissing: 'skip',
        strictShared: true,
      });
    });

    it('treats a sparse config the same as unset (per-key fallback)', () => {
      expect(resolveCompatPolicy({}, false)).toEqual({
        onIncompatible: 'skip',
        onMissing: 'skip',
        strictShared: true,
      });
    });
  });

  describe('explicit config always wins (config-overridable in any env)', () => {
    it('honors onIncompatible=block in prod', () => {
      expect(resolveCompatPolicy({ onIncompatible: 'block' }, false).onIncompatible).toBe('block');
    });

    it('honors onIncompatible=skip in dev', () => {
      expect(resolveCompatPolicy({ onIncompatible: 'skip' }, true).onIncompatible).toBe('skip');
    });

    it('honors onMissing overrides in both envs', () => {
      expect(resolveCompatPolicy({ onMissing: 'block' }, false).onMissing).toBe('block');
      expect(resolveCompatPolicy({ onMissing: 'skip' }, true).onMissing).toBe('skip');
    });

    it('honors strictShared=false (opt out of strict singletons)', () => {
      expect(resolveCompatPolicy({ strictShared: false }, true).strictShared).toBe(false);
      expect(resolveCompatPolicy({ strictShared: false }, false).strictShared).toBe(false);
    });

    it('keeps env defaults for keys left unset while honoring the one set', () => {
      expect(resolveCompatPolicy({ onIncompatible: 'block' }, false)).toEqual({
        onIncompatible: 'block',
        onMissing: 'skip',
        strictShared: true,
      });
    });
  });

  it('coerces a non-boolean dev flag to a boolean env decision', () => {
    expect(resolveCompatPolicy(undefined, (1 as unknown) as boolean).onIncompatible).toBe('block');
    expect(resolveCompatPolicy(undefined, (0 as unknown) as boolean).onIncompatible).toBe('skip');
  });
});
