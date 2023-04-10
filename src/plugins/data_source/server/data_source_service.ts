/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LegacyCallAPIOptions, Logger, OpenSearchClient } from '../../../../src/core/server';
import { DataSourcePluginConfigType } from '../config';
import { OpenSearchClientPool } from './client';
import { configureLegacyClient } from './legacy';
import { DataSourceClientParams } from './types';
import { configureClient } from './client/configure_client';
export interface DataSourceServiceSetup {
  getDataSourceClient: (params: DataSourceClientParams) => Promise<OpenSearchClient>;

  getDataSourceLegacyClient: (
    params: DataSourceClientParams
  ) => {
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

  constructor(private logger: Logger) {
    this.legacyLogger = logger.get('legacy');
    this.openSearchClientPool = new OpenSearchClientPool(logger);
    this.legacyClientPool = new OpenSearchClientPool(this.legacyLogger);
  }

  async setup(config: DataSourcePluginConfigType): Promise<DataSourceServiceSetup> {
    const opensearchClientPoolSetup = this.openSearchClientPool.setup(config);
    const legacyClientPoolSetup = this.legacyClientPool.setup(config);

    const getDataSourceClient = async (
      params: DataSourceClientParams
    ): Promise<OpenSearchClient> => {
      return configureClient(params, opensearchClientPoolSetup, config, this.logger);
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
