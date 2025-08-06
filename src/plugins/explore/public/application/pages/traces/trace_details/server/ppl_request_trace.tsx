/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { DataPublicPluginStart } from '../../../../../../../data/public';
import { Dataset } from '../../../../../../../data/common';
import { PPLService, PPLQueryParams, escapePPLValue } from './ppl_request_helpers';

export interface PPLQueryParamsWithFilters extends PPLQueryParams {
  filters?: Array<{ field: string; value: any }>;
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
        // Omit timeFieldName to prevent automatic time filtering
      };

      // Execute using the base class method with the modified dataset
      return await this.executeQuery(datasetWithoutTime, pplQuery);
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
      const pplQuery = `source = ${dataset.title} | where traceId = "${traceId}" | where spanId = "${spanId}" | head ${limit}`;

      // Execute using the base class method
      return await this.executeQuery(dataset, pplQuery);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('PPL Span Query Error:', error);
      throw error;
    }
  }
}
