/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { useExplicitRuns } from './use_explicit_runs';

describe('useExplicitRuns', () => {
  it('runs nothing on its own, then one key per run', async () => {
    const fetchFn = jest.fn().mockResolvedValue('result');
    const { result } = renderHook(() => useExplicitRuns(fetchFn, 'scope'));
    expect(fetchFn).not.toHaveBeenCalled();
    act(() => result.current.run('a'));
    expect(result.current.runs.get('a')?.running).toBe(true);
    await waitFor(() =>
      expect(result.current.runs.get('a')).toMatchObject({ result: 'result', running: false })
    );
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fetchFn).toHaveBeenCalledWith('a', expect.any(AbortSignal));
  });

  it('aborts the previous run of a key and keeps its result until the new one answers', async () => {
    let answers: Array<(value: string) => void> = [];
    const signals: AbortSignal[] = [];
    const fetchFn = jest.fn(
      (_key: string, signal: AbortSignal) =>
        new Promise<string>((resolve) => {
          signals.push(signal);
          answers.push(resolve);
        })
    );
    const { result } = renderHook(() => useExplicitRuns(fetchFn, 'scope'));
    act(() => result.current.run('a'));
    await act(async () => answers[0]('first'));
    expect(result.current.runs.get('a')?.result).toBe('first');
    answers = [];
    act(() => result.current.run('a'));
    act(() => result.current.run('a'));
    expect(signals[1].aborted).toBe(true);
    expect(result.current.runs.get('a')).toMatchObject({ result: 'first', running: true });
    await act(async () => answers[0]('stale'));
    expect(result.current.runs.get('a')?.result).toBe('first');
    await act(async () => answers[1]('second'));
    expect(result.current.runs.get('a')).toMatchObject({ result: 'second', running: false });
  });

  it('keeps the last result with the error of a failed run', async () => {
    const fetchFn = jest
      .fn()
      .mockResolvedValueOnce('ok')
      .mockRejectedValueOnce(new Error('denied'));
    const { result } = renderHook(() => useExplicitRuns(fetchFn, 'scope'));
    act(() => result.current.run('a'));
    await waitFor(() => expect(result.current.runs.get('a')?.result).toBe('ok'));
    act(() => result.current.run('a'));
    await waitFor(() => expect(result.current.runs.get('a')?.error).toBe('denied'));
    expect(result.current.runs.get('a')).toMatchObject({ result: 'ok', running: false });
  });

  it('runs at most `concurrency` at once; more Run presses wait their turn', async () => {
    const answers: Record<string, (value: string) => void> = {};
    const fetchFn = jest.fn(
      (key: string) => new Promise<string>((resolve) => (answers[key] = resolve))
    );
    const { result } = renderHook(() => useExplicitRuns(fetchFn, 'scope', 2));
    act(() => {
      result.current.run('a');
      result.current.run('b');
      result.current.run('c');
    });
    expect(fetchFn.mock.calls.map(([key]) => key)).toEqual(['a', 'b']);
    expect(result.current.runs.get('c')?.running).toBe(true);
    await act(async () => answers.a('done'));
    expect(fetchFn.mock.calls.map(([key]) => key)).toEqual(['a', 'b', 'c']);
  });

  it('stops a running card, keeping its last result, and frees its slot', async () => {
    const signals: Record<string, AbortSignal[]> = {};
    const answers: Record<string, Array<(value: string) => void>> = {};
    const fetchFn = jest.fn(
      (key: string, signal: AbortSignal) =>
        new Promise<string>((resolve) => {
          (signals[key] = signals[key] ?? []).push(signal);
          (answers[key] = answers[key] ?? []).push(resolve);
        })
    );
    const { result } = renderHook(() => useExplicitRuns(fetchFn, 'scope', 1));
    act(() => result.current.run('a'));
    await act(async () => answers.a[0]('first'));
    act(() => {
      result.current.run('a');
      result.current.run('b');
    });
    act(() => result.current.stop('a'));
    expect(signals.a[1].aborted).toBe(true);
    expect(result.current.runs.get('a')).toEqual({ result: 'first', running: false });
    // The slot it held goes to the waiting card.
    expect(fetchFn.mock.calls.map(([key]) => key)).toEqual(['a', 'a', 'b']);
    // Stopping a waiting card takes it off the queue.
    act(() => result.current.run('c'));
    act(() => result.current.stop('c'));
    await act(async () => answers.b[0]('b done'));
    expect(fetchFn.mock.calls.map(([key]) => key)).toEqual(['a', 'a', 'b']);
    expect(result.current.runs.get('c')?.running).toBe(false);
  });

  it("keeps the failed run's error as is", async () => {
    const rejection = Object.assign(new Error('denied'), { statusCode: 403 });
    const fetchFn = jest.fn().mockRejectedValue(rejection);
    const { result } = renderHook(() => useExplicitRuns(fetchFn, 'scope'));
    act(() => result.current.run('a'));
    await waitFor(() => expect(result.current.runs.get('a')?.errorCause).toBe(rejection));
  });

  it('aborts and forgets every run when the reset key changes, and on unmount', async () => {
    const signals: AbortSignal[] = [];
    const fetchFn = jest.fn(
      (_key: string, signal: AbortSignal) =>
        new Promise<string>(() => {
          signals.push(signal);
        })
    );
    const { result, rerender, unmount } = renderHook(
      ({ reset }) => useExplicitRuns(fetchFn, reset),
      {
        initialProps: { reset: 'one' },
      }
    );
    act(() => result.current.run('a'));
    rerender({ reset: 'two' });
    expect(signals[0].aborted).toBe(true);
    expect(result.current.runs.size).toBe(0);
    act(() => result.current.run('b'));
    unmount();
    expect(signals[1].aborted).toBe(true);
  });
});
