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
  requestCompression?: boolean;
  /**
   * When true, queries against Elasticsearch data sources are routed to the Open Distro client
   * actions (e.g. `enhancements.pplQueryOpenDistro`). Gated by
   * queryEnhancements.legacyElasticsearchCompatibility.enabled.
   */
  legacyEsCompatEnabled?: boolean;
}

const ELASTICSEARCH_ENGINE_TYPE = 'Elasticsearch';

// Maps a base client action to its Open Distro equivalent for Elasticsearch data sources.
const OPEN_DISTRO_ACTION_BY_ENDPOINT: Record<string, string> = {
  'enhancements.pplQuery': 'enhancements.pplQueryOpenDistro',
  'enhancements.sqlQuery': 'enhancements.sqlQueryOpenDistro',
};

export class Facet {
  private defaultClient: any;
  private logger: Logger;
  private endpoint: string;
  private useJobs: boolean;
  private shimResponse: boolean;
  private requestCompression: boolean;
  private legacyEsCompatEnabled: boolean;

  constructor({
    client,
    logger,
    endpoint,
    useJobs = false,
    shimResponse = false,
    requestCompression = false,
    legacyEsCompatEnabled = false,
  }: FacetProps) {
    this.defaultClient = client;
    this.logger = logger;
    this.endpoint = endpoint;
    this.useJobs = useJobs;
    this.shimResponse = shimResponse;
    this.requestCompression = requestCompression;
    this.legacyEsCompatEnabled = legacyEsCompatEnabled;
  }

  private getCompressionHeaders(): Record<string, string> {
    return this.requestCompression ? { 'accept-encoding': 'gzip, deflate' } : {};
  }

  protected fetch = async (
    context: any,
    request: any,
    endpoint: string
  ): Promise<FacetResponse> => {
    // Declared outside the try so the catch block can log the resolved endpoint too.
    let resolvedEndpoint = endpoint;
    try {
      const query: Query = request.body.query;
      const dataSource = query.dataset?.dataSource;
      const meta = dataSource?.meta;

      // Route Elasticsearch data sources to the Open Distro endpoints. Since below-min ES languages
      // are already hidden client-side, any ES query that reaches here is supported, so this is a
      // straightforward "engine is Elasticsearch => Open Distro" mapping. Fail-open: unknown/missing
      // engine types keep the default `_plugins` action.
      if (this.legacyEsCompatEnabled) {
        const engineType = dataSource?.engineType ?? dataSource?.type;
        if (engineType === ELASTICSEARCH_ENGINE_TYPE && OPEN_DISTRO_ACTION_BY_ENDPOINT[endpoint]) {
          resolvedEndpoint = OPEN_DISTRO_ACTION_BY_ENDPOINT[endpoint];
        }
        this.logger.info(
          `Facet fetch: engineType=${engineType}, endpoint=${endpoint} -> ${resolvedEndpoint}`
        );
      }
      const { format, lang, fetchSize, queryId } = request.body;
      const compressionHeaders = this.getCompressionHeaders();
      const { highlight } = request.body;
      const params = {
        body: {
          query: query.query,
          ...(fetchSize && { fetch_size: fetchSize }),
          ...(meta?.name && { datasource: meta.name }),
          ...(meta?.sessionId && {
            sessionId: meta.sessionId,
          }),
          ...(lang && { lang }),
          ...(highlight && { highlight }),
          ...(queryId && { queryId }),
        },
        ...(format !== 'jdbc' && { format }),
        ...(Object.keys(compressionHeaders).length > 0 && { headers: compressionHeaders }),
      };
      const clientId = dataSource?.id;
      const client = clientId
        ? context.dataSource.opensearch.legacy.getClient(clientId).callAPI
        : this.defaultClient.asScoped(request).callAsCurrentUser;

      // TEMP DEBUG: log the exact action + request params being sent to the cluster.
      this.logger.info(
        `Facet fetch CALL: action=${resolvedEndpoint}, clientId=${clientId ?? 'default'}, ` +
          `engineType=${dataSource?.engineType ?? dataSource?.type}, ` +
          `version=${dataSource?.version}, params=${JSON.stringify(params)}`
      );

      const queryRes = await client(resolvedEndpoint, params);
      return {
        success: true,
        data: queryRes,
      };
    } catch (err: any) {
      // TEMP DEBUG: log the full error payload (statusCode + response body), which the default
      // `${err}` string drops. Legacy clients put the cluster's JSON error under err.body / err.response.
      this.logger.error(
        `Facet fetch FAIL: action=${resolvedEndpoint}: ${err}\n` +
          `statusCode=${err?.statusCode}\n` +
          `body=${JSON.stringify(err?.body ?? err?.response ?? err?.data)}`
      );
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
      const compressionHeaders = this.getCompressionHeaders();
      const params = {
        ...request.params,
        ...(Object.keys(compressionHeaders).length > 0 && { headers: compressionHeaders }),
      };
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
