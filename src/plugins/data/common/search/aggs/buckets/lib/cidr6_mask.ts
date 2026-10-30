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

import { Ipv6Address } from '../../utils';

function throwError(mask: string) {
  throw Error('Invalid CIDR mask: ' + mask);
}

export class Cidr6Mask {
  public readonly initialAddress: Ipv6Address;
  public readonly prefixLength: number;

  constructor(mask: string) {
    const splits = mask.split('/');
    if (splits.length !== 2) {
      throwError(mask);
    }
    this.initialAddress = new Ipv6Address(splits[0]);
    // Require plain decimal digits: Number() alone would accept '', '1e1', '1.5', ' 8'.
    if (!/^\d{1,3}$/.test(splits[1])) {
      throwError(mask);
    }
    this.prefixLength = Number(splits[1]);
    if (this.prefixLength > 128) {
      throwError(mask);
    }
  }

  public toString() {
    return this.initialAddress.toString() + '/' + this.prefixLength;
  }
}
