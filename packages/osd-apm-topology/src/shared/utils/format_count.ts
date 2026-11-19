/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/** Shown for a count the node has no metrics for (not loaded, or failed): unknown, not 0. */
export const MISSING_COUNT = '-';

/** Whether a node has metrics to show: a request count (0 included). */
export const hasRequestMetrics = (metrics?: { requests?: number }): boolean =>
  typeof metrics?.requests === 'number' && Number.isFinite(metrics.requests);

/** A node's request count, or MISSING_COUNT when the node has none (no metrics, or no count). */
export const formatRequestCount = (metrics?: { requests?: number }): string =>
  hasRequestMetrics(metrics) ? formatCount(metrics?.requests) : MISSING_COUNT;

export const formatCount = (value: number | undefined): string => {
  if (value === undefined || isNaN(value) || !isFinite(value)) return '0';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return `${value}`;
};
