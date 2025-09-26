/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getColors } from '../theme/default_colors';

export const createTimeRangeBrush = (options: { timeAxis: 'x' | 'y' }) => {
  const colors = getColors();
  return {
    name: 'timeRangeBrush',
    select: {
      type: 'interval',
      encodings: [options.timeAxis],
      mark: { fill: colors.text, strokeOpacity: 0 },
    },
  };
};

export const createTimeRangeUpdater = (options: { dateField: string; timeAxis: 'x' | 'y' }) => {
  return {
    name: 'applyTimeFilter',
    value: null,
    on: [
      {
        events: 'pointerup',
        update: `timeRangeBrush ? opensearchDashboardsSelectTimeRange(timeRangeBrush) : null`,
      },
    ],
  };
};
