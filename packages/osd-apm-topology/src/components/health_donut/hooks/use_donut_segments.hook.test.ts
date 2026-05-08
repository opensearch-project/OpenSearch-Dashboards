/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import type { Metrics } from '../../../shared/types/common.types';
import { useDonutSegments } from './use_donut_segments.hook';
import { HEALTH_DONUT_COLORS } from '../constants';

describe('useDonutSegments', () => {
  // Test the getPercentage helper function behavior
  describe('percentage calculations', () => {
    it('should return 0 when total requests is 0', () => {
      const metrics: Metrics = {
        requests: 0,
        faults5xx: 0,
        errors4xx: 0,
      };

      const { result } = renderHook(() => useDonutSegments(metrics));
      expect(result.current[0].percent).toBe(0);
      expect(result.current[1].percent).toBe(0);
      expect(result.current[2].percent).toBe(0);
    });

    it('should calculate correct percentages', () => {
      const metrics: Metrics = {
        requests: 1000,
        faults5xx: 100, // Should be 10%
        errors4xx: 50, // Should be 5%
      };

      const { result } = renderHook(() => useDonutSegments(metrics));
      expect(result.current[0].percent).toBe(10);
      expect(result.current[1].percent).toBe(5);
      expect(result.current[2].percent).toBe(85);
    });
  });

  describe('segment properties', () => {
    it('should set transparent color when percentage is 0', () => {
      const metrics: Metrics = {
        requests: 0,
        faults5xx: 0,
        errors4xx: 0,
      };

      const { result } = renderHook(() => useDonutSegments(metrics));
      expect(result.current[0].color).toBe('transparent');
      expect(result.current[1].color).toBe('transparent');
      expect(result.current[2].color).toBe('transparent');
    });

    it('should set correct colors when there are errors', () => {
      const metrics: Metrics = {
        requests: 100,
        faults5xx: 10,
        errors4xx: 10,
      };

      const { result } = renderHook(() => useDonutSegments(metrics));
      expect(result.current[0].color).toBe(HEALTH_DONUT_COLORS.fault5xx);
      expect(result.current[1].color).toBe(HEALTH_DONUT_COLORS.error4xx);
      expect(result.current[2].color).toBe(HEALTH_DONUT_COLORS.ok2xx);
    });

    it('should calculate correct offset values', () => {
      const metrics: Metrics = {
        requests: 1000,
        faults5xx: 100, // 10%
        errors4xx: 50, // 5%
      };

      const { result } = renderHook(() => useDonutSegments(metrics));
      expect(result.current[0].offset).toBe(0);
      expect(result.current[1].offset).toBe(10);
      expect(result.current[2].offset).toBe(15);
    });

    it('should format labels with correct percentages', () => {
      const metrics: Metrics = {
        requests: 1000,
        faults5xx: 100,
        errors4xx: 50,
      };

      const { result } = renderHook(() => useDonutSegments(metrics));
      expect(result.current[0].label).toBe('10.0% faults (5xx)');
      expect(result.current[1].label).toBe('5.0% errors (4xx)');
      expect(result.current[2].label).toBe('85.0% requests ok');
    });
  });

  it('should maintain consistent output with same input', () => {
    const metrics: Metrics = {
      requests: 1000,
      faults5xx: 100,
      errors4xx: 50,
    };

    const { result, rerender } = renderHook(() => useDonutSegments(metrics));
    const firstRender = result.current;

    rerender();
    expect(result.current).toBe(firstRender); // Testing useMemo memoization
  });
});
