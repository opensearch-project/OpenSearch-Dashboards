/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { DataPublicPluginStart } from '../../../../../../../data/public';
import { Dataset, spanPatternMatchesMultipleTemplates } from '../../../../../../../data/common';
import {
  PPLService,
  PPLQueryParams,
  escapePPLValue,
  buildPPLQueryRequest,
  executePPLQuery,
} from './ppl_request_helpers';

/**
 * `| dedup spanId` when the dataset's pattern matches both the v1 and v2 span indices (e.g. the
 * `otel-v*-apm-span-*` fallback), where Data Prepper writing to both returns each span twice. A
 * spanId is unique within a trace. Other datasets get no clause: dedup would stop `head` from
 * being pushed down on the v2 PPL engine and would fail on schemas without a `spanId` field.
 */
export const spanDedupClause = (title: string | undefined): string =>
  spanPatternMatchesMultipleTemplates(title) ? ' | dedup spanId' : '';

export interface PPLQueryParamsWithFilters extends PPLQueryParams {
  filters?: Array<{ field: string; value: any; operator?: '=' | '!=' }>;
}

export interface PPLSpanQueryParams {
  traceId: string;
  spanId: string;
  dataset: Dataset;
  limit?: number;
}

// Trace-specific PPL Service that extends the base PPL functionality
export class TracePPLService extends PPLService {
  constructor(dataService: DataPublicPluginStart) {
    super(dataService);
  }

  private buildPPLQueryWithFilters(
    dataset: Dataset,
    traceId: string,
    limit: number,
    filters: Array<{ field: string; value: any; operator?: '=' | '!=' }> = []
  ): string {
    let query = `source = ${dataset.title} | where traceId = "${traceId}"`;

    filters.forEach((filter) => {
      const escapedValue = escapePPLValue(filter.value);
      const operator = filter.operator === '!=' ? '!=' : '=';
      query += ` | where ${filter.field} ${operator} ${escapedValue}`;
    });

    query += `${spanDedupClause(dataset.title)} | head ${limit}`;
    return query;
  }

  // Execute a PPL query to fetch trace spans by trace ID with additional filters
  async fetchTraceSpans(params: PPLQueryParamsWithFilters): Promise<any> {
    const { traceId, dataset, limit = 100, filters = [] } = params;

    if (!traceId || !dataset) {
      throw new Error('Missing required parameters: traceId and dataset');
    }

    try {
      // Build the PPL query with filters using the dataset
      const pplQuery = this.buildPPLQueryWithFilters(dataset, traceId, limit, filters);

      const datasetWithoutTime = {
        id: dataset.id,
        title: dataset.title,
        type: dataset.type,
        // Include dataSource if present to support external data sources
        ...(dataset.dataSource && { dataSource: dataset.dataSource }),
        // Omit timeFieldName to prevent automatic time filtering
      };

      const queryRequest = buildPPLQueryRequest(datasetWithoutTime, pplQuery);
      return await executePPLQuery(this.dataService, queryRequest);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('PPL Query with Filters Error:', error);
      throw error;
    }
  }

  // Execute a PPL query to fetch a specific span by trace ID and span ID
  async fetchSpanDetails(params: PPLSpanQueryParams): Promise<any> {
    const { traceId, spanId, dataset, limit = 100 } = params;

    if (!traceId || !spanId || !dataset) {
      throw new Error('Missing required parameters: traceId, spanId, and dataset');
    }

    try {
      // Construct the PPL query to filter by trace ID and span ID using the dataset title
      const pplQuery = `source = ${dataset.title} | where traceId = "${traceId}" | where spanId = "${spanId}"${spanDedupClause(dataset.title)} | head ${limit}`;

      const queryRequest = buildPPLQueryRequest(dataset, pplQuery);
      return await executePPLQuery(this.dataService, queryRequest);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('PPL Span Query Error:', error);
      throw error;
    }
  }
}
