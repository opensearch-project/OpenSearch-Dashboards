/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transport } from '@opensearch-project/opensearch';
import { LegacyCallAPIOptions, Logger, OpenSearchClient } from '../../../../src/core/server';
import { DataSourcePluginConfigType } from '../config';
import { OpenSearchClientPool } from './client';
import { configureLegacyClient } from './legacy';
import { DataSourceClientParams } from './types';
import { configureClient } from './client/configure_client';
export interface DataSourceServiceSetup {
  getDataSourceClient: (params: DataSourceClientParams) => Promise<OpenSearchClient>;

  getDataSourceLegacyClient: (params: DataSourceClientParams) => {
    callAPI: (
      endpoint: string,
      clientParams?: Record<string, any>,
      options?: LegacyCallAPIOptions
    ) => Promise<unknown>;
  };
}
export class DataSourceService {
  private readonly openSearchClientPool: OpenSearchClientPool;
  private readonly legacyClientPool: OpenSearchClientPool;
  private readonly legacyLogger: Logger;
  private customTransport?: typeof Transport;

  constructor(private logger: Logger) {
    this.legacyLogger = logger.get('legacy');
    this.openSearchClientPool = new OpenSearchClientPool(logger);
    this.legacyClientPool = new OpenSearchClientPool(this.legacyLogger);
  }

  /**
   * Register a custom Transport class (e.g. legacy backend compatibility) to apply to
   * modern data-source clients. Called from the plugin's start() once core's registered
   * transport is available. No-op when undefined (e.g. backendCompatibility disabled).
   *
   * MUST be called exactly once during start(), before any data-source client is
   * requested. The Transport is not part of the client-pool cache key, so root clients
   * pooled before this is set would not pick up a later change.
   */
  public setCustomTransport(transport?: typeof Transport) {
    this.customTransport = transport;
  }

  async setup(config: DataSourcePluginConfigType): Promise<DataSourceServiceSetup> {
    const opensearchClientPoolSetup = this.openSearchClientPool.setup(config);
    const legacyClientPoolSetup = this.legacyClientPool.setup(config);

    const getDataSourceClient = async (
      params: DataSourceClientParams
    ): Promise<OpenSearchClient> => {
      return configureClient(
        { ...params, customTransport: this.customTransport },
        opensearchClientPoolSetup,
        config,
        this.logger
      );
    };

    const getDataSourceLegacyClient = (params: DataSourceClientParams) => {
      return {
        callAPI: (
          endpoint: string,
          clientParams?: Record<string, any>,
          options?: LegacyCallAPIOptions
        ) =>
          configureLegacyClient(
            params,
            { endpoint, clientParams, options },
            legacyClientPoolSetup,
            config,
            this.legacyLogger
          ),
      };
    };

    return { getDataSourceClient, getDataSourceLegacyClient };
  }

  start() {}

  stop() {
    this.openSearchClientPool.stop();
  }
}
