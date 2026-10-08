/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDecimalPrecision, roundToPrecision } from './number';

describe('number utils', () => {
  describe('getDecimalPrecision', () => {
    it.each([
      [1, 0],
      [0.2, 1],
      [0.25, 2],
      [0.001, 3],
      [1e-7, 7],
      [1.25e-7, 9],
      [1e-20, 20],
    ])('returns %p decimal places for %p', (value, expected) => {
      expect(getDecimalPrecision(value)).toBe(expected);
    });
  });

  describe('roundToPrecision', () => {
    it.each([
      [1.7999999999999998, 1, 1.8],
      [2.0000000000000004, 1, 2],
      [1.4999999999999998, 2, 1.5],
      [-1.7999999999999998, 1, -1.8],
      [1234567890123, 0, 1234567890123],
      [1000000000000.2, 1, 1000000000000.2],
      [1, 17, 1],
      [1e-20, 20, 1e-20],
    ])('rounds %p to %p decimal places as %p', (value, precision, expected) => {
      expect(roundToPrecision(value, precision)).toBe(expected);
    });
  });
});
