/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchDashboardsRequest } from 'src/core/server';
import { ReportSchemaType } from './schema';
import { MetricsRecorder, RecordCountOption } from '../types';

export async function storeReport(
  metricsRecorder: MetricsRecorder,
  report: ReportSchemaType,
  req: OpenSearchDashboardsRequest
) {
  const uiStatsMetrics = report.uiStatsMetrics ? Object.entries(report.uiStatsMetrics) : [];
  const timestamp = new Date();
  const metrics: RecordCountOption[] = [];
  uiStatsMetrics.forEach(([key, metric]) => {
    const { appName, eventName, stats } = metric;
    metrics.push({
      appName,
      metricName: eventName,
      count: stats.sum,
      timestamp,
      attributes: {},
    });
  });
  if (metrics.length > 0) {
    metricsRecorder.recordCount(metrics);
  }
}
