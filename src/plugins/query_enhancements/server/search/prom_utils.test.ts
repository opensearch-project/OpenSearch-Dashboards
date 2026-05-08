/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculateStep, DEFAULT_RESOLUTION, MIN_STEP_INTERVAL } from './prom_utils';

describe('prom_utils', () => {
  describe('calculateStep', () => {
    it('should return minimum step interval when calculated step is smaller', () => {
      const durationMs = 60000;
      const step = calculateStep(durationMs);
      expect(step).toBe(MIN_STEP_INTERVAL);
    });

    it('should calculate step for 1 hour duration', () => {
      const durationMs = 3600000;
      const step = calculateStep(durationMs);
      expect(step).toBe(15);
    });

    it('should calculate step for 24 hour duration', () => {
      const durationMs = 86400000;
      const step = calculateStep(durationMs);
      expect(step).toBe(100);
    });

    it('should calculate step for 7 day duration', () => {
      const durationMs = 604800000;
      const step = calculateStep(durationMs);
      expect(step).toBe(500);
    });

    it('should calculate step for 30 day duration', () => {
      const durationMs = 2592000000;
      const step = calculateStep(durationMs);
      expect(step).toBe(2000);
    });

    it('should respect custom resolution parameter', () => {
      const durationMs = 3600000;
      const step = calculateStep(durationMs, 100);
      expect(step).toBe(50);
    });

    it('should respect custom minimum interval parameter', () => {
      const durationMs = 3600000;
      const step = calculateStep(durationMs, DEFAULT_RESOLUTION, 1);
      expect(step).toBe(5);
    });

    it('should handle very large durations (1 year+)', () => {
      const durationMs = 400 * 24 * 60 * 60 * 1000;
      const step = calculateStep(durationMs);
      expect(step).toBe(50000);
    });

    it('should handle very small durations', () => {
      const durationMs = 1000;
      const step = calculateStep(durationMs);
      expect(step).toBe(MIN_STEP_INTERVAL);
    });

    describe('roundInterval produces 1-2-5 sequence values', () => {
      it('should round to 1 for intervals <= 1', () => {
        const durationMs = 1000 * DEFAULT_RESOLUTION;
        const step = calculateStep(durationMs, DEFAULT_RESOLUTION, 0);
        expect(step).toBe(1);
      });

      it('should round to 2 for intervals in (1, 2]', () => {
        const durationMs = 2000 * DEFAULT_RESOLUTION;
        const step = calculateStep(durationMs, DEFAULT_RESOLUTION, 0);
        expect(step).toBe(2);
      });

      it('should round to 5 for intervals in (2, 5]', () => {
        const durationMs = 5000 * DEFAULT_RESOLUTION;
        const step = calculateStep(durationMs, DEFAULT_RESOLUTION, 0);
        expect(step).toBe(5);
      });

      it('should round to 10 for intervals in (5, 10]', () => {
        const durationMs = 10000 * DEFAULT_RESOLUTION;
        const step = calculateStep(durationMs, DEFAULT_RESOLUTION, 0);
        expect(step).toBe(10);
      });

      it('should round to 100 for intervals around 60-100', () => {
        const durationMs = 60000 * DEFAULT_RESOLUTION;
        const step = calculateStep(durationMs, DEFAULT_RESOLUTION, 0);
        expect(step).toBe(100);
      });
    });
  });
});
