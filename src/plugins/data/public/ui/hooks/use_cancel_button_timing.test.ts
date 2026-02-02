/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { renderHook, act } from '@testing-library/react';
import { useCancelButtonTiming } from './use_cancel_button_timing';

describe('useCancelButtonTiming', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should show cancel button initially when showInitially is true', () => {
    const { result } = renderHook(() => useCancelButtonTiming(false, true));
    expect(result.current).toBe(true);
  });

  it('should not show cancel button initially when showInitially is false', () => {
    const { result } = renderHook(() => useCancelButtonTiming(false, false));
    expect(result.current).toBe(false);
  });

  it('should show cancel button after 50ms delay when shouldShow becomes true', () => {
    const { result, rerender } = renderHook(
      ({ shouldShow }) => useCancelButtonTiming(shouldShow, false),
      { initialProps: { shouldShow: false } }
    );

    expect(result.current).toBe(false);

    rerender({ shouldShow: true });
    expect(result.current).toBe(false); // Still false immediately

    act(() => {
      jest.advanceTimersByTime(50);
    });

    expect(result.current).toBe(true);
  });

  it('should keep cancel button visible for minimum 200ms when hiding', () => {
    const { result, rerender } = renderHook(
      ({ shouldShow }) => useCancelButtonTiming(shouldShow, true),
      { initialProps: { shouldShow: false } }
    );

    expect(result.current).toBe(true);

    // Start hiding process
    rerender({ shouldShow: false });
    expect(result.current).toBe(true); // Still visible

    // Wait 100ms (less than 200ms minimum)
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe(true);

    // Complete 200ms minimum display time
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe(false);
  });

  it('should transition from initial mode to delayed mode after first query', () => {
    const { result, rerender } = renderHook(
      ({ shouldShow }) => useCancelButtonTiming(shouldShow, true),
      { initialProps: { shouldShow: true } }
    );

    expect(result.current).toBe(true);

    // Complete initial query
    rerender({ shouldShow: false });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current).toBe(false);

    // Start new query - should now use 50ms delay
    rerender({ shouldShow: true });
    expect(result.current).toBe(false); // No longer shows immediately

    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(result.current).toBe(true);
  });

  it('should clean up timers on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const { unmount } = renderHook(() => useCancelButtonTiming(true, true));

    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
