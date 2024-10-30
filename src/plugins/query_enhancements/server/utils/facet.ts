/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from 'opensearch-dashboards/server';
import { FacetResponse, IPPLEventsDataSource, IPPLVisualizationDataSource } from '../types';
import { shimSchemaRow, shimStats } from '.';
import { Query } from '../../../data/common';

export interface FacetProps {
  client: any;
  logger: Logger;
  endpoint: string;
  useJobs?: boolean;
  shimResponse?: boolean;
}

export class Facet {
  private defaultClient: any;
  private logger: Logger;
  private endpoint: string;
  private useJobs: boolean;
  private shimResponse: boolean;

  constructor({ client, logger, endpoint, useJobs = false, shimResponse = false }: FacetProps) {
    this.defaultClient = client;
    this.logger = logger;
    this.endpoint = endpoint;
    this.useJobs = useJobs;
    this.shimResponse = shimResponse;
  }

  protected fetch = async (
    context: any,
    request: any,
    endpoint: string
  ): Promise<FacetResponse> => {
    try {
      const query: Query = request.body.query;
      const dataSource = query.dataset?.dataSource;
      const meta = dataSource?.meta;
      const { format, lang } = request.body;
      const params = {
        body: {
          query: query.query,
          ...(meta?.name && { datasource: meta.name }),
          ...(meta?.sessionId && {
            sessionId: meta.sessionId,
          }),
          ...(lang && { lang }),
        },
        ...(format !== 'jdbc' && { format }),
      };
      const clientId = dataSource?.id;
      const client = clientId
        ? context.dataSource.opensearch.legacy.getClient(clientId).callAPI
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

  protected fetchJobs = async (
    context: any,
    request: any,
    endpoint: string
  ): Promise<FacetResponse> => {
    try {
      const query: Query = request.body.query;
      const params = request.params;
      const clientId = query.dataset?.dataSource?.id;
      const client = clientId
        ? context.dataSource.opensearch.legacy.getClient(clientId).callAPI
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
    const response = this.useJobs
      ? await this.fetchJobs(context, request, this.endpoint)
      : await this.fetch(context, request, this.endpoint);
    if (response.success === false || !this.shimResponse) return response;

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
