/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from 'opensearch-dashboards/server';
import { FacetResponse, IPPLEventsDataSource, IPPLVisualizationDataSource } from '../types';
import { shimSchemaRow, shimStats } from '.';

export class Facet {
  constructor(
    private client: any,
    private logger: Logger,
    private endpoint: string,
    private shimResponse: boolean = false
  ) {
    this.client = client;
    this.logger = logger;
    this.endpoint = endpoint;
    this.shimResponse = shimResponse;
  }

  protected fetch = async (request: any, endpoint: string): Promise<FacetResponse> => {
    try {
      const { query, format } = request.body;
      const params = {
        body: { query },
        ...(format !== 'jdbc' && { format }),
      };
      const queryRes = await this.client.asScoped(request).callAsCurrentUser(endpoint, params);
      return {
        success: true,
        data: queryRes,
      };
    } catch (err: any) {
      this.logger.error(`Facet fetch: ${endpoint}: ${err}`);
      return {
        success: false,
        data: err,
      };
    }
  };

  public describeQuery = async (request: any): Promise<FacetResponse> => {
    const response = await this.fetch(request, this.endpoint);
    if (!this.shimResponse) return response;

    const { format: dataType } = request.body;
    const shimFunctions: { [key: string]: (data: any) => any } = {
      jdbc: (data: any) => shimSchemaRow(data as IPPLEventsDataSource),
      viz: (data: any) => shimStats(data as IPPLVisualizationDataSource),
    };

    return shimFunctions[dataType]
      ? { ...response, data: shimFunctions[dataType](response.data) }
      : response;
  };
}
