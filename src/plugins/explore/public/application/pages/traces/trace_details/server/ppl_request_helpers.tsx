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

export interface PPLQueryRequest {
  params: {
    index: string;
    body: {
      query: {
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
      };
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
  const request: PPLQueryRequest = {
    params: {
      index: dataset.title, // Use the dataset title as the index
      body: {
        query: {
          query: pplQuery,
          language: 'PPL',
          format: 'jdbc',
          dataset: buildPPLDataset(dataset),
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

  // Set the query string in the data service
  // @ts-expect-error TS2345 TODO(ts-error): fixme
  dataService.query.queryString.setQuery(request.params.body.query);

  // Execute the search
  const response = await dataService.search.search(request, {}).toPromise();

  return response;
};

/**
 * Escape the body of a PPL double-quoted string literal.
 *
 * The PPL lexer rule is
 *   DQUOTA_STRING: '"' ( '\\'. | '""' | ~('"'|'\\') )* '"'
 * so a backslash escapes the character after it. Escaping only the quotes is
 * therefore not enough: a value ending in `\`, or containing `\` immediately
 * before a `"`, emits a literal that terminates early and spills the remainder
 * into the surrounding query. Backslashes must be doubled first, then quotes.
 */
const escapePPLStringBody = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

// Escape a value for use in PPL queries
export const escapePPLValue = (value: any): string => {
  if (typeof value === 'string') {
    return `"${escapePPLStringBody(value)}"`;
  } else if (typeof value === 'number') {
    return value.toString();
  } else if (typeof value === 'boolean') {
    return value.toString();
  } else if (value === null || value === undefined) {
    return `"${value}"`;
  } else {
    return `"${escapePPLStringBody(JSON.stringify(value))}"`;
  }
};

/**
 * Quote a field name as a PPL backtick-delimited identifier.
 *
 * Mirrors {@link escapePPLValue} for the identifier position. The lexer rule is
 *   BQUOTA_STRING: '`' ( '\\'. | '``' | ~('`'|'\\') )* '`'
 * so both backslashes and backticks need escaping; interpolating a field name
 * raw lets a name containing either break out of the identifier.
 */
export const escapePplIdentifier = (identifier: string): string =>
  `\`${String(identifier).replace(/\\/g, '\\\\').replace(/`/g, '``')}\``;

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
