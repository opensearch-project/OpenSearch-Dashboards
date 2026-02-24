/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import type { Metrics } from '../../../shared/types/common.types';
import { useMetricPercentages } from './use-metric-percentages.hook';

describe('useMetricPercentages', () => {
  it('should calculate correct percentages for valid metrics', () => {
    const metrics: Metrics = {
      requests: 1000,
      faults5xx: 50,
      errors4xx: 100,
    };

    const { result } = renderHook(() => useMetricPercentages(metrics));

    expect(result.current.faults5xxPercent).toBe(5); // 50/1000 * 100
    expect(result.current.errors4xxPercent).toBe(10); // 100/1000 * 100
  });

  it('should return zero percentages when requests is 0', () => {
    const metrics: Metrics = {
      requests: 0,
      faults5xx: 50,
      errors4xx: 100,
    };

    const { result } = renderHook(() => useMetricPercentages(metrics));

    expect(result.current.faults5xxPercent).toBe(0);
    expect(result.current.errors4xxPercent).toBe(0);
  });

  it('should handle zero error counts correctly', () => {
    const metrics: Metrics = {
      requests: 1000,
      faults5xx: 0,
      errors4xx: 0,
    };

    const { result } = renderHook(() => useMetricPercentages(metrics));

    expect(result.current.faults5xxPercent).toBe(0);
    expect(result.current.errors4xxPercent).toBe(0);
  });

  it('should memoize results and not recalculate unnecessarily', () => {
    const metrics: Metrics = {
      requests: 1000,
      faults5xx: 50,
      errors4xx: 100,
    };

    const { result, rerender } = renderHook(() => useMetricPercentages(metrics));
    const firstResult = result.current;

    rerender();

    expect(result.current).toBe(firstResult); // Should be the same object reference
  });
});
