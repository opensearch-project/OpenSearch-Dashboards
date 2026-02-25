/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react';
import { it, mockFitView, mockUseReactFlow } from '../../test_utils/vitest.utilities';
import { useFitViewWithDelay } from './use_fit_view_with_delay.hook';

describe('useFitViewWithDelay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockFitView.mockClear();
    mockUseReactFlow.mockClear();
    mockUseReactFlow.mockReturnValue({ fitView: mockFitView });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('calls fitView after timeout fires', () => {
    const { result } = renderHook(() => useFitViewWithDelay());

    act(() => {
      result.current();
    });

    expect(mockFitView).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(mockFitView).toHaveBeenCalledTimes(1);
  });

  it('passes default padding=0.15 and duration=400', () => {
    const { result } = renderHook(() => useFitViewWithDelay());

    act(() => {
      result.current();
      jest.advanceTimersByTime(0);
    });

    expect(mockFitView).toHaveBeenCalledWith({
      minZoom: 0.6,
      maxZoom: 1,
      padding: 0.15,
      duration: 400,
    });
  });

  it('passes custom padding and duration when specified', () => {
    const { result } = renderHook(() => useFitViewWithDelay(200, 0.3, 800));

    act(() => {
      result.current();
      jest.advanceTimersByTime(0);
    });

    expect(mockFitView).toHaveBeenCalledWith({
      minZoom: 0.6,
      maxZoom: 1,
      padding: 0.3,
      duration: 800,
    });
  });

  it('sets minZoom=0.6 and maxZoom=1.0', () => {
    const { result } = renderHook(() => useFitViewWithDelay());

    act(() => {
      result.current();
      jest.advanceTimersByTime(0);
    });

    expect(mockFitView).toHaveBeenCalledWith(expect.objectContaining({ minZoom: 0.6, maxZoom: 1 }));
  });

  it('cleans up timeout on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const { result, unmount } = renderHook(() => useFitViewWithDelay());

    act(() => {
      result.current();
    });

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it('clears previous timeout when called again', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const { result } = renderHook(() => useFitViewWithDelay());

    act(() => {
      result.current();
    });

    act(() => {
      result.current();
    });

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
