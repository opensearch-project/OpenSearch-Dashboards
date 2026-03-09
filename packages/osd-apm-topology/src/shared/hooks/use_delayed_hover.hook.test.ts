/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react';
import { useDelayedHover } from './use_delayed_hover.hook';

describe('useDelayedHover', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should initialize with showElement as false', () => {
    const { result } = renderHook(() => useDelayedHover());
    expect(result.current.showElement).toBe(false);
  });

  it('should show element immediately on mouse enter', () => {
    const { result } = renderHook(() => useDelayedHover());
    act(() => {
      result.current.onMouseEnter();
    });

    expect(result.current.showElement).toBe(true);
  });

  it('should hide element after delay on mouse leave', () => {
    const delay = 500;
    const { result } = renderHook(() => useDelayedHover({ delay }));

    // Show element first
    act(() => {
      result.current.onMouseEnter();
    });
    expect(result.current.showElement).toBe(true);

    // Trigger mouse leave
    act(() => {
      result.current.onMouseLeave();
    });
    // Element should still be visible before delay
    expect(result.current.showElement).toBe(true);

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(delay);
    });

    // Element should be hidden after delay
    expect(result.current.showElement).toBe(false);
  });

  it('should clear timeout on mouse enter after mouse leave', () => {
    const delay = 500;
    const { result } = renderHook(() => useDelayedHover({ delay }));

    // Show element
    act(() => {
      result.current.onMouseEnter();
    });

    // Trigger mouse leave
    act(() => {
      result.current.onMouseLeave();
    });

    // Mouse enter again before delay expires
    act(() => {
      result.current.onMouseEnter();
    });

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(delay);
    });

    // Element should still be visible
    expect(result.current.showElement).toBe(true);
  });

  it('should use default delay when not provided', () => {
    const { result } = renderHook(() => useDelayedHover());

    act(() => {
      result.current.onMouseEnter();
    });

    act(() => {
      result.current.onMouseLeave();
    });

    // Element should still be visible before default delay (500ms)
    act(() => {
      jest.advanceTimersByTime(499);
    });
    expect(result.current.showElement).toBe(true);

    // Element should be hidden after default delay
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current.showElement).toBe(false);
  });

  it('should clean up timeout on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const { result, unmount } = renderHook(() => useDelayedHover());

    act(() => {
      result.current.onMouseLeave();
    });

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
