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
    const traceIdField = this.getTraceIdFieldName(dataset);

    let query = `source = ${dataset.title} | where ${traceIdField} = "${traceId}"`;

    filters.forEach((filter) => {
      const escapedValue = escapePPLValue(filter.value);
      query += ` | where ${filter.field} = ${escapedValue}`;
    });

    query += ` | head ${limit}`;
    return query;
  }

  private getTraceIdFieldName(dataset: Dataset): string {
    if (dataset.schemaMappings?.otelTraces?.traceId) {
      return dataset.schemaMappings.otelTraces.traceId;
    }

    const indexName = dataset.title.toLowerCase();

    if (indexName.includes('jaeger')) {
      return 'traceID';
    }

    return 'traceId';
  }

  private getSpanIdFieldName(dataset: Dataset): string {
    // Check for explicit schema mappings first
    if (dataset.schemaMappings?.otelTraces?.spanId) {
      return dataset.schemaMappings.otelTraces.spanId;
    }

    // Auto-detect schema based on index name patterns
    const indexName = dataset.title.toLowerCase();

    if (indexName.includes('jaeger')) {
      return 'spanID'; // Jaeger uses capital ID
    }

    // Default to lowercase for DataPrepper
    return 'spanId';
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
      const traceIdField = this.getTraceIdFieldName(dataset);
      const spanIdField = this.getSpanIdFieldName(dataset);

      // Construct the PPL query to filter by trace ID and span ID using the dataset title
      const pplQuery = `source = ${dataset.title} | where ${traceIdField} = "${traceId}" | where ${spanIdField} = "${spanId}" | head ${limit}`;

      const queryRequest = buildPPLQueryRequest(dataset, pplQuery);
      return await executePPLQuery(this.dataService, queryRequest);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('PPL Span Query Error:', error);
      throw error;
    }
  }
}
