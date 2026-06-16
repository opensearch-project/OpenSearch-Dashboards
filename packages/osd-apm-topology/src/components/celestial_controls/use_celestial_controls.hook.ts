/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useReactFlow } from '@xyflow/react';
import { useCallback } from 'react';

export interface CelestialControlsActions {
  onZoomIn: (e: React.MouseEvent) => void;
  onZoomOut: (e: React.MouseEvent) => void;
  onFitView: (e: React.MouseEvent) => void;
}

/**
 * Custom hook for managing celestial view controls
 * Provides zoom and fit view functionality for the celestial map
 * @returns Object containing zoom and fit view control functions
 */
export const useCelestialControls = (): CelestialControlsActions => {
  // Extract zoom and fit view controls from ReactFlow
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  /**
   * Handler for zooming in the view
   * @param e Mouse event from zoom button click
   */
  const onZoomIn = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      zoomIn?.({ duration: 300 });
    },
    [zoomIn]
  );

  /**
   * Handler for zooming out the view
   * @param e Mouse event from zoom button click
   */
  const onZoomOut = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      zoomOut?.({ duration: 300 });
    },
    [zoomOut]
  );

  /**
   * Handler for fitting all elements in view
   * @param e Mouse event from fit view button click
   */
  const onFitView = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      fitView?.({ duration: 300 }); // Animate transition over 300ms
    },
    [fitView]
  );

  return {
    onZoomIn,
    onZoomOut,
    onFitView,
  };
};
