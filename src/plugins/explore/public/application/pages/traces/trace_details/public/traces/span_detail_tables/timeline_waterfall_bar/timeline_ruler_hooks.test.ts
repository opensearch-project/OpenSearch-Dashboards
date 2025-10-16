/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import { useTimelineTicks } from './timeline_ruler_hooks';

describe('useTimelineTicks', () => {
  it('should generate ticks for basic range', () => {
    const { result } = renderHook(() => useTimelineTicks(1000, 0, 8));

    expect(result.current).toHaveLength(6);
    expect(result.current[0]).toEqual({ value: 0, offsetPercent: 0 });
    expect(result.current[5]).toEqual({ value: 1000, offsetPercent: 100 });
  });

  it('should respect container padding', () => {
    const { result } = renderHook(() => useTimelineTicks(100, 0, 8, 10));

    expect(result.current[0].offsetPercent).toBe(10);
    expect(result.current[result.current.length - 1].offsetPercent).toBe(90);
  });

  it('should generate ticks based on desired count', () => {
    const { result } = renderHook(() => useTimelineTicks(100, 0, 5));

    expect(result.current.length).toBeGreaterThan(0);
    expect(result.current.length).toBeLessThanOrEqual(10);
  });

  it('should handle non-zero minimum values', () => {
    const { result } = renderHook(() => useTimelineTicks(150, 50, 8));

    expect(result.current[0].value).toBeGreaterThanOrEqual(50);
    expect(result.current[0].offsetPercent).toBe(10);
  });

  it('should generate nice step values', () => {
    const { result } = renderHook(() => useTimelineTicks(1000, 0, 8));

    const steps = result.current.slice(1).map((tick, i) => tick.value - result.current[i].value);
    expect(steps.every((step) => step === steps[0])).toBe(true);
  });

  it('should round values to 2 decimal places', () => {
    const { result } = renderHook(() => useTimelineTicks(3.333, 0, 8));

    result.current.forEach((tick) => {
      expect(tick.value).toBe(Math.round(tick.value * 100) / 100);
    });
  });

  it('should return empty array when range is zero', () => {
    const { result } = renderHook(() => useTimelineTicks(100, 100, 8));

    expect(result.current).toEqual([]);
  });

  it('should return empty array when range is negative', () => {
    const { result } = renderHook(() => useTimelineTicks(50, 100, 8));

    expect(result.current).toEqual([]);
  });

  it('should return empty array when desiredTickCount is less than 2', () => {
    const { result } = renderHook(() => useTimelineTicks(100, 0, 1));

    expect(result.current).toEqual([]);
  });

  it('should handle floating point precision correctly', () => {
    const { result } = renderHook(() => useTimelineTicks(0.3, 0.1, 3));

    expect(result.current.length).toBeGreaterThan(0);
    result.current.forEach((tick) => {
      expect(tick.value).toBeGreaterThanOrEqual(0.1);
      expect(tick.value).toBeLessThanOrEqual(0.3);
    });
  });

  it('should not exceed max value in ticks', () => {
    const { result } = renderHook(() => useTimelineTicks(97, 0, 8));

    result.current.forEach((tick) => {
      expect(tick.value).toBeLessThanOrEqual(97);
    });
  });
});
