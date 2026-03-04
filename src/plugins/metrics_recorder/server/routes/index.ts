/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { IRouter, Logger, MetricsServiceSetup, ServiceStatus } from 'opensearch-dashboards/server';
import { Observable } from 'rxjs';
import { registerMetricRoute } from './report_metrics';
import { MetricsRecorder } from '../types';

export function setupRoutes({
  router,
  logger,
  getMetricsRecorder,
  ...rest
}: {
  router: IRouter;
  logger: Logger;
  getMetricsRecorder: () => MetricsRecorder;
  config: {
    allowAnonymous: boolean;
    opensearchDashboardsIndex: string;
    opensearchDashboardsVersion: string;
    uuid: string;
    server: {
      name: string;
      hostname: string;
      port: number;
    };
    batchingInterval: number;
  };
  metrics: MetricsServiceSetup;
  overallStatus$: Observable<ServiceStatus>;
}) {
  registerMetricRoute(router, getMetricsRecorder, logger);
}
