/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataPublicPluginStart } from '../../../../../../../data/public';
import { Dataset } from '../../../../../../../data/common';

export interface PPLQueryParams {
  traceId: string;
  dataset: Dataset;
  limit?: number;
}

export interface PPLQueryObject {
  query: string;
  language: string;
  format: string;
  dataset: {
    id: string;
    title: string;
    type: string;
    timeFieldName?: string;
    dataSource?: {
      id: string;
      title: string;
      type: string;
    };
  };
}

export interface PPLQueryRequest {
  params: {
    index: string;
    body: {
      // The PPL search interceptor reads the query to run from `query.queries[0]`
      // (PPLSearchInterceptor.getQuery); only when that is absent does it fall back to
      // the shared QueryStringManager. We always populate `queries` so these
      // background/flyout fetches never depend on — or mutate — the global query state.
      query: PPLQueryObject & { queries?: PPLQueryObject[] };
      aggConfig?: any; // For external data source aggregations
    };
  };
}

// Build a PPL dataset object for queries
export const buildPPLDataset = (dataset: Dataset) => {
  const pplDataset: any = {
    id: dataset.id,
    title: dataset.title,
    type: dataset.type,
    timeFieldName: dataset.timeFieldName,
  };

  // Include dataSource if present (external data source)
  if (dataset.dataSource) {
    pplDataset.dataSource = {
      id: dataset.dataSource.id,
      title: dataset.dataSource.title,
      type: dataset.dataSource.type,
    };
  }

  return pplDataset;
};

// Build a complete PPL query request object using dataset
export const buildPPLQueryRequest = (
  dataset: Dataset,
  pplQuery: string,
  aggConfig?: any
): PPLQueryRequest => {
  const query: PPLQueryObject = {
    query: pplQuery,
    language: 'PPL',
    format: 'jdbc',
    dataset: buildPPLDataset(dataset),
  };

  const request: PPLQueryRequest = {
    params: {
      index: dataset.title, // Use the dataset title as the index
      body: {
        // Populate `queries` so the search interceptor uses this query directly
        // instead of falling back to the shared QueryStringManager.
        query: {
          ...query,
          queries: [query],
        },
      },
    },
  };

  // Add aggConfig if provided (for external data sources)
  if (aggConfig) {
    request.params.body.aggConfig = aggConfig;
  }

  return request;
};

// Execute a PPL query using the data service
export const executePPLQuery = async (
  dataService: DataPublicPluginStart,
  request: PPLQueryRequest
): Promise<any> => {
  if (!dataService) {
    throw new Error('Data service is not available');
  }

  // Execute the search directly from the fully-formed request. The query travels in
  // request.params.body.query.queries[0] (see buildPPLQueryRequest), so the interceptor
  // uses it without reading or mutating the shared QueryStringManager. This keeps these
  // background/flyout fetches (trace spans, logs correlation) from leaking their
  // query/dataset (e.g. logs-otel-v1*) into the main editor and corrupting the next
  // "+"/"-" filter-add query.
  const response = await dataService.search.search(request, {}).toPromise();

  return response;
};

// Escape a value for use in PPL queries
export const escapePPLValue = (value: any): string => {
  if (typeof value === 'string') {
    return `"${value.replace(/"/g, '\\"')}"`;
  } else if (typeof value === 'number') {
    return value.toString();
  } else if (typeof value === 'boolean') {
    return value.toString();
  } else if (value === null || value === undefined) {
    return `"${value}"`;
  } else {
    return `"${JSON.stringify(value).replace(/"/g, '\\"')}"`;
  }
};

// Base PPL Service class with core functionality
export class PPLService {
  protected dataService: DataPublicPluginStart;

  constructor(dataService: DataPublicPluginStart) {
    this.dataService = dataService;
  }

  // Generic method to execute any PPL query using dataset
  async executeQuery(dataset: Dataset, pplQuery: string): Promise<any> {
    if (!dataset || !pplQuery) {
      throw new Error('Missing required parameters for PPL query execution');
    }

    try {
      const request = buildPPLQueryRequest(dataset, pplQuery);
      return await executePPLQuery(this.dataService, request);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('PPL Query Error:', error);
      throw error;
    }
  }
}
