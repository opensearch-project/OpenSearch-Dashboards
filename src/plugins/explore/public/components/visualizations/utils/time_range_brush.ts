/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getColors } from '../theme/default_colors';

const TIME_RANGE_BRUSH_NAME = 'timeRangeBrush';

export const createTimeRangeBrush = (options: { timeAxis: 'x' | 'y' }) => {
  const colors = getColors();
  return {
    name: TIME_RANGE_BRUSH_NAME,
    select: {
      type: 'interval',
      encodings: [options.timeAxis],
      mark: { fill: colors.text, strokeOpacity: 0 },
    },
  };
};

export const createTimeRangeUpdater = () => {
  return {
    name: 'applyTimeFilter',
    value: null,
    on: [
      {
        events: 'pointerup',
        update: `${TIME_RANGE_BRUSH_NAME} ? opensearchDashboardsSelectTimeRange(${TIME_RANGE_BRUSH_NAME}) : null`,
      },
    ],
  };
};
