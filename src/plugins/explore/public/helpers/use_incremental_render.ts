/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseIncrementalRenderOptions {
  /** Number of items available to render. */
  total: number;
  /** Initial render size, and the number of items added each time the sentinel scrolls into view. */
  pageSize: number;
  /**
   * Items queued for lazy rendering per sentinel hit (and initially). They are rendered one
   * `pageSize` per animation frame while the frame rate stays above ~30 fps, so a fast browser
   * fills the viewport without waiting for the next scroll. 0 disables the lookahead.
   */
  lookahead?: number;
  /**
   * Upper bound for scroll-driven growth. Once `count` reaches it the sentinel must not be
   * rendered any more (`capped` is true) and further growth only happens through `showMore`,
   * so scrolling alone can never mount an unbounded list.
   */
  cap?: number;
  /** When false the rendered count stays at `pageSize` and no observer is attached. */
  enabled?: boolean;
  /** Changing this value resets the rendered count to `pageSize`. */
  resetKey?: unknown;
}

export interface IncrementalRender {
  /** Number of items the caller should render: `items.slice(0, count)`. */
  count: number;
  /** True while `count < total`. */
  hasMore: boolean;
  /** True when more items exist but the scroll cap has been reached; render an explicit control instead of the sentinel. */
  capped: boolean;
  /** Attach to an element placed after the rendered items; it grows the list when it becomes visible. */
  sentinelRef: (node: HTMLElement | null) => void;
  /** Grow the rendered count explicitly (defaults to one `pageSize`). Not subject to `cap`. */
  showMore: (n?: number) => void;
}

// Frames closer together than this are considered a healthy (> 30 fps) frame rate.
const LAZY_RENDER_FRAME_BUDGET_MS = 33;

/**
 * Renders a long list incrementally: a first page, then one more page every time a sentinel
 * element at the end of the rendered items scrolls into view, optionally with an fps-throttled
 * lookahead and a hard cap on scroll-driven growth.
 */
export function useIncrementalRender({
  total,
  pageSize,
  lookahead = 0,
  cap,
  enabled = true,
  resetKey,
}: UseIncrementalRenderOptions): IncrementalRender {
  const clampToCap = useCallback(
    (value: number) => (cap === undefined ? value : Math.min(value, cap)),
    [cap]
  );

  const [count, setCount] = useState(pageSize);
  // Both counters are clamped to the cap so the lookahead loop below always has a reachable
  // target; a lookahead larger than the cap would otherwise never be satisfied.
  const [desiredCount, setDesiredCount] = useState(() => clampToCap(Math.min(total, lookahead)));

  // Reset when the underlying list changes identity (not on first mount).
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setCount(pageSize);
    setDesiredCount(clampToCap(Math.min(total, lookahead)));
    // `total` is intentionally not a dependency: new items arriving for the same list must
    // extend it, not restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, pageSize, lookahead, clampToCap]);

  const [sentinelElement, setSentinelElement] = useState<HTMLElement | null>(null);
  const sentinelRef = useCallback((node: HTMLElement | null) => {
    setSentinelElement(node);
  }, []);

  useEffect(() => {
    if (!enabled || !sentinelElement) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Render one page now and queue a lookahead for the frame-throttled loop below.
          setCount((prev) => clampToCap(prev + pageSize));
          setDesiredCount((prev) => clampToCap(prev + lookahead));
        }
      },
      {
        // Important that 0 < threshold < 1, since the OSD application div has a transparent
        // fade at the bottom which causes the sentinel element to sometimes not be 100% visible.
        threshold: 0.1,
      }
    );
    observer.observe(sentinelElement);
    return () => observer.unobserve(sentinelElement);
  }, [enabled, sentinelElement, pageSize, lookahead, clampToCap]);

  // Lazy lookahead: render another page per animation frame while frames are arriving fast
  // enough, so a healthy browser fills the queued lookahead without further scrolling.
  const frameRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  useEffect(() => {
    // Also stop once the cap is reached, so the loop can never run without being able to make
    // progress regardless of how the target was computed.
    if (!enabled || count >= desiredCount || (cap !== undefined && count >= cap)) {
      return;
    }
    // The frame baseline persists across effect runs so a fast browser renders one page per
    // frame. A frame slower than the budget means the browser is already struggling: the loop
    // stops instead of rescheduling without progress, and clears the baseline so the next run
    // (triggered by scrolling) starts with a fresh warm-up frame.
    const renderMore = (time: number) => {
      const isWarmUpFrame = lastFrameTimeRef.current === 0;
      const isFastFrame =
        !isWarmUpFrame && time - lastFrameTimeRef.current < LAZY_RENDER_FRAME_BUDGET_MS;
      lastFrameTimeRef.current = time;
      if (isFastFrame) {
        setCount((prev) => clampToCap(prev + pageSize));
      } else if (!isWarmUpFrame) {
        lastFrameTimeRef.current = 0;
        return;
      }
      frameRef.current = requestAnimationFrame(renderMore);
    };
    frameRef.current = requestAnimationFrame(renderMore);
    return () => cancelAnimationFrame(frameRef.current);
  }, [enabled, count, desiredCount, pageSize, cap, clampToCap]);

  const showMore = useCallback(
    (n: number = pageSize) => {
      setCount((prev) => prev + n);
    },
    [pageSize]
  );

  const hasMore = count < total;
  const capped = hasMore && cap !== undefined && count >= cap;

  return { count, hasMore, capped, sentinelRef, showMore };
}
