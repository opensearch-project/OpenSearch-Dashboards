/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, renderHook } from '@testing-library/react';
import { useIncrementalRender, UseIncrementalRenderOptions } from './use_incremental_render';

describe('useIncrementalRender', () => {
  let observerCallback: (entries: Array<Partial<IntersectionObserverEntry>>) => void;
  const observe = jest.fn();
  const unobserve = jest.fn();

  beforeEach(() => {
    observe.mockClear();
    unobserve.mockClear();
    window.IntersectionObserver = jest.fn().mockImplementation((cb) => {
      observerCallback = cb;
      return { observe, unobserve, disconnect: jest.fn() };
    });
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0);
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const setup = (options: UseIncrementalRenderOptions) => {
    const hook = renderHook((props: UseIncrementalRenderOptions) => useIncrementalRender(props), {
      initialProps: options,
    });
    const attachSentinel = () => {
      act(() => {
        hook.result.current.sentinelRef(document.createElement('div'));
      });
    };
    const scrollSentinelIntoView = () => {
      act(() => {
        observerCallback([{ isIntersecting: true }]);
      });
    };
    return { ...hook, attachSentinel, scrollSentinelIntoView };
  };

  it('renders one page initially and reports remaining items', () => {
    const { result } = setup({ total: 1000, pageSize: 50 });
    expect(result.current.count).toBe(50);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.capped).toBe(false);
  });

  it('grows by one page each time the sentinel becomes visible', () => {
    const { result, attachSentinel, scrollSentinelIntoView } = setup({ total: 1000, pageSize: 50 });
    attachSentinel();
    expect(observe).toHaveBeenCalledTimes(1);

    scrollSentinelIntoView();
    expect(result.current.count).toBe(100);
    scrollSentinelIntoView();
    expect(result.current.count).toBe(150);
  });

  it('stops scroll-driven growth at the cap and only grows further through showMore', () => {
    const { result, attachSentinel, scrollSentinelIntoView } = setup({
      total: 1000,
      pageSize: 50,
      cap: 120,
    });
    attachSentinel();
    scrollSentinelIntoView();
    scrollSentinelIntoView();
    scrollSentinelIntoView();
    expect(result.current.count).toBe(120);
    expect(result.current.capped).toBe(true);
    expect(result.current.hasMore).toBe(true);

    act(() => {
      result.current.showMore();
    });
    expect(result.current.count).toBe(170);

    act(() => {
      result.current.showMore(1000);
    });
    expect(result.current.count).toBe(1170);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.capped).toBe(false);
  });

  it('clamps the lookahead target to the cap so the frame loop terminates', () => {
    const raf = window.requestAnimationFrame as jest.Mock;
    raf.mockClear();
    const { result, rerender, attachSentinel, scrollSentinelIntoView } = setup({
      total: 1000,
      pageSize: 10,
      lookahead: 200,
      cap: 30,
      resetKey: 'a',
    });
    attachSentinel();
    scrollSentinelIntoView();
    scrollSentinelIntoView();
    expect(result.current.count).toBe(30);
    expect(result.current.capped).toBe(true);

    // Re-render after reaching the cap: the lookahead effect must not schedule another frame.
    raf.mockClear();
    rerender({ total: 1000, pageSize: 10, lookahead: 200, cap: 30, resetKey: 'a' });
    expect(raf).not.toHaveBeenCalled();

    // Reset keeps the target clamped as well.
    rerender({ total: 1000, pageSize: 10, lookahead: 200, cap: 30, resetKey: 'b' });
    expect(result.current.count).toBe(10);
  });

  it('stops the lookahead loop after a slow frame instead of rescheduling forever', () => {
    const raf = window.requestAnimationFrame as jest.Mock;
    let frameCallback: FrameRequestCallback | undefined;
    raf.mockImplementation((cb: FrameRequestCallback) => {
      frameCallback = cb;
      return 1;
    });
    const { result } = setup({ total: 1000, pageSize: 10, lookahead: 50 });
    expect(raf).toHaveBeenCalledTimes(1);

    // Warm-up frame: records the baseline and reschedules.
    act(() => frameCallback!(1000));
    expect(raf).toHaveBeenCalledTimes(2);
    expect(result.current.count).toBe(10);

    // Fast frame: renders a page (the effect re-runs and reschedules).
    act(() => frameCallback!(1016));
    expect(result.current.count).toBe(20);
    const callsAfterFastFrame = raf.mock.calls.length;

    // Slow frame: no render and no reschedule.
    act(() => frameCallback!(1116));
    expect(result.current.count).toBe(20);
    expect(raf).toHaveBeenCalledTimes(callsAfterFastFrame);
  });

  it('is not capped when everything fits under the cap', () => {
    const { result } = setup({ total: 30, pageSize: 50, cap: 500 });
    expect(result.current.count).toBe(50);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.capped).toBe(false);
  });

  it('resets to one page when resetKey changes but not when total changes', () => {
    const { result, rerender, attachSentinel, scrollSentinelIntoView } = setup({
      total: 1000,
      pageSize: 50,
      resetKey: 'dataset-a',
    });
    attachSentinel();
    scrollSentinelIntoView();
    expect(result.current.count).toBe(100);

    rerender({ total: 2000, pageSize: 50, resetKey: 'dataset-a' });
    expect(result.current.count).toBe(100);

    rerender({ total: 2000, pageSize: 50, resetKey: 'dataset-b' });
    expect(result.current.count).toBe(50);
  });

  it('does not observe the sentinel when disabled', () => {
    const { attachSentinel } = setup({ total: 1000, pageSize: 50, enabled: false });
    attachSentinel();
    expect(observe).not.toHaveBeenCalled();
  });

  it('unobserves the sentinel on unmount', () => {
    const { attachSentinel, unmount } = setup({ total: 1000, pageSize: 50 });
    attachSentinel();
    unmount();
    expect(unobserve).toHaveBeenCalledTimes(1);
  });
});
