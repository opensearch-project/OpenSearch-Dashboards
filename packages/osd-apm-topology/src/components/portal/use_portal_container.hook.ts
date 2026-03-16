/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import type { Position } from './types';

/**
 * Custom hook to manage a portal container element
 *
 * @param position The position where the portal should be rendered
 * @param containerElement Optional container element to use (creates one if not provided)
 * @returns The container element reference
 */
export const usePortalContainer = (
  position: Position,
  containerElement?: HTMLDivElement
): HTMLDivElement => {
  // Use provided element or create a new one
  const containerRef = useRef<HTMLDivElement>(containerElement || document.createElement('div'));

  useEffect(() => {
    const el = containerRef.current;
    // Set the positioning styles for the portal container
    const styles = {
      zIndex: '9999', // Ensure portal appears above other content
      position: 'absolute', // Position absolutely relative to closest positioned ancestor
      ...(position.top !== undefined ? { top: `${position.top}px` } : {}),
      ...(position.left !== undefined ? { left: `${position.left}px` } : {}),
      ...(position.right !== undefined ? { right: `${position.right}px` } : {}),
      ...(position.bottom !== undefined ? { bottom: `${position.bottom}px` } : {}),
    };

    // Apply styles to the container element
    Object.assign(el.style, styles);

    // Only append to body if not already attached
    if (!document.body.contains(el)) {
      document.body.appendChild(el);
    }

    // Cleanup function to remove container when component unmounts
    return () => {
      if (document.body.contains(el)) {
        document.body.removeChild(el);
      }
    };
  }, [position]); // Re-run effect when position changes

  return containerRef.current;
};
