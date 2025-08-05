/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { DataPublicPluginStart } from '../../../../../../../data/public';
import { PPLService, PPLQueryParams, escapePPLValue } from './ppl_request_helpers';

export interface PPLQueryParamsWithFilters extends PPLQueryParams {
  filters?: Array<{ field: string; value: any }>;
}

export interface PPLSpanQueryParams {
  traceId: string;
  spanId: string;
  dataSourceId: string;
  indexPattern: string;
  limit?: number;
}

// Trace-specific PPL Service that extends the base PPL functionality
export class TracePPLService extends PPLService {
  constructor(dataService: DataPublicPluginStart) {
    super(dataService);
  }

  private buildPPLQueryWithFilters(
    indexPattern: string,
    traceId: string,
    limit: number,
    filters: Array<{ field: string; value: any }> = []
  ): string {
    let query = `source = ${indexPattern} | where traceId = "${traceId}"`;

    filters.forEach((filter) => {
      const escapedValue = escapePPLValue(filter.value);
      query += ` | where ${filter.field} = ${escapedValue}`;
    });

    query += ` | head ${limit}`;
    return query;
  }

  // Execute a PPL query to fetch trace spans by trace ID with additional filters
  async fetchTraceSpans(params: PPLQueryParamsWithFilters): Promise<any> {
    const { traceId, dataSourceId, indexPattern, limit = 100, filters = [] } = params;

    if (!traceId || !dataSourceId || !indexPattern) {
      throw new Error('Missing required parameters: traceId, dataSourceId, and indexPattern');
    }

    try {
      // Build the PPL query with filters using the passed indexPattern
      const pplQuery = this.buildPPLQueryWithFilters(indexPattern, traceId, limit, filters);

      // Execute using the base class method
      return await this.executeQuery(dataSourceId, indexPattern, pplQuery);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('PPL Query with Filters Error:', error);
      throw error;
    }
  }

  // Execute a PPL query to fetch a specific span by trace ID and span ID
  async fetchSpanDetails(params: PPLSpanQueryParams): Promise<any> {
    const { traceId, spanId, dataSourceId, indexPattern, limit = 100 } = params;

    if (!traceId || !spanId || !dataSourceId || !indexPattern) {
      throw new Error(
        'Missing required parameters: traceId, spanId, dataSourceId, and indexPattern'
      );
    }

    try {
      // Construct the PPL query to filter by trace ID and span ID using the passed indexPattern
      const pplQuery = `source = ${indexPattern} | where traceId = "${traceId}" | where spanId = "${spanId}" | head ${limit}`;

      // Execute using the base class method
      return await this.executeQuery(dataSourceId, indexPattern, pplQuery);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('PPL Span Query Error:', error);
      throw error;
    }
  }
}
