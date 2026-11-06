/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/** Shown for a count the node has no metrics for (not loaded, or failed): unknown, not 0. */
export const MISSING_COUNT = '-';

/** A node's request count, or MISSING_COUNT when the node has no metrics at all. */
export const formatRequestCount = (metrics?: { requests?: number }): string =>
  metrics ? formatCount(metrics.requests) : MISSING_COUNT;

export const formatCount = (value: number | undefined): string => {
  if (value === undefined || isNaN(value) || !isFinite(value)) return '0';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return `${value}`;
};
