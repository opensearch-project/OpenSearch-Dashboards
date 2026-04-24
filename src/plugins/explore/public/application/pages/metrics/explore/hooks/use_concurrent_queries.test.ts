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

  it('lets inflight fetches finish after key leaves viewport', async () => {
    let resolveFetch: (v: string) => void;
    let capturedSignal: AbortSignal | undefined;
    const fetchFn = jest.fn().mockImplementation((_key: string, signal: AbortSignal) => {
      capturedSignal = signal;
      return new Promise<string>((r) => {
        resolveFetch = r;
      });
    });
    const { result } = renderHook(() => useConcurrentQueries(fetchFn, [1]));

    act(() => {
      result.current.onVisibilityChange('a', true);
    });
    await act(async () => {
      jest.advanceTimersByTime(600);
    });
    expect(fetchFn).toHaveBeenCalledTimes(1);

    // Key leaves viewport while fetch is inflight — signal must not abort
    act(() => {
      result.current.onVisibilityChange('a', false);
    });
    expect(capturedSignal?.aborted).toBe(false);

    // Fetch resolves; result still lands so scroll-back is instant
    await act(async () => {
      resolveFetch!('data-a');
    });
    expect(result.current.results.get('a')).toBe('data-a');
  });

  it('batches concurrent completions into a single render', async () => {
    const resolvers: Array<(v: string) => void> = [];
    const fetchFn = jest.fn().mockImplementation(
      () =>
        new Promise<string>((r) => {
          resolvers.push(r);
        })
    );
    let renderCount = 0;
    const { result } = renderHook(() => {
      renderCount++;
      return useConcurrentQueries(fetchFn, [1]);
    });
    const initialRenders = renderCount;

    act(() => {
      result.current.onVisibilityChange('a', true);
      result.current.onVisibilityChange('b', true);
      result.current.onVisibilityChange('c', true);
    });
    await act(async () => {
      jest.advanceTimersByTime(600);
    });
    expect(fetchFn).toHaveBeenCalledTimes(3);

    // Resolve all three fetches in the same synchronous block. With batching,
    // this should cause exactly one additional render, not three.
    const beforeResolve = renderCount;
    await act(async () => {
      resolvers[0]('val-a');
      resolvers[1]('val-b');
      resolvers[2]('val-c');
    });

    expect(result.current.results.get('a')).toBe('val-a');
    expect(result.current.results.get('b')).toBe('val-b');
    expect(result.current.results.get('c')).toBe('val-c');
    expect(renderCount - beforeResolve).toBe(1);
    expect(initialRenders).toBeGreaterThan(0);
  });

  it('populates errors map when fetch rejects', async () => {
    const fetchFn = jest.fn().mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useConcurrentQueries<string>(fetchFn, [1]));

    act(() => {
      result.current.onVisibilityChange('a', true);
    });
    await act(async () => {
      jest.advanceTimersByTime(600);
    });

    expect(result.current.errors.get('a')).toBe('boom');
    expect(result.current.results.size).toBe(0);
  });

  it('stringifies non-Error rejections', async () => {
    const fetchFn = jest.fn().mockRejectedValue('stringly');
    const { result } = renderHook(() => useConcurrentQueries<string>(fetchFn, [1]));

    act(() => {
      result.current.onVisibilityChange('a', true);
    });
    await act(async () => {
      jest.advanceTimersByTime(600);
    });

    expect(result.current.errors.get('a')).toBe('stringly');
  });

  it('clears errors on dependency change', async () => {
    const fetchFn = jest.fn().mockRejectedValue(new Error('boom'));
    const { result, rerender } = renderHook(
      ({ dep }: { dep: number }) => useConcurrentQueries<string>(fetchFn, [dep]),
      { initialProps: { dep: 1 } }
    );

    act(() => {
      result.current.onVisibilityChange('a', true);
    });
    await act(async () => {
      jest.advanceTimersByTime(600);
    });
    expect(result.current.errors.get('a')).toBe('boom');

    rerender({ dep: 2 });
    expect(result.current.errors.size).toBe(0);
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
