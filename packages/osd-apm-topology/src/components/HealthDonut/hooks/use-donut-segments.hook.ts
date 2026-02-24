/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { t } from '../../../shared/i18n/t';
import type { Metrics } from '../../../shared/types/common.types';
import { HEALTH_DONUT_COLORS } from '../constants';
import type { Segment } from '../../Donut/types';
import { useMetricPercentages } from './use-metric-percentages.hook';

/**
 * Hook that generates donut chart segments from metrics data
 *
 * @param metrics - Object containing request metrics (total, errors, throttled)
 * @returns Array of donut chart segments with percentages, colors and labels
 */
export const useDonutSegments = (metrics: Metrics): Segment[] => {
  const { faults5xxPercent, errors4xxPercent, ok2xxPercent } = useMetricPercentages(metrics);

  return useMemo(
    // Return array of segment objects for donut chart
    () => [
      {
        percent: faults5xxPercent,
        color: faults5xxPercent ? HEALTH_DONUT_COLORS.fault5xx : 'transparent',
        label: t(`healthDonut.legend.faults`, { value: faults5xxPercent.toFixed(1) }),
        offset: 0, // First segment starts at 0
      },
      {
        percent: errors4xxPercent,
        color: errors4xxPercent ? HEALTH_DONUT_COLORS.error4xx : 'transparent',
        label: t(`healthDonut.legend.errors`, { value: errors4xxPercent.toFixed(1) }),
        offset: faults5xxPercent, // Offset by previous segment
      },
      {
        percent: ok2xxPercent,
        color: ok2xxPercent ? HEALTH_DONUT_COLORS.ok2xx : 'transparent',
        label: t(`healthDonut.legend.ok`, { value: ok2xxPercent.toFixed(1) }),
        offset: faults5xxPercent + errors4xxPercent, // Offset by sum of previous segments
      },
    ],
    [faults5xxPercent, errors4xxPercent, ok2xxPercent]
  );
};
