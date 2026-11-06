/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { EXPLICIT_RUN_CONCURRENCY } from '../constants';

export interface ExplicitRun<T> {
  result?: T;
  error?: string;
  /** Errors are kept as is too, so a card can read more than the message (status, name). */
  errorCause?: unknown;
  /** Running, or waiting for a free slot (see `concurrency`). */
  running: boolean;
}

const messageOf = (error: unknown) =>
  error instanceof Error && error.message ? error.message : String(error);

/**
 * Per-card runs that start only when `run(key)` is called, for sources whose queries wait for the
 * user. Unlike the viewport scheduler, nothing ever runs on its own: not on scroll, not on a reset.
 * At most `concurrency` run at once; more Run presses wait their turn (a run can start several
 * billed queries, and async backends cap concurrent queries). A new run of a card replaces its
 * previous one (aborting it) and keeps the old result on screen until it answers; `stop(key)`
 * cancels one. Everything is aborted and forgotten when `resetKey` changes or on unmount.
 */
export const useExplicitRuns = <T>(
  fetchFn: (key: string, signal: AbortSignal) => Promise<T>,
  resetKey: string,
  concurrency = EXPLICIT_RUN_CONCURRENCY
) => {
  const [runs, setRuns] = useState<Map<string, ExplicitRun<T>>>(new Map());
  const controllers = useRef(new Map<string, AbortController>());
  const queue = useRef<string[]>([]);
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const update = useCallback(
    (key: string, next: (prev?: ExplicitRun<T>) => ExplicitRun<T>) =>
      setRuns((prev) => new Map(prev).set(key, next(prev.get(key)))),
    []
  );

  const abortAll = useCallback(() => {
    controllers.current.forEach((controller) => controller.abort());
    controllers.current.clear();
    queue.current = [];
  }, []);

  useEffect(() => {
    abortAll();
    setRuns(new Map());
    return abortAll;
  }, [resetKey, abortAll]);

  const startNext = useCallback(() => {
    while (controllers.current.size < concurrency && queue.current.length) {
      const key = queue.current.shift()!;
      const controller = new AbortController();
      controllers.current.set(key, controller);
      fetchRef
        .current(key, controller.signal)
        .then((result) => {
          if (controller.signal.aborted) return;
          update(key, () => ({ result, running: false }));
        })
        .catch((error) => {
          if (controller.signal.aborted) return;
          update(key, (prev) => ({
            result: prev?.result,
            error: messageOf(error),
            errorCause: error,
            running: false,
          }));
        })
        .finally(() => {
          if (controllers.current.get(key) === controller) controllers.current.delete(key);
          startNext();
        });
    }
  }, [concurrency, update]);

  const run = useCallback(
    (key: string) => {
      controllers.current.get(key)?.abort();
      controllers.current.delete(key);
      queue.current = [...queue.current.filter((queued) => queued !== key), key];
      update(key, (prev) => ({ ...prev, running: true, error: undefined, errorCause: undefined }));
      startNext();
    },
    [update, startNext]
  );

  /**
   * Stops a card's run (running or waiting): aborts it, which for an async source stops the query
   * through its search interceptor. The card keeps the result it had before, if any.
   */
  const stop = useCallback(
    (key: string) => {
      const controller = controllers.current.get(key);
      const queued = queue.current.includes(key);
      if (!controller && !queued) return;
      controller?.abort();
      controllers.current.delete(key);
      queue.current = queue.current.filter((queuedKey) => queuedKey !== key);
      update(key, (prev) => ({ result: prev?.result, running: false }));
      startNext();
    },
    [update, startNext]
  );

  return { runs, run, stop };
};
