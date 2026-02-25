/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { useCelestialStateContext } from '../contexts/celestial_state_context';
import type { Breadcrumb } from '../../components/breadcrumb_trail/types';
import type { CelestialCardProps } from '../../components/celestial_card/types';
import type { CelestialEdge } from '../../types';

/**
 * Interface defining the props required for the celestial map actions
 */
interface CelestialMapActionsProps {
  /** Optional callback for fetching data with key attributes */
  onDataFetch?: (node?: CelestialCardProps) => void;
  /** Function to navigate to a specific breadcrumb by index */
  navigateToBreadcrumb: (index: number) => void;
  /** Function for when an edge in the map is clicked */
  onEdgeClick?: (edge: CelestialEdge) => void;
  /** Optional callback for when a breadcrumb is clicked */
  onBreadcrumbClick?: (breadcrumb: Breadcrumb, index: number) => void;
}

/**
 * Custom hook that provides actions for the celestial map component
 * @param props - The props object containing required callbacks and state
 * @returns Object containing callback functions for breadcrumb clicks, context menu closing, and edge clicks
 */
export const useCelestialMapActions = ({
  onDataFetch,
  navigateToBreadcrumb,
  onEdgeClick,
  onBreadcrumbClick: propOnBreadcrumbClick,
}: CelestialMapActionsProps) => {
  const { setSelectedNodeId } = useCelestialStateContext();
  /**
   * Handles clicks on breadcrumb items
   */
  const onBreadcrumbClick = useCallback(
    (breadcrumb: Breadcrumb, index: number) => {
      // Use prop handler if provided, otherwise use default behavior
      if (propOnBreadcrumbClick) {
        propOnBreadcrumbClick(breadcrumb, index);
      } else {
        onDataFetch?.(breadcrumb.node);
        navigateToBreadcrumb(index);
      }
    },
    [onDataFetch, navigateToBreadcrumb, propOnBreadcrumbClick]
  );

  /**
   * Handles clicks on edges
   */
  const handleEdgeClick = useCallback(
    (_event: any, edge: CelestialEdge) => {
      onEdgeClick?.(edge);
      setSelectedNodeId?.(undefined);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onEdgeClick]
  );

  return {
    onBreadcrumbClick,
    onEdgeClick: handleEdgeClick,
  };
};
