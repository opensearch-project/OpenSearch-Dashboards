/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react';
import { useFlyoutResize } from './use_flyout_resize';

describe('useFlyoutResize', () => {
  it('returns initial width', () => {
    const { result } = renderHook(() => useFlyoutResize());
    expect(result.current.flyoutWidth).toBeUndefined();
    expect(result.current.isResizingFlyout).toBe(false);
  });

  it('sets isResizingFlyout on mousedown', () => {
    const { result } = renderHook(() => useFlyoutResize());

    act(() => {
      result.current.handleFlyoutMouseDown(({
        preventDefault: jest.fn(),
      } as unknown) as React.MouseEvent);
    });

    expect(result.current.isResizingFlyout).toBe(true);
  });

  it('handleFlyoutMouseDown is stable across renders', () => {
    const { result, rerender } = renderHook(() => useFlyoutResize());
    const first = result.current.handleFlyoutMouseDown;
    rerender();
    expect(result.current.handleFlyoutMouseDown).toBe(first);
  });
});
