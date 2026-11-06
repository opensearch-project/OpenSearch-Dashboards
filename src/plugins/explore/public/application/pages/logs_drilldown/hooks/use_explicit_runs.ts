/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface ExplicitRun<T> {
  result?: T;
  error?: string;
  running: boolean;
}

const messageOf = (error: unknown) =>
  error instanceof Error && error.message ? error.message : String(error);

/**
 * Per-card runs that start only when `run(key)` is called, for sources whose queries wait for the
 * user. Unlike the viewport scheduler, nothing ever runs on its own: not on scroll, not on a reset.
 * A new run of a card aborts its previous one and keeps the old result on screen until it answers.
 * Everything is aborted and forgotten when `resetKey` changes or on unmount.
 */
export const useExplicitRuns = <T>(
  fetchFn: (key: string, signal: AbortSignal) => Promise<T>,
  resetKey: string
) => {
  const [runs, setRuns] = useState<Map<string, ExplicitRun<T>>>(new Map());
  const controllers = useRef(new Map<string, AbortController>());
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const abortAll = useCallback(() => {
    controllers.current.forEach((controller) => controller.abort());
    controllers.current.clear();
  }, []);

  useEffect(() => {
    abortAll();
    setRuns(new Map());
    return abortAll;
  }, [resetKey, abortAll]);

  const update = useCallback(
    (key: string, next: (prev?: ExplicitRun<T>) => ExplicitRun<T>) =>
      setRuns((prev) => new Map(prev).set(key, next(prev.get(key)))),
    []
  );

  const run = useCallback(
    (key: string) => {
      controllers.current.get(key)?.abort();
      const controller = new AbortController();
      controllers.current.set(key, controller);
      update(key, (prev) => ({ ...prev, running: true, error: undefined }));
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
            running: false,
          }));
        })
        .finally(() => {
          if (controllers.current.get(key) === controller) controllers.current.delete(key);
        });
    },
    [update]
  );

  return { runs, run };
};
