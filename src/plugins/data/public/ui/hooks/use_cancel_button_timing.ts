/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for managing cancel button visibility with proper timing
 * - Shows cancel button initially on page load if showInitially=true (for initial queries)
 * - Hides button when initial query completes
 * - Shows cancel button after 50ms delay when shouldShow becomes true (prevents flickering for quick queries)
 * - Keeps button visible for minimum 200ms (smooth UX)
 */
export const useCancelButtonTiming = (shouldShow: boolean, showInitially: boolean = true) => {
  const [shouldShowCancelButton, setShouldShowCancelButton] = useState(showInitially);
  const cancelButtonTimerRef = useRef<NodeJS.Timeout | null>(null);
  const minimumDisplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasCompletedInitialQueryRef = useRef(false); // Track if initial query has completed

  useEffect(() => {
    if (shouldShow) {
      // Clear any existing minimum display timer
      if (minimumDisplayTimerRef.current) {
        clearTimeout(minimumDisplayTimerRef.current);
        minimumDisplayTimerRef.current = null;
      }

      // Start timer to show cancel button after 50ms (existing logic)
      cancelButtonTimerRef.current = setTimeout(() => {
        setShouldShowCancelButton(true);
      }, 50);
    } else {
      // Clear the show timer
      if (cancelButtonTimerRef.current) {
        clearTimeout(cancelButtonTimerRef.current);
        cancelButtonTimerRef.current = null;
      }

      // Mark that initial query has completed (if we were showing initially)
      if (showInitially && !hasCompletedInitialQueryRef.current) {
        hasCompletedInitialQueryRef.current = true;
      }

      // If button is currently visible, keep it visible for minimum 200ms
      if (shouldShowCancelButton) {
        minimumDisplayTimerRef.current = setTimeout(() => {
          setShouldShowCancelButton(false);
        }, 200);
      } else {
        setShouldShowCancelButton(false);
      }
    }

    // Cleanup timers on unmount
    return () => {
      if (cancelButtonTimerRef.current) {
        clearTimeout(cancelButtonTimerRef.current);
      }
      if (minimumDisplayTimerRef.current) {
        clearTimeout(minimumDisplayTimerRef.current);
      }
    };
  }, [shouldShow, shouldShowCancelButton, showInitially]);

  return shouldShowCancelButton;
};
