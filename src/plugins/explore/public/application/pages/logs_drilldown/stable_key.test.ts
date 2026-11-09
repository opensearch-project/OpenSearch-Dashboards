/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import rison from 'rison-node';
import { stableKey } from './stable_key';

describe('stableKey', () => {
  it('equals for values that differ only in key order, at any depth', () => {
    const written = { sourceType: 'x', scope: { zone: 'z', tenant: 'a' } };
    const readBack = rison.decode(rison.encode(written));
    expect(JSON.stringify(readBack)).not.toBe(JSON.stringify(written));
    expect(stableKey(readBack)).toBe(stableKey(written));
  });

  it('keeps array order and tells different values apart', () => {
    expect(stableKey({ a: [2, 1] })).not.toBe(stableKey({ a: [1, 2] }));
    expect(stableKey({ a: 1 })).not.toBe(stableKey({ a: 2 }));
    expect(stableKey(undefined)).toBe('');
  });
});
