/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from 'opensearch-dashboards/server';
import { FacetResponse, IPPLEventsDataSource, IPPLVisualizationDataSource } from '../types';
import { shimSchemaRow, shimStats } from '.';
import {
  DEFAULT_ENGINE_CAPABILITIES,
  getDataSourceEngineCapabilities,
  Query,
} from '../../../data/common';

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

// Maps a base (default) client action to its per-engine equivalent, derived from the centralized
// engine-capabilities descriptor. Used to route Elasticsearch SQL/PPL to the Open Distro actions.
const OPEN_DISTRO_ACTION_BY_DEFAULT_ACTION: Record<string, string> = {
  [DEFAULT_ENGINE_CAPABILITIES.sqlPplEndpoints.ppl]: 'ppl',
  [DEFAULT_ENGINE_CAPABILITIES.sqlPplEndpoints.sql]: 'sql',
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

      // Route the query to the engine's SQL/PPL client action, per the centralized engine
      // capabilities. Since below-min languages are already hidden client-side, any query that
      // reaches here is supported, so this is a straightforward per-engine endpoint lookup.
      // Fail-open: unknown/missing engine types resolve to the default `_plugins` actions.
      if (this.legacyEsCompatEnabled) {
        const engineType = dataSource?.engineType ?? dataSource?.type;
        const caps = getDataSourceEngineCapabilities(engineType);
        const langKey = OPEN_DISTRO_ACTION_BY_DEFAULT_ACTION[endpoint];
        if (caps.usesOpenDistroSqlPpl && langKey) {
          resolvedEndpoint = caps.sqlPplEndpoints[langKey as 'ppl' | 'sql'];
        }
      }
      // `format` is nested under `query` by the client/route (`request.body.query.format`), not at
      // the top level. Read it from there (with a top-level fallback) so the `?format=jdbc` query
      // param actually reaches the cluster. This matters for Open Distro (`/_opendistro/_sql`),
      // which defaults to the native `hits` response and only returns the JDBC `{schema, datarows}`
      // shape when `format=jdbc` is sent; `/_plugins/_sql` defaults to JDBC so this was previously
      // a no-op there.
      const format = request.body?.query?.format ?? request.body?.format;
      const { lang, fetchSize, queryId } = request.body;
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
          ...(query.profile && { profile: true }),
        },
        ...(format && { format }),
        ...(Object.keys(compressionHeaders).length > 0 && { headers: compressionHeaders }),
      };
      const clientId = dataSource?.id;
      const client = clientId
        ? context.dataSource.opensearch.legacy.getClient(clientId).callAPI
        : this.defaultClient.asScoped(request).callAsCurrentUser;
      const queryRes = await client(resolvedEndpoint, params);
      return {
        success: true,
        data: queryRes,
      };
    } catch (err: any) {
      this.logger.error(`Facet fetch: ${resolvedEndpoint}: ${err}`);
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

    // `format` lives under `query` (see `fetch` above); read it from there so the shim that adds
    // `jsonData` (used by the raw/Vega path) is selected correctly.
    const dataType = request.body?.query?.format ?? request.body?.format;
    const shimFunctions: { [key: string]: (data: any) => any } = {
      jdbc: (data: any) => shimSchemaRow(data as IPPLEventsDataSource),
      viz: (data: any) => shimStats(data as IPPLVisualizationDataSource),
    };

    return shimFunctions[dataType]
      ? { ...response, data: shimFunctions[dataType](response.data) }
      : response;
  };
}
