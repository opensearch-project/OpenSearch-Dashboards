/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { INVERSE_GOLDEN_RATIO } from '../../../shared/constants/visual.constants';

export const MIN_ICON_SIZE = 13; // Minimum allowed size for center icon
export const MIN_SLI_STATUS_ICON_SIZE = 12; // Minimum allowed size for sli indicator icon

/**
 * Custom hook for calculating icon sizes based on a given base size
 * Uses the inverse golden ratio and scaling factors to maintain visual harmony
 *
 * @param size - The base size value to calculate icon dimensions from
 * @returns Object containing calculated sizes for center and sli indicator icon
 */
export const useIconSizing = (size: number) => {
  const scaleFactor = size * INVERSE_GOLDEN_RATIO;
  const baseSize = scaleFactor * INVERSE_GOLDEN_RATIO;

  return {
    centerIconSize: Math.max(MIN_ICON_SIZE, baseSize),
    sliStatusIconSize: Math.max(MIN_SLI_STATUS_ICON_SIZE, baseSize),
  };
};
