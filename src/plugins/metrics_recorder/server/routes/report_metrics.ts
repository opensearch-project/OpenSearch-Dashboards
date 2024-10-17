/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter, Logger } from 'opensearch-dashboards/server';
import { storeReport, reportSchema } from '../report';
import { MetricsRecorder } from '../types';
import { REPORT_URL } from '../../common/constants';

export function registerMetricRoute(
  router: IRouter,
  getMetricsRecorder: () => MetricsRecorder,
  logger: Logger
) {
  router.post(
    {
      path: REPORT_URL,
      validate: {
        body: schema.object({
          report: reportSchema,
        }),
      },
    },
    async (context, req, res) => {
      const { report } = req.body;
      try {
        if (report) {
          const metricsRecorder = getMetricsRecorder();
          if (!metricsRecorder) {
            throw Error(`The metrics recorder hasn't been initialised yet`);
          }
          await storeReport(metricsRecorder, report, req);
        }

        return res.ok({ body: { status: 'ok' } });
      } catch (error) {
        logger.error(`Failed to store metrics`);
        return res.ok({ body: { status: 'fail' } });
      }
    }
  );
}
