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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { Ipv6Address } from './ipv6_address';

describe('Ipv6Address', () => {
  it('should accept valid IPv6 addresses', () => {
    const valid = [
      '::',
      '::1',
      '2001:db8::1',
      '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
      '1:2:3:4:5:6:7:8',
      'FE80::ABCD',
      '::ffff:192.168.1.1',
    ];
    valid.forEach((address) => {
      expect(() => new Ipv6Address(address)).not.toThrow();
    });
  });

  it('should throw for invalid IPv6 addresses', () => {
    const invalid = [
      '',
      'hello, world',
      '1.1.1.1',
      '1234',
      'g::1',
      ':::',
      '1::2::3',
      '1:2:3:4:5:6:7:8:9',
      '12345::1',
      '::ffff:256.1.1.1',
    ];
    invalid.forEach((address) => {
      expect(() => new Ipv6Address(address)).toThrow('Invalid IPv6 address');
    });
  });

  it('should throw for non-string input', () => {
    // @ts-expect-error
    expect(() => new Ipv6Address()).toThrow();
    // @ts-expect-error
    expect(() => new Ipv6Address(123)).toThrow();
    // @ts-expect-error
    expect(() => new Ipv6Address(['::1'])).toThrow();
    // @ts-expect-error
    expect(() => new Ipv6Address(null)).toThrow();
  });

  it('should reject input that tries to inject URL syntax', () => {
    const malicious = ['::1]@evil.com', '::1]/path', '::1]:80', '::1 ', ' ::1', '::1%25eth0'];
    malicious.forEach((address) => {
      expect(() => new Ipv6Address(address)).toThrow();
    });
  });

  it('should round-trip through toString and valueOf', () => {
    const address = new Ipv6Address('2001:db8::1');
    expect(address.toString()).toBe('2001:db8::1');
    expect(address.valueOf()).toBe('2001:db8::1');
  });
});
