/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { GOLDEN_RATIO, INVERSE_GOLDEN_RATIO } from './visual.constants';

describe('Visual Constants', () => {
  describe('GOLDEN_RATIO', () => {
    it('should be defined', () => {
      expect(GOLDEN_RATIO).toBeDefined();
    });

    it('should have the correct value', () => {
      expect(GOLDEN_RATIO).toBe(1.618034);
    });

    it('should be approximately inverse of INVERSE_GOLDEN_RATIO', () => {
      expect(1 / GOLDEN_RATIO).toBeCloseTo(INVERSE_GOLDEN_RATIO, 6);
    });
  });

  describe('INVERSE_GOLDEN_RATIO', () => {
    it('should be defined', () => {
      expect(INVERSE_GOLDEN_RATIO).toBeDefined();
    });

    it('should have the correct value', () => {
      expect(INVERSE_GOLDEN_RATIO).toBe(0.618034);
    });

    it('should be approximately inverse of GOLDEN_RATIO', () => {
      expect(1 / INVERSE_GOLDEN_RATIO).toBeCloseTo(GOLDEN_RATIO, 6);
    });
  });

  describe('Mathematical relationship', () => {
    it('should maintain the golden ratio relationship', () => {
      const ratio = GOLDEN_RATIO / INVERSE_GOLDEN_RATIO;
      expect(ratio).toBeCloseTo(GOLDEN_RATIO * GOLDEN_RATIO, 6);
    });
  });
});
