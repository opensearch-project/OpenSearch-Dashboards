/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react';
import { expect } from '../../test-utils/vitest.utilities';
import { useElementHover } from './use-element-hover.hook';

describe('useElementHover', () => {
  it('initializes with isHovered as false', () => {
    const { result } = renderHook(() => useElementHover());
    expect(result.current.isHovered).toBe(false);
  });

  it('sets isHovered to true on onMouseEnter', () => {
    const { result } = renderHook(() => useElementHover());

    act(() => {
      result.current.onMouseEnter({} as React.MouseEvent);
    });

    expect(result.current.isHovered).toBe(true);
  });

  it('sets isHovered to false on onMouseLeave', () => {
    const { result } = renderHook(() => useElementHover());

    act(() => {
      result.current.onMouseEnter({} as React.MouseEvent);
    });
    expect(result.current.isHovered).toBe(true);

    act(() => {
      result.current.onMouseLeave({} as React.MouseEvent);
    });
    expect(result.current.isHovered).toBe(false);
  });

  it('returns stable callback references across renders', () => {
    const { result, rerender } = renderHook(() => useElementHover());

    const firstOnMouseEnter = result.current.onMouseEnter;
    const firstOnMouseLeave = result.current.onMouseLeave;

    rerender();

    expect(result.current.onMouseEnter).toBe(firstOnMouseEnter);
    expect(result.current.onMouseLeave).toBe(firstOnMouseLeave);
  });
});
