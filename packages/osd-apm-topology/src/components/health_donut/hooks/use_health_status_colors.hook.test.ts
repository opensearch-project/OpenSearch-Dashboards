/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import { useHealthStatusColors } from './use_health_status_colors.hook';
import { HEALTH_DONUT_COLORS, HEALTH_DONUT_STATUS } from '../constants';

describe('useHealthStatusColors', () => {
  it('should return fault colors when status is FAULT', () => {
    const { result } = renderHook(() => useHealthStatusColors(HEALTH_DONUT_STATUS.FAULT));

    expect(result.current).toEqual({
      fill: HEALTH_DONUT_COLORS.faultFill,
      stroke: HEALTH_DONUT_COLORS.faultFill,
    });
  });

  it('should return error colors when status is ERROR', () => {
    const { result } = renderHook(() => useHealthStatusColors(HEALTH_DONUT_STATUS.ERROR));

    expect(result.current).toEqual({
      fill: HEALTH_DONUT_COLORS.errorFill,
      stroke: HEALTH_DONUT_COLORS.errorFill,
    });
  });

  it('should return default colors when status is undefined', () => {
    const { result } = renderHook(() => useHealthStatusColors(undefined));

    expect(result.current).toEqual({
      fill: HEALTH_DONUT_COLORS.white,
      stroke: HEALTH_DONUT_COLORS.background,
    });
  });

  it('should return default colors when status is not recognized', () => {
    const { result } = renderHook(() => useHealthStatusColors('UNKNOWN_STATUS'));

    expect(result.current).toEqual({
      fill: HEALTH_DONUT_COLORS.white,
      stroke: HEALTH_DONUT_COLORS.background,
    });
  });

  it('should memoize the result and not recalculate for same status', () => {
    const { result, rerender } = renderHook(({ status }) => useHealthStatusColors(status), {
      initialProps: { status: HEALTH_DONUT_STATUS.FAULT },
    });

    const initialResult = result.current;

    // Rerender with the same status
    rerender({ status: HEALTH_DONUT_STATUS.FAULT });

    expect(result.current).toBe(initialResult); // Check reference equality
  });
});
