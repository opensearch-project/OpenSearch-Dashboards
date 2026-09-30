/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { Cidr6Mask } from './cidr6_mask';

describe('Cidr6Mask', () => {
  it('should accept valid IPv6 CIDR masks', () => {
    ['::/0', '::/128', '2001:db8::/32', 'fe80::/10', '::1/128'].forEach((mask) => {
      expect(() => new Cidr6Mask(mask)).not.toThrow();
    });
  });

  it('should expose the address and prefix length', () => {
    const mask = new Cidr6Mask('2001:db8::/32');
    expect(mask.initialAddress.toString()).toBe('2001:db8::');
    expect(mask.prefixLength).toBe(32);
    expect(mask.toString()).toBe('2001:db8::/32');
  });

  it('should throw for an out-of-range prefix length', () => {
    ['::/129', '::/-1', '::/abc', '::/1.5', '::/1e1', '::/ 8'].forEach((mask) => {
      expect(() => new Cidr6Mask(mask)).toThrow('Invalid CIDR mask');
    });
  });

  it('should throw for a missing or malformed prefix', () => {
    ['2001:db8::', '2001:db8::/', '2001:db8:://32', '2001:db8::/32/1'].forEach((mask) => {
      expect(() => new Cidr6Mask(mask)).toThrow('Invalid CIDR mask');
    });
  });

  it('should throw for an invalid network address', () => {
    ['g::/32', '1::2::3/64', '1.1.1.1/24', '/64'].forEach((mask) => {
      expect(() => new Cidr6Mask(mask)).toThrow();
    });
  });
});
