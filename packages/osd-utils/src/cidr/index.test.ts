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

import { Address4, Address6 } from 'ip-address';
import { IPCIDR } from './';

describe('IPCIDR', () => {
  describe('constructor', () => {
    it('should create an instance with valid IPv4 CIDR', () => {
      const cidr = new IPCIDR('192.168.1.0/24');
      expect(cidr.cidr).toBe('192.168.1.0/24');
      expect(cidr.ipAddressType).toBe(Address4);
    });

    it('should create an instance with valid IPv6 CIDR', () => {
      const cidr = new IPCIDR('2001:db8::/32');
      expect(cidr.cidr).toBe('2001:db8::/32');
      expect(cidr.ipAddressType).toBe(Address6);
    });

    it('should throw error for invalid CIDR without slash', () => {
      expect(() => new IPCIDR('192.168.1.0')).toThrow('Invalid CIDR address.');
    });

    it('should throw error for non-string input', () => {
      expect(() => new IPCIDR(123 as any)).toThrow('Invalid CIDR address.');
    });

    it('should calculate correct size for IPv4 /24 network', () => {
      const cidr = new IPCIDR('192.168.1.0/24');
      expect(cidr.size).toBe(256n);
    });

    it('should calculate correct size for IPv4 /32 network', () => {
      const cidr = new IPCIDR('192.168.1.1/32');
      expect(cidr.size).toBe(1n);
    });
  });

  describe('contains', () => {
    describe('IPv4', () => {
      const cidr = new IPCIDR('192.168.1.0/24');

      it('should return true for IP within range', () => {
        expect(cidr.contains('192.168.1.1')).toBe(true);
        expect(cidr.contains('192.168.1.100')).toBe(true);
        expect(cidr.contains('192.168.1.255')).toBe(true);
      });

      it('should return false for IP outside range', () => {
        expect(cidr.contains('192.168.2.1')).toBe(false);
        expect(cidr.contains('192.168.0.255')).toBe(false);
        expect(cidr.contains('10.0.0.1')).toBe(false);
      });

      it('should return true for network address', () => {
        expect(cidr.contains('192.168.1.0')).toBe(true);
      });

      it('should handle bigint input', () => {
        const cidrInstance = new IPCIDR('192.168.1.0/24');
        const ipBigInt = 3232235777n; // 192.168.1.1
        expect(cidrInstance.contains(ipBigInt)).toBe(true);
      });

      it('should handle Address4 object input', () => {
        const addr = new Address4('192.168.1.50');
        expect(cidr.contains(addr)).toBe(true);
      });

      it('should return false for invalid IP string', () => {
        expect(cidr.contains('invalid')).toBe(false);
      });
    });

    describe('IPv6', () => {
      const cidr = new IPCIDR('2001:db8::/32');

      it('should return true for IP within range', () => {
        expect(cidr.contains('2001:db8::1')).toBe(true);
        expect(cidr.contains('2001:db8:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(true);
      });

      it('should return false for IP outside range', () => {
        expect(cidr.contains('2001:db9::1')).toBe(false);
        expect(cidr.contains('2001:db7::1')).toBe(false);
      });

      it('should handle Address6 object input', () => {
        const addr = new Address6('2001:db8::1');
        expect(cidr.contains(addr)).toBe(true);
      });
    });
  });

  describe('toString', () => {
    it('should return CIDR string for IPv4', () => {
      const cidr = new IPCIDR('192.168.1.0/24');
      expect(cidr.toString()).toBe('192.168.1.0/24');
    });

    it('should return CIDR string for IPv6', () => {
      const cidr = new IPCIDR('2001:db8::/32');
      expect(cidr.toString()).toBe('2001:db8::/32');
    });
  });

  describe('toRange', () => {
    it('should return range as strings by default', () => {
      const cidr = new IPCIDR('192.168.1.0/24');
      const [start, end] = cidr.toRange();
      expect(start).toBe('192.168.1.0');
      expect(end).toBe('192.168.1.255');
    });

    it('should return range as bigints when specified', () => {
      const cidr = new IPCIDR('192.168.1.0/24');
      const [start, end] = cidr.toRange({ type: 'bigInteger' });
      expect(typeof start).toBe('bigint');
      expect(typeof end).toBe('bigint');
      expect(start).toBe(3232235776n);
      expect(end).toBe(3232236031n);
    });

    it('should return range as address objects when specified', () => {
      const cidr = new IPCIDR('192.168.1.0/24');
      const [start, end] = cidr.toRange({ type: 'addressObject' });
      expect(start).toBeInstanceOf(Address4);
      expect(end).toBeInstanceOf(Address4);
    });

    it('should work with IPv6', () => {
      const cidr = new IPCIDR('2001:db8::/32');
      const [start, end] = cidr.toRange();
      expect(start).toBe('2001:0db8:0000:0000:0000:0000:0000:0000');
      expect(end).toBe('2001:0db8:ffff:ffff:ffff:ffff:ffff:ffff');
    });
  });

  describe('formatIP', () => {
    it('should return string by default', () => {
      const addr = new Address4('192.168.1.1');
      const result = IPCIDR.formatIP(addr);
      expect(result).toBe('192.168.1.1');
    });

    it('should return bigint when specified', () => {
      const addr = new Address4('192.168.1.1');
      const result = IPCIDR.formatIP(addr, { type: 'bigInteger' });
      expect(typeof result).toBe('bigint');
      expect(result).toBe(3232235777n);
    });

    it('should return address object when specified', () => {
      const addr = new Address4('192.168.1.1');
      const result = IPCIDR.formatIP(addr, { type: 'addressObject' });
      expect(result).toBe(addr);
    });
  });

  describe('createAddress', () => {
    it('should create IPv4 address from string', () => {
      const addr = IPCIDR.createAddress('192.168.1.1');
      expect(addr).toBeInstanceOf(Address4);
      expect(addr.addressMinusSuffix).toBe('192.168.1.1');
    });

    it('should create IPv6 address from string', () => {
      const addr = IPCIDR.createAddress('2001:db8::1');
      expect(addr).toBeInstanceOf(Address6);
    });

    it('should create address from CIDR notation', () => {
      const addr = IPCIDR.createAddress('192.168.1.0/24');
      expect(addr).toBeInstanceOf(Address4);
    });

    it('should throw error for non-string input', () => {
      expect(() => IPCIDR.createAddress(123 as any)).toThrow('Invalid IP address.');
    });

    it('should throw error for IPv4 with leading zeros', () => {
      expect(() => IPCIDR.createAddress('192.168.01.1')).toThrow('Invalid IPv4 address.');
    });

    it('should handle IPv4-mapped IPv6 addresses', () => {
      const addr = IPCIDR.createAddress('::ffff:192.168.1.1');
      expect(addr.v4).toBe(true);
    });
  });

  describe('isValidAddress', () => {
    it('should return true for valid IPv4 address', () => {
      expect(IPCIDR.isValidAddress('192.168.1.1')).toBe(true);
      expect(IPCIDR.isValidAddress('10.0.0.1')).toBe(true);
    });

    it('should return true for valid IPv6 address', () => {
      expect(IPCIDR.isValidAddress('2001:db8::1')).toBe(true);
      expect(IPCIDR.isValidAddress('::1')).toBe(true);
    });

    it('should return false for invalid address', () => {
      expect(IPCIDR.isValidAddress('invalid')).toBe(false);
      expect(IPCIDR.isValidAddress('999.999.999.999')).toBe(false);
    });

    it('should return false for IPv4 with leading zeros', () => {
      expect(IPCIDR.isValidAddress('192.168.01.1')).toBe(false);
    });

    it('should return true for address with CIDR notation', () => {
      expect(IPCIDR.isValidAddress('192.168.1.0/24')).toBe(true);
    });
  });

  describe('isValidCIDR', () => {
    it('should return true for valid IPv4 CIDR', () => {
      expect(IPCIDR.isValidCIDR('192.168.1.0/24')).toBe(true);
      expect(IPCIDR.isValidCIDR('10.0.0.0/8')).toBe(true);
    });

    it('should return true for valid IPv6 CIDR', () => {
      expect(IPCIDR.isValidCIDR('2001:db8::/32')).toBe(true);
      expect(IPCIDR.isValidCIDR('::1/128')).toBe(true);
    });

    it('should return false for address without CIDR notation', () => {
      expect(IPCIDR.isValidCIDR('192.168.1.1')).toBe(false);
      expect(IPCIDR.isValidCIDR('2001:db8::1')).toBe(false);
    });

    it('should return false for invalid CIDR', () => {
      expect(IPCIDR.isValidCIDR('invalid/24')).toBe(false);
      expect(IPCIDR.isValidCIDR('999.999.999.999/24')).toBe(false);
    });

    it('should return false for non-string input', () => {
      expect(IPCIDR.isValidCIDR(123 as any)).toBe(false);
    });
  });
});
