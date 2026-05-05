/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext, useCallback, useEffect, useState } from 'react';

interface CursorState {
  idx: number;
  yRatio: number; // 0–1, relative Y position within the plot area
}

interface CursorContextValue {
  subscribe: (cb: (state: CursorState | null) => void) => () => void;
  publish: (state: CursorState | null) => void;
}

export const CursorContext = createContext<CursorContextValue | null>(null);

/** Creates a CursorContextValue (call once per provider). */
export function createCursorBus(): CursorContextValue {
  const listeners = new Set<(state: CursorState | null) => void>();
  return {
    subscribe(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    publish(state) {
      listeners.forEach((cb) => cb(state));
    },
  };
}

/** Returns the raw bus so callers can subscribe without triggering React re-renders. */
export function useCursorBus(): CursorContextValue | null {
  return useContext(CursorContext);
}

/** Hook that subscribes to the shared cursor and returns the current state. */
export function useSharedCursor(): [CursorState | null, (state: CursorState | null) => void] {
  const bus = useContext(CursorContext);
  const [state, setState] = useState<CursorState | null>(null);

  useEffect(() => {
    if (!bus) return;
    return bus.subscribe(setState);
  }, [bus]);

  const publish = useCallback(
    (s: CursorState | null) => {
      bus?.publish(s);
    },
    [bus]
  );

  return [state, publish];
}
