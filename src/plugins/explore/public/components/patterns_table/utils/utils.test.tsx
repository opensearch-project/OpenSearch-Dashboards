/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isValidFiniteNumber } from './utils';

describe('utils', () => {
  describe('isValidFiniteNumber', () => {
    // Test valid numbers
    it('should return true for valid positive numbers', () => {
      expect(isValidFiniteNumber(42)).toBe(true);
      expect(isValidFiniteNumber(0.5)).toBe(true);
      expect(isValidFiniteNumber(Number.MAX_SAFE_INTEGER)).toBe(true);
    });

    it('should return true for valid negative numbers', () => {
      expect(isValidFiniteNumber(-42)).toBe(true);
      expect(isValidFiniteNumber(-0.5)).toBe(true);
      expect(isValidFiniteNumber(Number.MIN_SAFE_INTEGER)).toBe(true);
    });

    it('should return true for zero', () => {
      expect(isValidFiniteNumber(0)).toBe(true);
    });

    // Test invalid numbers
    it('should return false for NaN', () => {
      expect(isValidFiniteNumber(NaN)).toBe(false);
    });

    it('should return false for Infinity', () => {
      expect(isValidFiniteNumber(Infinity)).toBe(false);
      expect(isValidFiniteNumber(-Infinity)).toBe(false);
    });

    // Scientific notation tests
    it('should handle positive scientific notation correctly', () => {
      expect(isValidFiniteNumber(1e5)).toBe(true);
      expect(isValidFiniteNumber(1.23e5)).toBe(true);
      expect(isValidFiniteNumber(1e5)).toBe(true);
    });

    it('should handle negative scientific notation correctly', () => {
      expect(isValidFiniteNumber(1e-5)).toBe(true);
      expect(isValidFiniteNumber(1.23e-5)).toBe(true);
      expect(isValidFiniteNumber(-1.23e-5)).toBe(true);
    });
  });
});
