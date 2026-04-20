/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_CONCURRENCY = 6;
const DEBOUNCE_MS = 200;

/**
 * Generic hook for concurrent, viewport-aware data fetching with incremental updates.
 *
 * Manages a queue of keys, fires up to `concurrency` requests at a time,
 * and updates results incrementally as each completes. Integrates with
 * IntersectionObserver via the returned `onVisibilityChange` callback.
 */
export function useConcurrentQueries<T>(
  fetchFn: (key: string, signal: AbortSignal) => Promise<T>,
  deps: readonly unknown[],
  concurrency = DEFAULT_CONCURRENCY
) {
  const [results, setResults] = useState<Map<string, T>>(new Map());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const stateRef = useRef({
    queue: [] as string[],
    inflight: new Map<string, AbortController>(),
    pending: new Map<string, ReturnType<typeof setTimeout>>(),
    fetched: new Set<string>(),
    viewport: new Set<string>(),
    pinned: new Set<string>(),
    // Results that completed since the last render, buffered so a burst of
    // concurrent fetches finishing in the same tick produces a single render.
    buffered: new Map<string, T>(),
    bufferedErrors: new Map<string, string>(),
    flushScheduled: false,
  });

  const drainRef = useRef<() => void>(() => {});

  const scheduleFlush = useCallback(() => {
    const s = stateRef.current;
    if (s.flushScheduled) return;
    s.flushScheduled = true;
    Promise.resolve().then(() => {
      s.flushScheduled = false;
      if (s.buffered.size > 0) {
        const batch = s.buffered;
        s.buffered = new Map();
        setResults((prev) => {
          const next = new Map(prev);
          for (const [k, v] of batch) next.set(k, v);
          return next;
        });
      }
      if (s.bufferedErrors.size > 0) {
        const errBatch = s.bufferedErrors;
        s.bufferedErrors = new Map();
        setErrors((prev) => {
          const next = new Map(prev);
          for (const [k, v] of errBatch) next.set(k, v);
          return next;
        });
      }
    });
  }, []);

  const drain = useCallback(() => {
    const s = stateRef.current;
    while (s.inflight.size + s.pending.size < concurrency && s.queue.length > 0) {
      const key = s.queue.shift()!;
      if (s.fetched.has(key) || s.inflight.has(key) || s.pending.has(key)) continue;
      if (!s.viewport.has(key)) continue;

      const timer = setTimeout(() => {
        s.pending.delete(key);
        if (!s.viewport.has(key) || s.fetched.has(key)) {
          drainRef.current();
          return;
        }
        const controller = new AbortController();
        s.inflight.set(key, controller);
        fetchFn(key, controller.signal)
          .then((value) => {
            s.fetched.add(key);
            s.buffered.set(key, value);
            scheduleFlush();
          })
          .catch((err) => {
            if (controller.signal.aborted) return;
            s.fetched.add(key);
            s.bufferedErrors.set(key, err?.message ? String(err.message) : String(err));
            scheduleFlush();
          })
          .finally(() => {
            s.inflight.delete(key);
            drainRef.current();
          });
      }, DEBOUNCE_MS);
      s.pending.set(key, timer);
    }
  }, [fetchFn, concurrency, scheduleFlush]);

  drainRef.current = drain;

  // Reset on dependency change
  useEffect(() => {
    const s = stateRef.current;
    s.queue = [];
    s.fetched.clear();
    s.pinned.clear();
    for (const [, ctrl] of s.inflight) ctrl.abort();
    s.inflight.clear();
    for (const [, timer] of s.pending) clearTimeout(timer);
    s.pending.clear();
    s.buffered.clear();
    s.bufferedErrors.clear();
    setResults(new Map());
    setErrors(new Map());
    // Re-queue everything still in viewport
    s.queue = Array.from(s.viewport);
    drainRef.current();
    // Delayed drain to catch late IntersectionObserver callbacks
    const delayedDrain = setTimeout(() => {
      const st = stateRef.current;
      for (const key of st.viewport) {
        if (
          !st.fetched.has(key) &&
          !st.inflight.has(key) &&
          !st.pending.has(key) &&
          !st.queue.includes(key)
        ) {
          st.queue.push(key);
        }
      }
      drainRef.current();
    }, 300);
    return () => {
      clearTimeout(delayedDrain);
      // Cleanup: abort all inflight and pending on unmount or dep change
      for (const [, ctrl] of s.inflight) ctrl.abort();
      s.inflight.clear();
      for (const [, timer] of s.pending) clearTimeout(timer);
      s.pending.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const onVisibilityChange = useCallback((key: string, visible: boolean) => {
    const s = stateRef.current;
    if (visible) {
      s.viewport.add(key);
      if (!s.fetched.has(key) && !s.inflight.has(key) && !s.pending.has(key)) {
        s.queue.push(key);
        drainRef.current();
      }
    } else {
      if (s.pinned.has(key)) return;
      s.viewport.delete(key);
      // Only cancel work that hasn't started yet. Let inflight fetches finish
      // so their results land in state (and dataCache) — scroll-back then
      // renders immediately without a refetch.
      const timer = s.pending.get(key);
      if (timer) {
        clearTimeout(timer);
        s.pending.delete(key);
      }
      s.queue = s.queue.filter((n) => n !== key);
    }
  }, []);

  const enqueueAll = useCallback((keys: string[]) => {
    const s = stateRef.current;
    for (const key of keys) {
      if (!s.fetched.has(key) && !s.inflight.has(key) && !s.pending.has(key)) {
        s.pinned.add(key);
        s.viewport.add(key);
        s.queue.push(key);
      }
    }
    drainRef.current();
  }, []);

  return { results, errors, onVisibilityChange, enqueueAll };
}
