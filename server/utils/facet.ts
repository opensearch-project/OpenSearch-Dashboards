/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from 'opensearch-dashboards/server';
import { FacetResponse, IPPLEventsDataSource, IPPLVisualizationDataSource } from '../types';
import { shimSchemaRow, shimStats } from '.';

export class Facet {
  constructor(
    private defaultClient: any,
    private logger: Logger,
    private endpoint: string,
    private shimResponse: boolean = false
  ) {
    this.defaultClient = defaultClient;
    this.logger = logger;
    this.endpoint = endpoint;
    this.shimResponse = shimResponse;
  }

  protected fetch = async (
    context: any,
    request: any,
    endpoint: string
  ): Promise<FacetResponse> => {
    try {
      const { format, df, ...query } = request.body;
      const params = {
        body: { ...query },
        ...(format !== 'jdbc' && { format }),
      };
      const dataSourceId = df?.meta?.queryConfig?.dataSourceId;
      const client = dataSourceId
        ? context.dataSource.opensearch.legacy.getClient(dataSourceId).callAPI
        : this.defaultClient.asScoped(request).callAsCurrentUser;
      const queryRes = await client(endpoint, params);
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

  public describeQuery = async (context: any, request: any): Promise<FacetResponse> => {
    const response = await this.fetch(context, request, this.endpoint);
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
