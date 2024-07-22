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
import { OpenSearchDataSourceManagementPlugin } from './adaptors/opensearch_data_source_management_plugin';
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

    const openSearchDataSourceManagementClient: ILegacyClusterClient = core.opensearch.legacy.createClient(
      'opensearch_data_source_management',
      {
        plugins: [PPLPlugin, OpenSearchDataSourceManagementPlugin],
      }
    );

    this.logger.debug('dataSourceManagement: Setup');
    const router = core.http.createRouter();

    if (dataSourceEnabled) {
      dataSource.registerCustomApiSchema(PPLPlugin);
      dataSource.registerCustomApiSchema(OpenSearchDataSourceManagementPlugin);
    }
    // @ts-ignore
    core.http.registerRouteHandlerContext(
      'opensearch_data_source_management',
      (_context, _request) => {
        return {
          logger: this.logger,
          dataSourceManagementClient: openSearchDataSourceManagementClient,
        };
      }
    );

    setupRoutes({ router, client: openSearchDataSourceManagementClient, dataSourceEnabled });

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('dataSourceManagement: Started');
    return {};
  }

  public stop() {}
}
