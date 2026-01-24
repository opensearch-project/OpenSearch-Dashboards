/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReportSchemaType } from './report/schema';
export interface BatchReport {
  report: ReportSchemaType;
  startTimestamp: number;
}

export interface MetricsRecorder {
  recordCount: (options: RecordCountOption[]) => void;
}

export type MetricsRecorderFactory = () => MetricsRecorder;

export interface RecordCountOption {
  // the category metric belongs to
  appName: string;
  // name of the metric
  metricName: string;
  // value of reported metric
  count: number;
  // timestamp when metric is reported, if not set, current time should be used.
  timestamp: Date;
  // additional attributes useful for metric reporting
  attributes?: Record<string, string | number | boolean>;
}
