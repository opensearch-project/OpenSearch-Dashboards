/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, useCallback } from 'react';

interface UseDelayedHoverOptions {
  delay?: number;
}

/**
 * Custom hook for handling delayed hover interactions
 * Provides functionality to show/hide elements with a delay when hovering
 *
 * @param {Object} options - Configuration options for the hook
 * @param {number} [options.delay=500] - Delay in milliseconds before hiding element on mouse leave
 * @returns {Object} Object containing show state and mouse event handlers
 */
export const useDelayedHover = ({ delay = 500 }: UseDelayedHoverOptions = {}) => {
  // Track visibility state of the element
  const [showElement, setShowElement] = useState(false);
  // Reference to timeout for delayed hiding
  const timeoutRef = useRef<NodeJS.Timeout>();

  /**
   * Clears any existing timeout to prevent unwanted state updates
   */
  const clearHoverTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  /**
   * Handler for mouse enter events
   * Immediately shows the element and clears any pending hide timeouts
   */
  const onMouseEnter = useCallback(() => {
    clearHoverTimeout();
    setShowElement(true);
  }, [clearHoverTimeout]);

  /**
   * Handler for mouse leave events
   * Sets a timeout to hide the element after the specified delay
   */
  const onMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setShowElement(false);
    }, delay);
  }, [delay]);

  // Clean up timeout on component unmount to prevent memory leaks
  useEffect(() => () => clearHoverTimeout(), [clearHoverTimeout]);

  return {
    showElement,
    onMouseEnter,
    onMouseLeave,
  };
};
