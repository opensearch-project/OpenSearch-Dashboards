/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { GOLDEN_RATIO, INVERSE_GOLDEN_RATIO } from '../../../../shared/constants/visual.constants';

// Constants
const TWO_PI = 2 * Math.PI; // Full circle in radians
const BASE_SEGMENT_STROKE = 5; // Default stroke width for segments in pixels
const MIN_DIAMETER = 40; // Minimum circle diameter in pixels
const MIN_BACKGROUND_STROKE = 1; // Minimum background stroke width in pixels
const SCALING_FACTOR = 0.1; // Factor used to scale stroke width with circle size

// Types
interface StrokeWidths {
  background: number;
  segment: number;
}

export interface CircleDimensions {
  backgroundStrokeWidth: number;
  segmentStrokeWidth: number;
  radius: number;
  circumference: number;
  center: number;
  getArcLength: (percentage: number) => number;
}

/**
 * Calculates stroke widths based on circle size
 * For small circles (size <= MIN_DIAMETER), returns fixed minimum values
 * For larger circles, scales the stroke widths proportionally:
 * - background stroke scales with circle size divided by minimum size and golden ratio
 * - segment stroke increases linearly with size difference, adjusted by inverse golden ratio
 *
 * @param size - The size of the circle in pixels
 * @returns StrokeWidths object with background and segment stroke widths
 */
const calculateStrokeWidths = (diameter: number): StrokeWidths => {
  // For small circles, use minimum fixed values
  if (diameter <= MIN_DIAMETER) {
    return {
      background: MIN_BACKGROUND_STROKE,
      segment: BASE_SEGMENT_STROKE,
    };
  }

  // For larger circles, calculate scaled stroke widths
  return {
    // Scale background stroke with size, but never smaller than minimum
    background: Math.max(MIN_BACKGROUND_STROKE, diameter / (MIN_DIAMETER * GOLDEN_RATIO)),
    // Scale segment stroke linearly with diameter difference from minimum
    segment: Math.max(
      BASE_SEGMENT_STROKE,
      BASE_SEGMENT_STROKE + (diameter - MIN_DIAMETER) * INVERSE_GOLDEN_RATIO * SCALING_FACTOR
    ),
  };
};

/**
 * Calculates basic circle geometry
 *
 * @param diameter - The diameter of the circle
 * @param segmentStroke - The stroke width of segments
 * @returns Object containing radius, circumference, and center
 */
const calculateGeometry = (diameter: number, segmentStroke: number) => {
  const radius = (diameter - segmentStroke) / 2;
  return {
    radius,
    circumference: TWO_PI * radius,
    center: diameter / 2,
  };
};

/**
 * Custom hook that calculates dimensions and properties for a circular metric display
 *
 * @param diameter - The desired diameter of the circle in pixels
 * @returns CircleDimensions object containing all necessary circle properties and methods
 */
export const useCircleDimensions = (diameter: number): CircleDimensions =>
  useMemo(() => {
    const strokeWidths = calculateStrokeWidths(diameter);
    const geometry = calculateGeometry(diameter, strokeWidths.segment);

    return {
      ...geometry,
      backgroundStrokeWidth: strokeWidths.background,
      segmentStrokeWidth: strokeWidths.segment,
      getArcLength: (percentage: number) => (percentage / 100) * geometry.circumference,
    };
  }, [diameter]);
