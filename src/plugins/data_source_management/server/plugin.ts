/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// eslint-disable-next-line @osd/eslint/no-restricted-paths
import { DataSourcePluginSetup } from 'src/plugins/data_source/server/types';
import {
  CoreSetup,
  CoreStart,
  Logger,
  Plugin,
  PluginInitializerContext,
  ILegacyClusterClient,
} from '../../../core/server';

import { setupRoutes } from './routes';
import { DataSourceManagementPluginSetup, DataSourceManagementPluginStart } from './types';
import { OpenSearchObservabilityPlugin } from './adaptors/opensearch_observability_plugin';
import { PPLPlugin } from './adaptors/ppl_plugin';

export interface DataSourceManagementPluginDependencies {
  dataSource: DataSourcePluginSetup;
}

export class DataSourceManagementPlugin
  implements Plugin<DataSourceManagementPluginSetup, DataSourceManagementPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(
    core: CoreSetup,
    deps: {
      dataSource: DataSourceManagementPluginDependencies;
    }
  ) {
    const { dataSource } = deps;

    const dataSourceEnabled = !!dataSource;

    const openSearchObservabilityClient: ILegacyClusterClient = core.opensearch.legacy.createClient(
      'opensearch_observability',
      {
        plugins: [PPLPlugin, OpenSearchObservabilityPlugin],
      }
    );

    this.logger.debug('dataSourceManagement: Setup');
    const router = core.http.createRouter();

    // @ts-ignore
    core.http.registerRouteHandlerContext('observability_plugin', (_context, _request) => {
      return {
        logger: this.logger,
        observabilityClient: openSearchObservabilityClient,
      };
    });

    setupRoutes({ router, client: openSearchObservabilityClient, dataSourceEnabled });

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('dataSourceManagement: Started');
    return {};
  }

  public stop() {}
}
