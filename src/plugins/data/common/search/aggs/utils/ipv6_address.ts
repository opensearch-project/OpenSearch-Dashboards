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

function throwError(ipAddress: string) {
  throw new Error(`Invalid IPv6 address: ${ipAddress}`);
}

function isValidIpv6Literal(str: string): boolean {
  // Character allowlist first: only hex digits, `:`, and `.` (for an embedded
  // IPv4 tail like ::ffff:192.168.1.1) are legal in an IPv6 literal. This
  // guarantees the input can't inject its own `]`, `/`, `@`, or whitespace
  // into the URL string we build below.
  if (!/^[0-9a-fA-F:.]+$/.test(str)) {
    return false;
  }
  try {
    // The WHATWG URL host parser requires bracketed hosts to be valid IPv6
    // literals (RFC 3986); we exploit that as a spec-compliant validity check.
    new URL(`http://[${str}]`);
    return true;
  } catch {
    return false;
  }
}

export class Ipv6Address {
  public readonly value: string;

  constructor(ipAddress: string) {
    if (typeof ipAddress !== 'string' || !isValidIpv6Literal(ipAddress)) {
      throwError(ipAddress);
    }
    this.value = ipAddress;
  }

  public toString() {
    return this.value;
  }

  public valueOf() {
    return this.value;
  }
}
