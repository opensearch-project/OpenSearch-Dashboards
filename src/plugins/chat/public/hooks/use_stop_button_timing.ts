/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to manage the timing of showing/hiding the stop button
 * to prevent UI flicker for quick operations.
 *
 * The stop button will:
 * - Show after 50ms when streaming starts (prevents flicker for quick responses)
 * - Stay visible for minimum 200ms after streaming stops (smooth UX)
 *
 * Based on the pattern from explore plugin's useCancelButtonTiming.
 *
 * @param isStreaming - Whether agent execution is currently streaming
 * @returns shouldShowStopButton - Whether the stop button should be visible
 */
export const useStopButtonTiming = (isStreaming: boolean): boolean => {
  const [shouldShowStopButton, setShouldShowStopButton] = useState(false);
  const showTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isStreaming) {
      // Clear any pending hide timer
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }

      // Show button after 50ms delay (prevents flicker for quick operations)
      showTimerRef.current = setTimeout(() => {
        setShouldShowStopButton(true);
      }, 50);
    } else {
      // Clear show timer
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }

      // If button is visible, keep it visible for minimum 200ms for smooth UX
      if (shouldShowStopButton) {
        hideTimerRef.current = setTimeout(() => {
          setShouldShowStopButton(false);
        }, 200);
      } else {
        setShouldShowStopButton(false);
      }
    }

    // Cleanup timers on unmount or when effect re-runs
    return () => {
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
      }
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [isStreaming, shouldShowStopButton]);

  return shouldShowStopButton;
};
