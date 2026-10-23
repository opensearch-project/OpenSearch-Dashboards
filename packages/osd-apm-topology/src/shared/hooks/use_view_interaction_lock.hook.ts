/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useMemo, useRef } from 'react';

/**
 * Simple lock mechanism to suppress automatic fitView while a
 * user-initiated centering animation is in progress.
 *
 * @param duration - How long (ms) the lock stays active after `lock()` is called. Default: 500
 */
export const useViewInteractionLock = (duration = 500) => {
  const lockedUntilRef = useRef(0);

  const lock = useCallback(() => {
    lockedUntilRef.current = Date.now() + duration;
  }, [duration]);

  const isLocked = useCallback(() => Date.now() < lockedUntilRef.current, []);

  // Stable identity, so effects depending on the lock do not re-run on every render.
  return useMemo(() => ({ lock, isLocked }), [lock, isLocked]);
};
