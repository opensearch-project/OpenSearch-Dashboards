/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';
import { Dataset } from '../../../../../../../../data/common';
import { extractSpanDuration } from '../utils/span_data_utils';
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
  let datasetParam = `(id:'${logDataset.id}',timeFieldName:${timeFieldName},title:'${logDataset.title}',type:${logDataset.type}`;

  // Include dataSource if present for external data sources
  if (logDataset.dataSource) {
    datasetParam += `,dataSource:(id:'${logDataset.dataSource.id}',title:'${logDataset.dataSource.title}',type:${logDataset.dataSource.type})`;
  }

  datasetParam += ')';

  const qParam = `(dataset:${datasetParam},language:PPL,query:'${pplQuery}')`;

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

  // Unix epoch start (1970-01-01) as minimum valid date
  const epochStart = moment.utc('1970-01-01T00:00:00.000Z');
  // Current time + 1 year as maximum reasonable date
  const maxReasonableDate = moment.utc().add(1, 'year');

  traceData.forEach((hit) => {
    const startTime = hit.startTime || hit.timestamp;
    const endTime = hit.endTime || hit.timestamp;
    const duration = extractSpanDuration(hit);

    if (startTime) {
      const start = moment.utc(startTime);

      if (start.isValid() && start.isAfter(epochStart) && start.isBefore(maxReasonableDate)) {
        if (!earliestStart || start.isBefore(earliestStart)) {
          earliestStart = start;
        }

        // Convert nanoseconds to milliseconds (duration / 1000000)
        const end = endTime
          ? moment.utc(endTime)
          : start.clone().add(duration / 1000000, 'milliseconds');

        if (end.isValid() && end.isAfter(epochStart) && end.isBefore(maxReasonableDate)) {
          if (!latestEnd || end.isAfter(latestEnd)) {
            latestEnd = end;
          }
        }
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
