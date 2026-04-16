/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react';
import { useConcurrentQueries } from './use_concurrent_queries';

describe('useConcurrentQueries', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('returns empty results initially', () => {
    const fetchFn = jest.fn().mockResolvedValue('data');
    const { result } = renderHook(() => useConcurrentQueries(fetchFn, [1]));
    expect(result.current.results.size).toBe(0);
    expect(typeof result.current.onVisibilityChange).toBe('function');
    expect(typeof result.current.enqueueAll).toBe('function');
  });

  it('queues visible keys for fetching', async () => {
    let resolveFetch: (v: string) => void;
    const fetchFn = jest.fn().mockImplementation(
      () =>
        new Promise<string>((r) => {
          resolveFetch = r;
        })
    );
    const { result } = renderHook(() => useConcurrentQueries(fetchFn, [1]));

    // Mark key as visible
    act(() => {
      result.current.onVisibilityChange('a', true);
    });

    // Advance past debounce (200ms) + delayed drain (300ms)
    await act(async () => {
      jest.advanceTimersByTime(600);
    });

    expect(fetchFn).toHaveBeenCalledWith('a', expect.any(AbortSignal));

    // Resolve the fetch
    await act(async () => {
      resolveFetch!('data-a');
    });

    expect(result.current.results.get('a')).toBe('data-a');
  });

  it('cancels pending fetch when key leaves viewport', async () => {
    const fetchFn = jest.fn().mockResolvedValue('data');
    const { result } = renderHook(() => useConcurrentQueries(fetchFn, [1]));

    act(() => {
      result.current.onVisibilityChange('a', true);
    });
    // Remove before debounce fires
    act(() => {
      result.current.onVisibilityChange('a', false);
    });

    await act(async () => {
      jest.advanceTimersByTime(600);
    });

    // fetchFn should not have been called since key left viewport before debounce
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('resets on dependency change', async () => {
    const fetchFn = jest.fn().mockResolvedValue('data');
    const { result, rerender } = renderHook(
      ({ dep }: { dep: number }) => useConcurrentQueries(fetchFn, [dep]),
      { initialProps: { dep: 1 } }
    );

    act(() => {
      result.current.onVisibilityChange('a', true);
    });
    await act(async () => {
      jest.advanceTimersByTime(600);
    });

    // After dep change, results should be cleared
    rerender({ dep: 2 });
    expect(result.current.results.size).toBe(0);
  });
});
