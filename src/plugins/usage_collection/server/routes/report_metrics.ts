/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { schema } from '@osd/config-schema';
import { IRouter, ISavedObjectsRepository } from 'opensearch-dashboards/server';
import { storeReport, reportSchema } from '../report';
import { BatchReport } from '../types';
import { ReportSchemaType } from '../report/schema';

export function registerUiMetricRoute(
  router: IRouter,
  getSavedObjects: () => ISavedObjectsRepository | undefined,
  batchingInterval: number
) {
  let batchReport = { report: {}, startTimestamp: 0 } as BatchReport;
  const batchingIntervalInMs = batchingInterval * 1000;
  router.post(
    {
      path: '/api/ui_metric/report',
      validate: {
        body: schema.object({
          report: reportSchema,
        }),
      },
    },
    async (context, req, res) => {
      const { report } = req.body;
      try {
        const currTime = Date.now();

        // Add the current report to batchReport
        batchReport.report = combineReports(report, batchReport.report);
        // If the time duration since the batchReport startTime is greater than batchInterval then write it to the savedObject
        if (currTime - batchReport.startTimestamp >= batchingIntervalInMs) {
          const prevReport = batchReport;

          batchReport = {
            report: {},
            startTimestamp: currTime,
          }; // reseting the batchReport and updating the startTimestamp to current TimeStamp

          if (prevReport) {
            // Write the previously batched Report to the saved object
            const internalRepository = getSavedObjects();
            if (!internalRepository) {
              throw Error(`The saved objects client hasn't been initialised yet`);
            }
            await storeReport(internalRepository, prevReport.report);
          }
        }

        return res.ok({ body: { status: 'ok' } });
      } catch (error) {
        return res.ok({ body: { status: 'fail' } });
      }
    }
  );
}

function combineReports(report1: ReportSchemaType, report2: ReportSchemaType) {
  // Combines report2 onto the report1 and returns the updated report1

  // Combining User Agents
  const combinedUserAgent = { ...report2.userAgent, ...report1.userAgent };

  // Combining UI metrics
  const combinedUIMetric = { ...report1.uiStatsMetrics };
  if (report2.uiStatsMetrics !== undefined) {
    for (const key of Object.keys(report2.uiStatsMetrics)) {
      if (report2.uiStatsMetrics[key]?.stats?.sum === undefined) {
        continue;
      } else if (report1.uiStatsMetrics?.[key] === undefined) {
        combinedUIMetric[key] = report2.uiStatsMetrics[key];
      } else {
        const { stats, ...rest } = combinedUIMetric[key];
        const combinedStats = { ...stats };
        combinedStats.sum += report2.uiStatsMetrics[key].stats.sum; // Updating the sum since it is field we will be using to update the saved Object
        combinedUIMetric[key] = { ...rest, stats: combinedStats };
      }
    }
  }

  // Combining Application Usage
  const combinedApplicationUsage = { ...report1.application_usage };
  if (report2.application_usage !== undefined) {
    for (const key of Object.keys(report2.application_usage)) {
      if (
        report2.application_usage[key]?.numberOfClicks === undefined ||
        report2.application_usage[key]?.minutesOnScreen === undefined
      ) {
        continue;
      } else if (report1.application_usage?.[key] === undefined) {
        combinedApplicationUsage[key] = report2.application_usage[key];
      } else {
        const combinedUsage = { ...combinedApplicationUsage[key] };
        combinedUsage.numberOfClicks += report2.application_usage[key]?.numberOfClicks || 0;
        combinedUsage.minutesOnScreen += report2.application_usage[key]?.minutesOnScreen || 0;
        combinedApplicationUsage[key] = combinedUsage;
      }
    }
  }

  return {
    reportVersion: report1.reportVersion,
    userAgent: combinedUserAgent,
    uiStatsMetrics: combinedUIMetric,
    application_usage: combinedApplicationUsage,
  } as ReportSchemaType;
}
