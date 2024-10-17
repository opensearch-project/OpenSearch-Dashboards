/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';
import { METRIC_TYPE } from '@osd/analytics';

export const reportSchema = schema.object({
  reportVersion: schema.maybe(schema.literal(1)),
  userAgent: schema.maybe(
    schema.recordOf(
      schema.string(),
      schema.object({
        key: schema.string(),
        type: schema.string(),
        appName: schema.string(),
        userAgent: schema.string(),
      })
    )
  ),
  uiStatsMetrics: schema.maybe(
    schema.recordOf(
      schema.string(),
      schema.object({
        key: schema.string(),
        type: schema.oneOf([
          schema.literal<METRIC_TYPE>(METRIC_TYPE.CLICK),
          schema.literal<METRIC_TYPE>(METRIC_TYPE.LOADED),
          schema.literal<METRIC_TYPE>(METRIC_TYPE.COUNT),
        ]),
        appName: schema.string(),
        eventName: schema.string(),
        stats: schema.object({
          min: schema.number(),
          sum: schema.number(),
          max: schema.number(),
          avg: schema.number(),
        }),
      })
    )
  ),
  application_usage: schema.maybe(
    schema.recordOf(
      schema.string(),
      schema.object({
        minutesOnScreen: schema.number(),
        numberOfClicks: schema.number(),
      })
    )
  ),
});

export type ReportSchemaType = TypeOf<typeof reportSchema>;
