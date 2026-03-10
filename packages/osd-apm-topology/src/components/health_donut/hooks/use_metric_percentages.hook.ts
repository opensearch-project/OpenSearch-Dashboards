/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import type { Metrics } from '../../../shared/types/common.types';
import type { MetricPercentages } from '../types';

/**
 * Calculates percentage of a value relative to a total
 *
 * @param value - The value to calculate percentage for
 * @param total - The total value to calculate percentage against
 * @returns The calculated percentage, or 0 if total is invalid
 */
const getPercentage = (value: number, total: number) => {
  if (!total) return 0;

  return (value / total) * 100;
};

/**
 * Custom hook that calculates percentage metrics for different types of errors
 * relative to total requests.
 *
 * @param metrics - Object containing raw metric values including total requests
 *                 and counts for different error types
 * @returns Object containing calculated percentages for 5xx errors, 4xx errors
 *          and throttled requests
 */
export const useMetricPercentages = (metrics: Metrics): MetricPercentages => {
  return useMemo(() => {
    // Destructure required metrics
    const { requests, faults5xx, errors4xx } = metrics;

    // Calculate percentages for each metric
    const faults5xxPercent = getPercentage(faults5xx, requests);
    const errors4xxPercent = getPercentage(errors4xx, requests);
    const ok2xxPercent = metrics.requests ? 100 - (faults5xxPercent + errors4xxPercent) : 0;

    return {
      ok2xxPercent,
      faults5xxPercent,
      errors4xxPercent,
    };
  }, [metrics]);
};
