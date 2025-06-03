/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { UiStatsMetricType } from 'packages/osd-analytics/target/types';
import { METRIC_TYPE } from '../../../usage_collection/public';
import { DATASET_METRIC_SUFFIX, LANGUAGE_METRIC_SUFFIX, NEW_DISCOVER_APP_NAME } from './constants';
import { getUsageCollector } from '../opensearch_dashboards_services';
import { Query } from '../../../data/public';

export const getDatasetTypeMetricEventName = (datasource: string) => {
  return `${datasource}_${DATASET_METRIC_SUFFIX}`;
};

export const getLanguageMetricEventName = (language: string) => {
  return `${language}_${LANGUAGE_METRIC_SUFFIX}`;
};

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

export const trackQueryMetric = (query: Query) => {
  trackUiMetric(getDatasetTypeMetricEventName(query.dataset?.type!));
  trackUiMetric(getLanguageMetricEventName(query.language));
};
