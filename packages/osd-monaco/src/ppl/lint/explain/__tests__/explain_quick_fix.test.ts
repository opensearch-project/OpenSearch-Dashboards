/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildFilterInversionFix } from '../explain_quick_fix';

const INT_MAP = new Map<string, string>([
  ['age', 'integer'],
  ['n', 'short'],
  ['a.b', 'integer'],
]);
const FLOAT_MAP = new Map<string, string>([
  ['price', 'double'],
  ['ratio', 'float'],
]);
const LONG_MAP = new Map<string, string>([['age', 'long']]);

describe('buildFilterInversionFix — additive on an integer field (the only Tier-1 case)', () => {
  it('moves a subtracted constant across', () => {
    const fix = buildFilterInversionFix('age-2>30', INT_MAP);
    expect(fix?.text).toBe('age > 32');
    expect(fix?.field).toBe('age');
    expect(fix?.literal).toBe('30');
  });

  it('moves an added constant across', () => {
    expect(buildFilterInversionFix('age+2>=30', INT_MAP)?.text).toBe('age >= 28');
  });

  it('handles every comparison operator', () => {
    expect(buildFilterInversionFix('age-2=30', INT_MAP)?.text).toBe('age = 32');
    expect(buildFilterInversionFix('age-2!=30', INT_MAP)?.text).toBe('age != 32');
    expect(buildFilterInversionFix('age-2<30', INT_MAP)?.text).toBe('age < 32');
    expect(buildFilterInversionFix('age-2<=30', INT_MAP)?.text).toBe('age <= 32');
  });

  it('handles a negative RHS literal exactly (BigInt, no drift)', () => {
    expect(buildFilterInversionFix('age+5>-3', INT_MAP)?.text).toBe('age > -8');
    expect(buildFilterInversionFix('age-5>-3', INT_MAP)?.text).toBe('age > 2');
  });

  it('works for a dotted / backtick integer field, preserving the token', () => {
    expect(buildFilterInversionFix('a.b-1>9', INT_MAP)?.text).toBe('a.b > 10');
    expect(buildFilterInversionFix('`a.b`-2>30', INT_MAP)?.text).toBe('`a.b` > 32');
    expect(buildFilterInversionFix('`a.b`-2>30', INT_MAP)?.field).toBe('a.b');
  });
});

describe('buildFilterInversionFix — refuses everything not provably exact', () => {
  it('REFUSES a floating-point field (engine rounds; the exact rewrite diverges)', () => {
    // Regression for the IEEE-754 boundary bug: `price + 0.1 > 0.3` on a stored
    // 0.2 matches (0.30000000000000004 > 0.3) but `price > 0.2` does not.
    expect(buildFilterInversionFix('price+1>3', FLOAT_MAP)).toBeUndefined();
    expect(buildFilterInversionFix('ratio-2>3', FLOAT_MAP)).toBeUndefined();
  });

  it('REFUSES when the field type is unknown', () => {
    expect(buildFilterInversionFix('mystery-2>30')).toBeUndefined();
    expect(buildFilterInversionFix('mystery-2>30', new Map())).toBeUndefined();
  });

  it('REFUSES long mappings and arithmetic outside signed 64-bit bounds', () => {
    expect(buildFilterInversionFix('age-2>30', LONG_MAP)).toBeUndefined();
    expect(buildFilterInversionFix('age+9223372036854775807>0', INT_MAP)).toBeUndefined();
    expect(buildFilterInversionFix('age-1>9223372036854775807', INT_MAP)).toBeUndefined();
    expect(buildFilterInversionFix('age+1>-9223372036854775808', INT_MAP)).toBeUndefined();
  });

  it('REFUSES a decimal constant or decimal literal (integer shape only)', () => {
    expect(buildFilterInversionFix('age-2.5>30', INT_MAP)).toBeUndefined();
    expect(buildFilterInversionFix('age-2>30.5', INT_MAP)).toBeUndefined();
  });

  it('REFUSES the divisive form entirely (dropped from Tier 1)', () => {
    expect(buildFilterInversionFix('age/2>15', INT_MAP)).toBeUndefined();
    expect(buildFilterInversionFix('price/100>200', FLOAT_MAP)).toBeUndefined();
  });

  it('REFUSES compound / non-bare-field / const-minus-field shapes', () => {
    // A compound predicate never reaches here (the resolver passes only a single
    // comparison node), but guard anyway: the trailing ` and ...` breaks the anchor.
    expect(buildFilterInversionFix('age-2>30 and balance>1', INT_MAP)).toBeUndefined();
    expect(buildFilterInversionFix('abs(age)-2>30', INT_MAP)).toBeUndefined();
    expect(buildFilterInversionFix('age-balance>30', INT_MAP)).toBeUndefined();
    expect(buildFilterInversionFix('2-age>30', INT_MAP)).toBeUndefined(); // const - field
    expect(buildFilterInversionFix('age>30', INT_MAP)).toBeUndefined(); // no arithmetic
    expect(buildFilterInversionFix('age- -2>30', INT_MAP)).toBeUndefined(); // double negative
  });

  it('does not treat a fused NOT-keyword string as a real field', () => {
    // Regression for the getText() token-fusion bug: even if a caller passed the
    // fused text, "NOTage" is not a mapped field, so no fix is offered.
    expect(buildFilterInversionFix('NOTage-2>30', INT_MAP)).toBeUndefined();
  });
});

describe('buildFilterInversionFix — round-trip safety', () => {
  it('the rewritten predicate no longer matches the fixable arithmetic shape', () => {
    const first = buildFilterInversionFix('age-2>30', INT_MAP);
    expect(first?.text).toBe('age > 32');
    // Applying the fix must not re-fire: the result has no field-side arithmetic.
    expect(buildFilterInversionFix(first!.text.replace(/ /g, ''), INT_MAP)).toBeUndefined();
  });
});
