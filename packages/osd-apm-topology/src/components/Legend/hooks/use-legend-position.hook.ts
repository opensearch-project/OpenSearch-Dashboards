/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import type { Position } from '../../Portal';

/**
 * Custom hook to calculate and manage the position of a legend element relative to a trigger button
 *
 * @param isOpen - Boolean flag indicating if the legend is open
 * @param trigger - Reference to the HTML button element that triggers the legend
 * @returns Position object with top and right coordinates, or undefined if legend is closed
 */
export const useLegendPosition = (
  isOpen: boolean,
  trigger: HTMLButtonElement | null
): Position | undefined => {
  // State to store the calculated position of the legend
  const [position, setPosition] = useState<Position>();

  useEffect(() => {
    // Only calculate position when legend is open and trigger element exists
    if (isOpen && trigger) {
      // Get the trigger element's position and dimensions
      const rect = trigger.getBoundingClientRect();

      // Update position state with calculated coordinates
      setPosition({
        // Align tops, accounting for scroll position
        top: rect.top + window.scrollY,

        // Align right edge of legend with left edge of button + 5px gap
        right: window.innerWidth - rect.left + 5,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Re-run effect when isOpen changes

  return position;
};
