/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';

export interface Tick {
  value: number;
  offsetPercent: number;
}

/**
 * Generates timeline tick marks with "nice" values and positions.
 * Takes a min/max range and desired tick count, then calculates evenly-spaced
 * ticks with human-readable values (1, 2, 5, 10, etc.) and their percentage
 * positions within the container, accounting for padding.
 */
export const useTimelineTicks = (
  max: number,
  min: number,
  desiredTickCount: number,
  containerPadding: number = 0
): Tick[] => {
  return useMemo(() => {
    const range = max - min;
    if (range <= 0 || desiredTickCount < 2) return [];

    // Step 1: Calculate a "nice" step size
    const roughStep = range / (desiredTickCount - 1);
    const stepMagnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const normalizedStep = roughStep / stepMagnitude;

    // Choose nice step values: 1, 2, 5, or 10 (times the magnitude)
    let niceStepMultiplier;
    if (normalizedStep <= 1) niceStepMultiplier = 1;
    else if (normalizedStep <= 2) niceStepMultiplier = 2;
    else if (normalizedStep <= 5) niceStepMultiplier = 5;
    else niceStepMultiplier = 10;

    const niceStep = niceStepMultiplier * stepMagnitude;

    // Step 2: Generate tick values using the nice step
    const ticks: Tick[] = [];
    const availableWidth = 100 - containerPadding * 2;

    // Start from the first nice value >= min
    const firstTick = Math.ceil(min / niceStep) * niceStep;

    for (let tickValue = firstTick; tickValue <= max; tickValue += niceStep) {
      const value = Math.round(tickValue * 100) / 100;

      // Calculate position as percentage of the original range
      const positionInRange = (value - min) / range;
      const offsetPercent = Math.round(containerPadding + positionInRange * availableWidth);

      ticks.push({ value, offsetPercent });
    }

    return ticks;
  }, [max, min, containerPadding, desiredTickCount]);
};
