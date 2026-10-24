/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataPublicPluginStart } from '../../../../../../../data/public';
import { Dataset } from '../../../../../../../data/common';
import { PPLService, escapePPLValue } from './ppl_request_helpers';

export interface PPLLogsQueryParams {
  traceId: string;
  dataset: Dataset;
  limit?: number;
  /** Only this span's logs. */
  spanId?: string;
}

export interface LogHit {
  _id: string;
  _source: Record<string, any>;
  timestamp: string;
  traceId: string;
  spanId?: string;
  message?: string;
  level?: string;
}

export async function fetchTraceLogsByTraceId(
  dataService: DataPublicPluginStart,
  params: PPLLogsQueryParams
): Promise<any> {
  const { traceId, dataset, limit = 1000, spanId } = params;

  if (!traceId || !dataset) {
    throw new Error('Missing required parameters: traceId and dataset');
  }

  try {
    const pplService = new PPLService(dataService);
    const traceIdFieldName = dataset.schemaMappings?.otelLogs?.traceId || 'traceId';
    // Newest first, so a trace with more logs than `limit` keeps its most recent ones.
    const timeField = dataset.schemaMappings?.otelLogs?.timestamp || dataset.timeFieldName;
    const sortClause = timeField ? ` | sort - \`${timeField}\`` : '';
    const spanIdFieldName = dataset.schemaMappings?.otelLogs?.spanId || 'spanId';
    // Escaped: trace and span ids come from documents and URLs.
    const spanClause = spanId ? ` and ${spanIdFieldName} = ${escapePPLValue(spanId)}` : '';
    const pplQuery = `source = ${dataset.title} | where ${traceIdFieldName} = ${escapePPLValue(
      traceId
    )}${spanClause}${sortClause} | head ${limit}`;

    const datasetWithoutTime = {
      id: dataset.id,
      title: dataset.title,
      type: dataset.type,
      // Include dataSource if present to support external data sources
      ...(dataset.dataSource && { dataSource: dataset.dataSource }),
      // Omit timeFieldName to prevent automatic time filtering
    };

    return await pplService.executeQuery(datasetWithoutTime, pplQuery);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('PPL Logs Query Error:', error);
    throw error;
  }
}

export function transformLogsResponseToHits(response: any): LogHit[] {
  if (!response?.body?.fields) {
    return [];
  }

  const fields = response.body.fields;
  const size = response.body.size || 0;

  if (size === 0 || fields.length === 0) {
    return [];
  }

  const hits: LogHit[] = [];

  for (let i = 0; i < size; i++) {
    const logData: any = {};

    fields.forEach((field: any) => {
      logData[field.name] = field.values[i];
    });

    const hit: LogHit = {
      _id: `log-${i}`,
      _source: logData,
      timestamp: logData.time || logData['@timestamp'] || new Date().toISOString(),
      traceId: logData.traceId,
      spanId: logData.spanId,
      message: logData.body || logData.message,
      level: logData.severityText || logData.severity || logData.level,
    };

    hits.push(hit);
  }

  return hits;
}
