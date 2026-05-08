/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import { INVERSE_GOLDEN_RATIO } from '../../../shared/constants/visual.constants';
import { useIconSizing } from './use_icon_sizing.hook';

describe('useIconSizing', () => {
  it('should calculate icon sizes correctly for a given base size', () => {
    const baseSize = 100;
    const { result } = renderHook(() => useIconSizing(baseSize));

    const expectedScaleFactor = baseSize * INVERSE_GOLDEN_RATIO;
    const expectedSize = expectedScaleFactor * INVERSE_GOLDEN_RATIO;

    expect(result.current.centerIconSize).toBe(expectedSize);
    expect(result.current.sliStatusIconSize).toBe(expectedSize);
  });

  it('should return minimum icon sizes when calculated sizes are below minimums', () => {
    const smallBaseSize = 20;
    const { result } = renderHook(() => useIconSizing(smallBaseSize));

    expect(result.current.centerIconSize).toBe(13); // MIN_ICON_SIZE
    expect(result.current.sliStatusIconSize).toBe(12); // MIN_SLI_STATUS_ICON_SIZE
  });

  it('should handle zero input size', () => {
    const { result } = renderHook(() => useIconSizing(0));

    expect(result.current.centerIconSize).toBe(13); // MIN_ICON_SIZE
    expect(result.current.sliStatusIconSize).toBe(12); // MIN_SLI_STATUS_ICON_SIZE
  });

  it('should handle large input sizes', () => {
    const largeSize = 1000;
    const { result } = renderHook(() => useIconSizing(largeSize));

    const expectedScaleFactor = largeSize * INVERSE_GOLDEN_RATIO;
    const expectedSize = expectedScaleFactor * INVERSE_GOLDEN_RATIO;

    expect(result.current.centerIconSize).toBe(expectedSize);
    expect(result.current.sliStatusIconSize).toBe(expectedSize);
  });

  it('should return object with correct properties', () => {
    const { result } = renderHook(() => useIconSizing(100));

    expect(result.current).toHaveProperty('centerIconSize');
    expect(result.current).toHaveProperty('sliStatusIconSize');
    expect(typeof result.current.centerIconSize).toBe('number');
    expect(typeof result.current.sliStatusIconSize).toBe('number');
  });
});
