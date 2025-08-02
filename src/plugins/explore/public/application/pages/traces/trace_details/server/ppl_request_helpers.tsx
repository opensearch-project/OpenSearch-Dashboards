/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataPublicPluginStart } from '../../../../../../../data/public';

export interface PPLQueryParams {
  traceId: string;
  dataSourceId: string;
  indexPattern?: string;
  limit?: number;
}

export interface PPLQueryRequest {
  params: {
    index: string;
    body: {
      query: {
        query: string;
        language: string;
        format: string;
        dataset: {
          dataSource: {
            id: string;
            title: string;
            type: string;
          };
          id: string;
          title: string;
          type: string;
          isRemoteDataset: boolean;
        };
      };
    };
  };
}

// Build a PPL dataset object for queries
export const buildPPLDataset = (dataSourceId: string, indexPattern: string) => ({
  dataSource: {
    id: dataSourceId,
    title: `datasource-${dataSourceId}`,
    type: 'DATA_SOURCE',
  },
  id: `${dataSourceId}::${indexPattern}`,
  title: indexPattern,
  type: 'INDEXES', // TODO change too index_pattern
  isRemoteDataset: false,
});

// Build a complete PPL query request object
export const buildPPLQueryRequest = (
  dataSourceId: string,
  indexPattern: string,
  pplQuery: string
): PPLQueryRequest => ({
  params: {
    index: `${dataSourceId}::${indexPattern}`,
    body: {
      query: {
        query: pplQuery,
        language: 'PPL',
        format: 'jdbc',
        dataset: buildPPLDataset(dataSourceId, indexPattern),
      },
    },
  },
});

// Execute a PPL query using the data service
export const executePPLQuery = async (
  dataService: DataPublicPluginStart,
  request: PPLQueryRequest
): Promise<any> => {
  if (!dataService) {
    throw new Error('Data service is not available');
  }

  // Set the query string in the data service
  dataService.query.queryString.setQuery(request.params.body.query);

  // Execute the search
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

  // Generic method to execute any PPL query
  async executeQuery(dataSourceId: string, indexPattern: string, pplQuery: string): Promise<any> {
    if (!dataSourceId || !indexPattern || !pplQuery) {
      throw new Error('Missing required parameters for PPL query execution');
    }

    try {
      const request = buildPPLQueryRequest(dataSourceId, indexPattern, pplQuery);
      return await executePPLQuery(this.dataService, request);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('PPL Query Error:', error);
      throw error;
    }
  }
}
