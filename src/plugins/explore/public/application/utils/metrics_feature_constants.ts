/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const METRICS_ALERTING_APP_ID = 'monitors';
export const METRICS_ANOMALY_DETECTION_APP_ID = 'anomaly-detection-dashboards';

export const PROMETHEUS_DETECTOR_MODES = {
  singleStream: 'single_stream',
  highCardinality: 'high_cardinality',
} as const;

export type PrometheusDetectorMode = typeof PROMETHEUS_DETECTOR_MODES[keyof typeof PROMETHEUS_DETECTOR_MODES];

export const MAX_AUTO_PREVIEW_SERIES = 3;
