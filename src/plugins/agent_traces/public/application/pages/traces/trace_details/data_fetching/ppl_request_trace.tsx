/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { DataPublicPluginStart } from '../../../../../../../data/public';
import { Dataset } from '../../../../../../../data/common';
import {
  PPLService,
  PPLQueryParams,
  escapePPLValue,
  buildPPLQueryRequest,
  executePPLQuery,
} from './ppl_request_helpers';

export interface PPLQueryParamsWithFilters extends PPLQueryParams {
  filters?: Array<{ field: string; value: any }>;
}

export interface PPLSpanQueryParams {
  traceId: string;
  spanId: string;
  dataset: Dataset;
  limit?: number;
}

export class TracePPLService extends PPLService {
  constructor(dataService: DataPublicPluginStart) {
    super(dataService);
  }

  private buildPPLQueryWithFilters(
    dataset: Dataset,
    traceId: string,
    limit: number,
    filters: Array<{ field: string; value: any }> = []
  ): string {
    let query = `source = ${dataset.title} | where traceId = "${traceId}"`;

    filters.forEach((filter) => {
      const escapedValue = escapePPLValue(filter.value);
      query += ` | where ${filter.field} = ${escapedValue}`;
    });

    query += ` | head ${limit}`;
    return query;
  }

  async fetchTraceSpans(params: PPLQueryParamsWithFilters): Promise<any> {
    const { traceId, dataset, limit = 100, filters = [] } = params;

    if (!traceId || !dataset) {
      throw new Error('Missing required parameters: traceId and dataset');
    }

    try {
      const pplQuery = this.buildPPLQueryWithFilters(dataset, traceId, limit, filters);

      const datasetWithoutTime = {
        id: dataset.id,
        title: dataset.title,
        type: dataset.type,
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

  async fetchSpanDetails(params: PPLSpanQueryParams): Promise<any> {
    const { traceId, spanId, dataset, limit = 100 } = params;

    if (!traceId || !spanId || !dataset) {
      throw new Error('Missing required parameters: traceId, spanId, and dataset');
    }

    try {
      const pplQuery = `source = ${dataset.title} | where traceId = "${traceId}" | where spanId = "${spanId}" | head ${limit}`;

      const queryRequest = buildPPLQueryRequest(dataset, pplQuery);
      return await executePPLQuery(this.dataService, queryRequest);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('PPL Span Query Error:', error);
      throw error;
    }
  }
}
