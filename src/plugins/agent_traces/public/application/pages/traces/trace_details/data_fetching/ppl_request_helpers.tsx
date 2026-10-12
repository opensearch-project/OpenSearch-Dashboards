/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataPublicPluginStart } from '../../../../../../../data/public';
import { Dataset, TimeRange } from '../../../../../../../data/common';

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
      /** Time range for the dataset's time field; the global timefilter when omitted. */
      timeRange?: TimeRange;
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
  aggConfig?: any,
  timeRange?: TimeRange
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
  if (timeRange) {
    request.params.body.timeRange = timeRange;
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

/** Escape backslashes first, then quotes, so a value cannot close the PPL string literal. */
const escapePPLString = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

export const escapePPLValue = (value: any): string => {
  if (typeof value === 'string') {
    return `"${escapePPLString(value)}"`;
  } else if (typeof value === 'number') {
    return value.toString();
  } else if (typeof value === 'boolean') {
    return value.toString();
  } else if (value === null || value === undefined) {
    return `"${value}"`;
  } else {
    return `"${escapePPLString(JSON.stringify(value))}"`;
  }
};

export interface PPLServiceOptions {
  /** Time range to query instead of the global timefilter (e.g. a dashboard panel's own range). */
  timeRange?: TimeRange;
  /** Aborts the service's in-flight queries. */
  signal?: AbortSignal;
}

export class PPLService {
  protected dataService: DataPublicPluginStart;
  protected options: PPLServiceOptions;

  constructor(dataService: DataPublicPluginStart, options: PPLServiceOptions = {}) {
    this.dataService = dataService;
    this.options = options;
  }

  async executeQuery(dataset: Dataset, pplQuery: string): Promise<any> {
    if (!dataset || !pplQuery) {
      throw new Error('Missing required parameters for PPL query execution');
    }

    try {
      const request = buildPPLQueryRequest(dataset, pplQuery, undefined, this.options.timeRange);
      return await executePPLQuery(this.dataService, request, this.options.signal);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('PPL Query Error:', error);
      throw error;
    }
  }
}
