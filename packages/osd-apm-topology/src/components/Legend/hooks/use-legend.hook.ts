/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useRef, useState } from 'react';
import { useLegendPosition } from './use-legend-position.hook';
import type { Position } from '../../Portal';

/**
 * Interface representing the state and handlers for the legend component
 */
export interface LegendState {
  /** Reference to the legend button element */
  ref: React.RefObject<HTMLButtonElement>;
  /** Whether the legend is currently open */
  isOpen: boolean;
  /** Position coordinates for the legend */
  position?: Position;
  /** Handler to close the legend */
  onClose: () => void;
  /** Handler to toggle the legend open/closed state */
  onToggle: (e: React.MouseEvent) => void;
}

/**
 * Hook that manages legend state and positioning
 * @returns {LegendState} Object containing legend state and handlers
 */
export const useLegend = (): LegendState => {
  // Initialize ref with null to match React.RefObject type
  const ref = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Get calculated position based relative to legend button position
  const position = useLegendPosition(isOpen, ref.current);

  // Toggles the legend open/closed state
  const onToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsOpen(!isOpen);
    },
    [isOpen, setIsOpen]
  );

  // Closes the legend
  const onClose = useCallback(() => setIsOpen(false), [setIsOpen]);

  return {
    ref,
    isOpen,
    position,
    onClose,
    onToggle,
  };
};
