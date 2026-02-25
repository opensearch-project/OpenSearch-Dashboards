/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { HEALTH_DONUT_COLORS, HEALTH_DONUT_STATUS } from '../constants';

export interface HealthStatusColors {
  fill: string; // Fill color for the health status
  stroke: string; // Stroke color for the health status
}

/**
 * Custom hook that returns fill and stroke colors based on health status
 *
 * @param status - The health status string to determine colors
 * @returns HealthStatusColors object containing fill and stroke colors
 */
export const useHealthStatusColors = (status?: string): HealthStatusColors =>
  useMemo(() => {
    switch (status) {
      // Return fault colors when status is FAULT
      case HEALTH_DONUT_STATUS.FAULT:
        return { fill: HEALTH_DONUT_COLORS.faultFill, stroke: HEALTH_DONUT_COLORS.faultFill };
      // Return error colors when status is ERROR
      case HEALTH_DONUT_STATUS.ERROR:
        return { fill: HEALTH_DONUT_COLORS.errorFill, stroke: HEALTH_DONUT_COLORS.errorFill };
      // Return default colors for any other status
      default:
        return { fill: HEALTH_DONUT_COLORS.white, stroke: HEALTH_DONUT_COLORS.background };
    }
  }, [status]); // Memoize based on status changes
