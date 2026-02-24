/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '../../../../test-utils/vitest.utilities';
import { useCircleDimensions } from './use-circle-dimensions.hook';

describe('useCircleDimensions', () => {
  describe('small circles (diameter <= MIN_DIAMETER)', () => {
    it('should return minimum stroke widths for small circles', () => {
      const { result } = renderHook(() => useCircleDimensions(40));

      expect(result.current.backgroundStrokeWidth).toBe(1);
      expect(result.current.segmentStrokeWidth).toBe(5);
    });

    it('should calculate correct dimensions for minimum diameter', () => {
      const { result } = renderHook(() => useCircleDimensions(40));

      expect(result.current.radius).toBe(17.5); // (40 - 5) / 2
      expect(result.current.center).toBe(20); // 40 / 2
      expect(result.current.circumference).toBeCloseTo(109.96, 2); // 2 * PI * 17.5
    });
  });

  describe('large circles (diameter > MIN_DIAMETER)', () => {
    it('should scale stroke widths for larger circles', () => {
      const { result } = renderHook(() => useCircleDimensions(100));

      expect(result.current.backgroundStrokeWidth).toBeGreaterThan(1);
      expect(result.current.segmentStrokeWidth).toBeGreaterThan(5);
    });

    it('should calculate correct dimensions for larger diameter', () => {
      const { result } = renderHook(() => useCircleDimensions(100));

      const segmentStroke = result.current.segmentStrokeWidth;
      const expectedRadius = (100 - segmentStroke) / 2;

      expect(result.current.radius).toBe(expectedRadius);
      expect(result.current.center).toBe(50); // 100 / 2
      expect(result.current.circumference).toBeCloseTo(2 * Math.PI * expectedRadius, 2);
    });
  });

  describe('getArcLength', () => {
    it('should calculate correct arc length for 0%', () => {
      const { result } = renderHook(() => useCircleDimensions(100));
      expect(result.current.getArcLength(0)).toBe(0);
    });

    it('should calculate correct arc length for 50%', () => {
      const { result } = renderHook(() => useCircleDimensions(100));
      const halfCircumference = result.current.circumference / 2;
      expect(result.current.getArcLength(50)).toBeCloseTo(halfCircumference, 2);
    });

    it('should calculate correct arc length for 100%', () => {
      const { result } = renderHook(() => useCircleDimensions(100));
      expect(result.current.getArcLength(100)).toBeCloseTo(result.current.circumference, 2);
    });
  });

  describe('memoization', () => {
    it('should return the same values for the same diameter', () => {
      const { result, rerender } = renderHook(({ diameter }) => useCircleDimensions(diameter), {
        initialProps: { diameter: 100 },
      });
      const firstResult = result.current;
      rerender({ diameter: 100 });

      expect(result.current).toBe(firstResult);
    });

    it('should return different values for different diameters', () => {
      const { result, rerender } = renderHook(({ diameter }) => useCircleDimensions(diameter), {
        initialProps: { diameter: 100 },
      });
      const firstResult = result.current;
      rerender({ diameter: 200 });

      expect(result.current).not.toBe(firstResult);
    });
  });
});
