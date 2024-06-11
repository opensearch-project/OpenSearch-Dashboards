/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { cleanControlSequences } from './clean';

describe('cleanControlSequences', () => {
  it('does its job', () => {
    // prettier-ignore
    const controlSequences = [
      '\x03', '\x04', '\x05', '\x07', '\x08',
      '\x0B', '\x0C', '\x0D', '\x0E', '\x0F',
      '\x10', '\x11', '\x12', '\x13', '\x14', '\x15', '\x16', '\x17', '\x18', '\x19',
      '\x1A', '\x1B', '\x1C', '\x1D', '\x1E', '\x1F',
      '\x7F',
      '\x90', '\x9B', '\x9C'
    ];
    const input =
      '0' + controlSequences.map((char, idx) => `${char}${(idx + 1).toString(36)}`).join('');
    const expected =
      '0(U+0003)1(U+0004)2(U+0005)3(U+0007)4(U+0008)' +
      '5(U+000b)6(U+000c)7(U+000d)8(U+000e)9(U+000f)' +
      'a(U+0010)b(U+0011)c(U+0012)d(U+0013)e(U+0014)f(U+0015)g(U+0016)h(U+0017)i(U+0018)j(U+0019)' +
      'k(U+001a)l(U+001b)m(U+001c)n(U+001d)o(U+001e)p(U+001f)' +
      'q(U+007f)' +
      'r(U+0090)s(U+009b)t(U+009c)' +
      'u';
    expect(cleanControlSequences(input)).toEqual(expected);
  });
});
