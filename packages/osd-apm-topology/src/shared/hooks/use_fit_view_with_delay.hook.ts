/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useRef, useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';

/**
 * Custom hook that provides a function to fit the view with a delay
 * Useful for ensuring smooth transitions when changing views
 *
 * @param delay - Delay in milliseconds before fitting the view (default: 100ms)
 * @param padding - Padding for the fit view operation (default: 0.15)
 * @param duration - Duration of the fit view animation in milliseconds (default: 400ms)
 * @param zoomBounds - Zoom limits for the fit (default: 60% to 100%)
 * @returns Function to trigger the delayed fit view
 */
export const useFitViewWithDelay = (
  delay: number = 100,
  padding: number = 0.15,
  duration: number = 400,
  zoomBounds: { minZoom?: number; maxZoom?: number } = {}
) => {
  const { minZoom = 0.6, maxZoom = 1 } = zoomBounds;
  // Ref to store timeout ID for delayed view fitting
  const timeoutRef = useRef<NodeJS.Timeout>();
  const reactFlowInstance = useReactFlow();

  /**
   * Fits the view to show all nodes with a slight delay
   * Used to ensure smooth transitions when changing views
   */
  const fitViewWithDelay = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (reactFlowInstance?.fitView) {
        // By default we do not auto zoom beyond 100% or below 60%
        reactFlowInstance.fitView({ minZoom, maxZoom, padding, duration });
      }
      // Calls within `delay` replace the pending fit, so a burst (e.g. resize) fits once.
    }, delay);
  }, [reactFlowInstance, delay, padding, duration, minZoom, maxZoom]);

  // Cleanup timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return fitViewWithDelay;
};
