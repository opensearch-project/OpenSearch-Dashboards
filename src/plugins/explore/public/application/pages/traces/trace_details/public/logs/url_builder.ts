/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';
import { Dataset } from '../../../../../../../../data/common';
import { LogHit } from '../../server/ppl_request_logs';

export interface TimeRange {
  from: string;
  to: string;
}

export function buildExploreLogsUrl(params: {
  traceId: string;
  spanId?: string;
  logDataset: Dataset;
  timeRange: TimeRange;
}): string {
  const { traceId, spanId, logDataset, timeRange } = params;

  const origin = window.location.origin;
  const pathname = window.location.pathname;

  const basePathMatch = pathname.match(/^(.*?)\/app/);
  const basePath = basePathMatch ? basePathMatch[1] : '';

  let pplQuery = `%7C%20where%20traceId%20%3D%20!'${traceId}!'`;

  if (spanId) {
    pplQuery += `%20%7C%20where%20spanId%20%3D%20!'${spanId}!'`;
  }

  const baseUrl = `${origin}${basePath}/app/explore/logs/#/`;

  const timeFieldName = logDataset.timeFieldName || 'time';

  // Build _q parameter (dataset and query)
  const qParam = `(dataset:(id:'${logDataset.id}',timeFieldName:${timeFieldName},title:'${logDataset.title}',type:INDEX_PATTERN),language:PPL,query:'${pplQuery}')`;

  // Build _a parameter (app state)
  const aParam = `(legacy:(columns:!(_source),interval:auto,isDirty:!f,sort:!()),tab:(logs:(),patterns:(patternsField:'',usingRegexPatterns:!f)),ui:(activeTabId:logs,showHistogram:!t))`;

  // Build _g parameter (global state with time range)
  const gParam = `(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:'${timeRange.from}',to:'${timeRange.to}'))`;

  // Construct the full URL
  return `${baseUrl}?_q=${qParam}&_a=${aParam}&_g=${gParam}`;
}

export function getTimeRangeFromTraceData(traceData: any[]): TimeRange {
  if (!traceData || traceData.length === 0) {
    throw new Error('No trace data available for time range calculation');
  }

  let earliestStart: moment.Moment | null = null;
  let latestEnd: moment.Moment | null = null;

  traceData.forEach((hit) => {
    const startTime = hit.startTime || hit.timestamp;
    const endTime = hit.endTime || hit.timestamp;
    const duration = hit.durationInNanos || hit.duration || 0;

    if (startTime) {
      const start = moment.utc(startTime);

      if (!earliestStart || start.isBefore(earliestStart)) {
        earliestStart = start;
      }

      const end = endTime ? moment.utc(endTime) : start.clone().add(duration, 'microseconds');

      if (!latestEnd || end.isAfter(latestEnd)) {
        latestEnd = end;
      }
    }
  });

  if (!earliestStart || !latestEnd) {
    throw new Error('No valid timestamps found in trace data');
  }

  // Add buffer time (30 minutes on each side)
  const from = moment(earliestStart).subtract(30, 'minutes').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
  const to = moment(latestEnd).add(30, 'minutes').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');

  return { from, to };
}

export function filterLogsBySpanId(logs: LogHit[], spanId: string): LogHit[] {
  return logs.filter((log) => log.spanId === spanId);
}
