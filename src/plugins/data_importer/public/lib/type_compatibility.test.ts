/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isStringFieldType, isValueCompatibleWithType } from './type_compatibility';

describe('isValueCompatibleWithType', () => {
  it.each([null, undefined, '', '   '])('treats empty value %p as compatible', (value) => {
    expect(isValueCompatibleWithType(value, 'integer')).toBe(true);
    expect(isValueCompatibleWithType(value, 'boolean')).toBe(true);
    expect(isValueCompatibleWithType(value, 'date')).toBe(true);
  });

  describe.each(['integer', 'long', 'short', 'byte', 'unsigned_long'])('%s', (type) => {
    it('accepts integer-looking values', () => {
      expect(isValueCompatibleWithType('4', type)).toBe(true);
      expect(isValueCompatibleWithType(' -12 ', type)).toBe(true);
      expect(isValueCompatibleWithType(7, type)).toBe(true);
    });

    it('rejects letters and decimals', () => {
      expect(isValueCompatibleWithType('A', type)).toBe(false);
      expect(isValueCompatibleWithType('1.5', type)).toBe(false);
      expect(isValueCompatibleWithType(1.5, type)).toBe(false);
      expect(isValueCompatibleWithType('4x', type)).toBe(false);
    });
  });

  describe.each(['float', 'double', 'half_float', 'scaled_float'])('%s', (type) => {
    it('accepts any number', () => {
      expect(isValueCompatibleWithType('4', type)).toBe(true);
      expect(isValueCompatibleWithType('-1.25', type)).toBe(true);
      expect(isValueCompatibleWithType('1e3', type)).toBe(true);
      expect(isValueCompatibleWithType(3.14, type)).toBe(true);
    });

    it('rejects non-numbers', () => {
      expect(isValueCompatibleWithType('B', type)).toBe(false);
      expect(isValueCompatibleWithType('NaN', type)).toBe(false);
      expect(isValueCompatibleWithType(true, type)).toBe(false);
    });
  });

  it('boolean requires true/false', () => {
    expect(isValueCompatibleWithType('true', 'boolean')).toBe(true);
    expect(isValueCompatibleWithType('false', 'boolean')).toBe(true);
    expect(isValueCompatibleWithType(false, 'boolean')).toBe(true);
    expect(isValueCompatibleWithType('yes', 'boolean')).toBe(false);
    expect(isValueCompatibleWithType(1, 'boolean')).toBe(false);
  });

  it.each(['keyword', 'text', 'match_only_text', 'wildcard', 'constant_keyword'])(
    '%s accepts anything, including numbers',
    (type) => {
      expect(isValueCompatibleWithType('A', type)).toBe(true);
      expect(isValueCompatibleWithType(42, type)).toBe(true);
      expect(isValueCompatibleWithType('42', type)).toBe(true);
      expect(isValueCompatibleWithType(true, type)).toBe(true);
    }
  );

  it('date is lenient: parseable strings and epoch digits are accepted', () => {
    expect(isValueCompatibleWithType('2024-01-15', 'date')).toBe(true);
    expect(isValueCompatibleWithType('2024-01-15T10:00:00Z', 'date')).toBe(true);
    expect(isValueCompatibleWithType('1700000000000', 'date')).toBe(true);
    expect(isValueCompatibleWithType(1700000000000, 'date')).toBe(true);
    expect(isValueCompatibleWithType('not a date', 'date')).toBe(false);
  });

  it('unknown or missing types are compatible', () => {
    expect(isValueCompatibleWithType('A', 'ip')).toBe(true);
    expect(isValueCompatibleWithType('A', 'geo_point')).toBe(true);
    expect(isValueCompatibleWithType('A', undefined)).toBe(true);
  });

  it('checks every element of an array', () => {
    expect(isValueCompatibleWithType(['1', '2'], 'integer')).toBe(true);
    expect(isValueCompatibleWithType(['1', 'A'], 'integer')).toBe(false);
  });
});

describe('isStringFieldType', () => {
  it('recognizes string types', () => {
    expect(isStringFieldType('keyword')).toBe(true);
    expect(isStringFieldType('text')).toBe(true);
    expect(isStringFieldType('integer')).toBe(false);
    expect(isStringFieldType(undefined)).toBe(false);
  });
});
