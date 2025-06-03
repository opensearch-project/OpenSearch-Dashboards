/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// eslint-disable-next-line @osd/eslint/no-restricted-paths
import { DataSourcePluginSetup } from 'src/plugins/data_source/server/types';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
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
import { ConfigSchema } from '../config';
import {
  getPrincipalsFromRequest,
  getWorkspaceState,
  updateWorkspaceState,
} from '../../../../src/core/server/utils';
import {
  DATA_SOURCE_PERMISSION_CLIENT_WRAPPER_ID,
  ManageableBy,
  ORDER_FOR_DATA_SOURCE_PERMISSION_WRAPPER,
} from '../common';
import { DataSourcePermissionClientWrapper } from './saved_objects/data_source_premission_client_wrapper';

export interface DataSourceManagementPluginDependencies {
  dataSource: DataSourcePluginSetup;
}

export class DataSourceManagementPlugin
  implements Plugin<DataSourceManagementPluginSetup, DataSourceManagementPluginStart> {
  private readonly config$: Observable<ConfigSchema>;
  private readonly logger: Logger;

  private setupDataSourcePermission(core: CoreSetup, config: ConfigSchema) {
    core.http.registerOnPostAuth(async (request, response, toolkit) => {
      let groups: string[];
      const [coreStart] = await core.getStartServices();

      try {
        ({ groups = [] } = getPrincipalsFromRequest(request, coreStart.http.auth));
      } catch (e) {
        return toolkit.next();
      }

      const configGroups = config.dataSourceAdmin.groups;
      const isDataSourceAdmin = configGroups.some((configGroup) => groups.includes(configGroup));
      updateWorkspaceState(request, {
        isDataSourceAdmin,
      });
      return toolkit.next();
    });

    const dataSourcePermissionWrapper = new DataSourcePermissionClientWrapper(config.manageableBy);

    // Add data source permission client wrapper factory
    core.savedObjects.addClientWrapper(
      ORDER_FOR_DATA_SOURCE_PERMISSION_WRAPPER,
      DATA_SOURCE_PERMISSION_CLIENT_WRAPPER_ID,
      dataSourcePermissionWrapper.wrapperFactory
    );
  }

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
    this.config$ = initializerContext.config.create<ConfigSchema>();
  }

  public async setup(
    core: CoreSetup,
    deps: {
      dataSource: DataSourceManagementPluginDependencies;
    }
  ) {
    const { dataSource } = deps;

    const config: ConfigSchema = await this.config$.pipe(first()).toPromise();

    const dataSourceEnabled = !!dataSource;

    const openSearchDataSourceManagementClient: ILegacyClusterClient = core.opensearch.legacy.createClient(
      'opensearch_data_source_management',
      {
        plugins: [PPLPlugin, OpenSearchDataSourceManagementPlugin],
      }
    );

    this.logger.debug('dataSourceManagement: Setup');
    const router = core.http.createRouter();

    const { manageableBy } = config;
    core.capabilities.registerProvider(() => ({
      dataSource: {
        canManage: false,
      },
    }));

    core.capabilities.registerSwitcher((request) => {
      const { requestWorkspaceId, isDashboardAdmin } = getWorkspaceState(request);
      // User can not manage data source in the workspace.
      const canManage =
        (manageableBy === ManageableBy.All && !requestWorkspaceId) ||
        (manageableBy === ManageableBy.DashboardAdmin &&
          isDashboardAdmin !== false &&
          !requestWorkspaceId);

      return { dataSource: { canManage } };
    });

    if (dataSourceEnabled) {
      dataSource.registerCustomApiSchema(PPLPlugin);
      dataSource.registerCustomApiSchema(OpenSearchDataSourceManagementPlugin);

      this.setupDataSourcePermission(core, config);
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
