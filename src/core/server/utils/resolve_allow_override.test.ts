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

import { resolveAllowOverride } from './resolve_allow_override';

describe('resolveAllowOverride (the non-prod MFE override security gate default)', () => {
  it('defaults to OFF in production when unset (undefined => dev=false)', () => {
    expect(resolveAllowOverride(undefined, false)).toBe(false);
  });

  it('defaults to ON in development when unset (undefined => dev=true)', () => {
    expect(resolveAllowOverride(undefined, true)).toBe(true);
  });

  it('honors an explicit `true` even in production (configured wins)', () => {
    expect(resolveAllowOverride(true, false)).toBe(true);
  });

  it('honors an explicit `false` even in development (configured wins)', () => {
    expect(resolveAllowOverride(false, true)).toBe(false);
  });

  it('coerces a non-boolean dev flag to a boolean result', () => {
    // The legacy mixin passes `!!env.mode.dev`, but guard the coercion here too.
    expect(resolveAllowOverride(undefined, (1 as unknown) as boolean)).toBe(true);
    expect(resolveAllowOverride(undefined, (0 as unknown) as boolean)).toBe(false);
  });
});
