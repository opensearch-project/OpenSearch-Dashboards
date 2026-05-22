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

type IPAddress = Address4 | Address6;
type IPAddressConstructor = typeof Address4 | typeof Address6;

interface FormatOptions {
  type?: 'bigInteger' | 'addressObject';
}

/**
 * A utility class for working with CIDR (Classless Inter-Domain Routing) notation IP addresses.
 * Supports both IPv4 and IPv6 address ranges. It's based on not maintained ip-cidr module,
 * with direct ip-address 10.x use (native bigint handling), written in TypeScript and simplified to Dashbaord needs.
 */
class IPCIDR {
  public readonly cidr: string;
  public readonly ipAddressType: IPAddressConstructor;
  public readonly address: IPAddress;
  public readonly addressStart: IPAddress;
  public readonly addressEnd: IPAddress;
  public readonly size: bigint;

  /**
   * Creates a new IPCIDR instance from a CIDR notation string.
   *
   * @param cidr - The CIDR notation string (e.g., '192.168.1.0/24' or '2001:db8::/32')
   * @throws {Error} If the CIDR address is invalid or doesn't contain a '/' character
   */
  constructor(cidr: string) {
    if (typeof cidr !== 'string' || !cidr.match('/')) {
      throw new Error('Invalid CIDR address.');
    }

    const address = IPCIDR.createAddress(cidr);
    this.cidr = address.address;
    this.ipAddressType = address.constructor as IPAddressConstructor;
    this.address = address;
    this.addressStart = address.startAddress();
    this.addressEnd = address.endAddress();
    this.addressStart.subnet = this.addressEnd.subnet = this.address.subnet;
    this.addressStart.subnetMask = this.addressEnd.subnetMask = this.address.subnetMask;
    const end = this.addressEnd.bigInt();
    const start = this.addressStart.bigInt();
    this.size = end - start + 1n;
  }

  /**
   * Checks if a given IP address is contained within this CIDR range.
   *
   * @param address - The IP address to check. Can be a string, bigint, or IPAddress object
   * @returns `true` if the address is within the CIDR range, `false` otherwise
   */
  contains(address: string | bigint | IPAddress): boolean {
    try {
      let addr: IPAddress;

      if (!(address instanceof Address6) && !(address instanceof Address4)) {
        if (typeof address === 'bigint') {
          addr = this.ipAddressType.fromBigInt(address);
        } else {
          addr = IPCIDR.createAddress(address);
        }
      } else {
        addr = address;
      }

      return addr.isInSubnet(this.address);
    } catch {
      return false;
    }
  }

  /**
   * Returns the CIDR notation string representation of this IP range.
   *
   * @returns The CIDR notation string (e.g., '192.168.1.0/24')
   */
  toString(): string {
    return this.cidr;
  }

  /**
   * Converts the CIDR range to a tuple containing the start and end addresses.
   *
   * @param options - Optional formatting options for the returned addresses
   * @param options.type - Format type: 'bigInteger' returns bigint values, 'addressObject' returns IPAddress objects, otherwise returns string addresses
   * @returns A tuple containing [startAddress, endAddress] in the specified format
   */
  toRange(options?: FormatOptions): [string | bigint | IPAddress, string | bigint | IPAddress] {
    return [IPCIDR.formatIP(this.addressStart, options), IPCIDR.formatIP(this.addressEnd, options)];
  }

  /**
   * Formats an IP address according to the specified options.
   *
   * @param address - The IPAddress object to format
   * @param options - Optional formatting options
   * @param options.type - Format type: 'bigInteger' returns bigint, 'addressObject' returns the IPAddress object, otherwise returns string
   * @returns The formatted IP address in the specified format
   */
  static formatIP(address: IPAddress, options?: FormatOptions): string | bigint | IPAddress {
    const opts = options || {};

    if (opts.type === 'bigInteger') {
      return address.bigInt();
    } else if (opts.type === 'addressObject') {
      return address;
    }

    return address.addressMinusSuffix || '';
  }

  /**
   * Creates an IPAddress object from a string representation.
   * Automatically detects whether the address is IPv4 or IPv6.
   *
   * @param val - The IP address string (with or without CIDR notation)
   * @returns An Address4 or Address6 object representing the IP address
   * @throws {Error} If the IP address format is invalid
   */
  static createAddress(val: string): IPAddress {
    if (typeof val !== 'string') {
      throw new Error('Invalid IP address.');
    }

    if (val.match(/:.\./)) {
      val = val.split(':').pop()!;
    }
    const ipAddressType = val.match(':') ? Address6 : Address4;
    let ip: IPAddress = new ipAddressType(val);

    if (ip.v4 && val.match(':') && (ip as Address6).address4) {
      ip = (ip as Address6).address4!;
    }

    if (ip.v4) {
      const parts = (ip.addressMinusSuffix || '').split('.');

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i].split('/')[0];

        if (part[0] === '0' && part.length > 1) {
          throw new Error('Invalid IPv4 address.');
        }
      }
    }

    return ip;
  }

  /**
   * Validates whether a string represents a valid IP address.
   *
   * @param address - The IP address string to validate
   * @returns `true` if the address is valid, `false` otherwise
   */
  static isValidAddress(address: string): boolean {
    try {
      return !!this.createAddress(address);
    } catch {
      return false;
    }
  }

  /**
   * Validates whether a string represents a valid CIDR notation address.
   *
   * @param address - The CIDR notation string to validate (must contain '/')
   * @returns `true` if the CIDR address is valid, `false` otherwise
   */
  static isValidCIDR(address: string): boolean {
    if (typeof address !== 'string' || !address.match('/')) {
      return false;
    }

    try {
      return !!this.createAddress(address);
    } catch {
      return false;
    }
  }
}

export { IPCIDR };
