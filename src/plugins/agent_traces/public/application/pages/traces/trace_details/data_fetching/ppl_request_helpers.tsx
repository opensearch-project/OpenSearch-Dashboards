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
        queries: Array<{
          query: string;
          language: string;
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
        }>;
      };
      aggConfig?: any; // For external data source aggregations
    };
  };
}

export const buildPPLDataset = (dataset: Dataset) => {
  const pplDataset: any = {
    id: dataset.id,
    title: dataset.title,
    type: dataset.type,
    timeFieldName: dataset.timeFieldName,
  };

  if (dataset.dataSource) {
    pplDataset.dataSource = {
      id: dataset.dataSource.id,
      title: dataset.dataSource.title,
      type: dataset.dataSource.type,
    };
  }

  return pplDataset;
};

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
          queries: [
            {
              query: pplQuery,
              language: 'PPL',
              dataset: buildPPLDataset(dataset),
            },
          ],
        },
      },
    },
  };

  if (aggConfig) {
    request.params.body.aggConfig = aggConfig;
  }

  return request;
};

export const executePPLQuery = async (
  dataService: DataPublicPluginStart,
  request: PPLQueryRequest,
  signal?: AbortSignal
): Promise<any> => {
  if (!dataService) {
    throw new Error('Data service is not available');
  }

  const response = await dataService.search.search(request, { abortSignal: signal }).toPromise();

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
 *
 * NOTE: duplicated in
 * src/plugins/explore/public/application/pages/traces/trace_details/server/ppl_request_helpers.tsx
 * — keep the two in sync.
 */
const escapePPLStringBody = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

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

export class PPLService {
  protected dataService: DataPublicPluginStart;

  constructor(dataService: DataPublicPluginStart) {
    this.dataService = dataService;
  }

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
