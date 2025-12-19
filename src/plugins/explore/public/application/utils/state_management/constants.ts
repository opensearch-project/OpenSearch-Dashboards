/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EditorMode } from './types';

export const DEFAULT_EDITOR_MODE = EditorMode.Query;

/**
 * Target bucket count for Traces charts
 * Uses ~15 buckets for 3 charts vs default 50 for Logs (1 chart)
 * Lower target pushes TimeBuckets to choose larger intervals (e.g., 2d instead of 1d)
 */
export const TRACES_CHART_BAR_TARGET = 15;

/**
 * Calculates the appropriate histogram interval based on the time range in days.
 * This function ensures consistent bucketing across all trace charts (Request Count, Error Count, Latency).
 *
 * TimeBuckets doesn't reliably honor custom bar targets for larger time ranges,
 * so we bypass it and calculate intervals manually to maintain ~15-25 buckets.
 *
 * @param diffDays - Number of days in the time range
 * @returns Interval string (e.g., '2w', '1d', '12h') or undefined to let TimeBuckets decide
 */
export function calculateTraceInterval(diffDays: number): string | undefined {
  if (diffDays >= 730) {
    return '60d'; // 730+ days (2+ years): 2 months = ~12-24 buckets
  } else if (diffDays >= 365) {
    return '30d'; // 365-730 days (1-2 years): 1 month = ~12-24 buckets
  } else if (diffDays >= 200) {
    return '2w'; // 200-365 days (6.5-12 months): 2 weeks = ~14-26 buckets
  } else if (diffDays >= 100) {
    return '1w'; // 100-200 days (3-6.5 months): 1 week = ~14-28 buckets
  } else if (diffDays >= 60) {
    return '4d'; // 60-100 days (2-3 months): 4 days = ~15-25 buckets
  } else if (diffDays >= 30) {
    return '2d'; // 30-60 days (1-2 months): 2 days = ~15-30 buckets
  } else if (diffDays >= 14) {
    return '1d'; // 14-30 days (2-4 weeks): 1 day = ~14-30 buckets
  } else if (diffDays >= 7) {
    return '12h'; // 7-14 days (1-2 weeks): 12 hours = ~14-28 buckets
  }
  // For < 7 days, return undefined to let TimeBuckets calculate automatically
  return undefined;
}
