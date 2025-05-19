/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { UiStatsMetricType } from 'packages/osd-analytics/target/types';
import { METRIC_TYPE } from '../../../usage_collection/public';
import { NEW_DISCOVER_APP_NAME } from './constants';
import { getUsageCollector } from '../services';

export const trackUiMetric = (
  eventName: string,
  appName: string = NEW_DISCOVER_APP_NAME,
  metricType: UiStatsMetricType = METRIC_TYPE.COUNT
) => {
  try {
    const usageCollector = getUsageCollector();
    usageCollector.reportUiStats(appName, metricType, eventName);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
};
