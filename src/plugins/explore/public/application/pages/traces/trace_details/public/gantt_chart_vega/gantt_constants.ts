/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shared constants for Gantt chart components
 * These values are used across both the Vega specification and React component
 * to ensure consistent sizing and layout calculations.
 */

export const GANTT_CHART_CONSTANTS = {
  PADDING: 20,
  BUFFER_PADDING: 10,

  MIN_ROW_HEIGHT: 30,
  BASE_CALCULATION_HEIGHT: 40,

  MIN_HEIGHT: 150,
  MAX_HEIGHT: 600,
  MIN_WIDTH: 400,
  MIN_CONTAINER_HEIGHT: 120,

  EMPTY_STATE_HEIGHT: 150,
  SINGLE_SPAN_HEIGHT: 120,

  // Default fallback width for span detail panel when container width cannot be determined
  DEFAULT_AVAILABLE_WIDTH: 800,

  // Text truncation settings for service names and operation names
  TEXT_TRUNCATE_THRESHOLD: 30, // Minimum length before truncation
  TEXT_TRUNCATE_HEAD_LENGTH: 8, // Characters to keep from the beginning
  TEXT_TRUNCATE_TAIL_LENGTH: 18, // Characters to keep from the end
} as const;

// Top padding + Bottom padding + Buffer padding
export const TOTAL_PADDING =
  GANTT_CHART_CONSTANTS.PADDING +
  GANTT_CHART_CONSTANTS.PADDING +
  GANTT_CHART_CONSTANTS.BUFFER_PADDING;

/**
 * Calculate left padding based on container width
 * Uses responsive sizing to ensure labels have adequate space
 */
export const calculateTextPadding = (containerWidth: number): number => {
  return Math.max(120, Math.min(180, containerWidth * 0.12));
};
