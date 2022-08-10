/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataPublicPluginStart } from 'src/plugins/data/public';
import { DataSourceStart } from 'src/plugins/data_source/public';
import { CoreSetup, CoreStart, Plugin } from '../../../core/public';

import { PLUGIN_NAME } from '../common';

import { ManagementSetup } from '../../management/public';
import { UrlForwardingSetup } from '../../url_forwarding/public';

import {
  DataSourceManagementService,
  DataSourceManagementServiceSetup,
  DataSourceManagementServiceStart,
} from './service';

export interface DataSourceManagementSetupDependencies {
  management: ManagementSetup;
  urlForwarding: UrlForwardingSetup;
}

export interface DataSourceManagementStartDependencies {
  data: DataPublicPluginStart;
  dataSource: DataSourceStart;
}

export type DataSourceManagementSetup = DataSourceManagementServiceSetup;

export type DataSourceManagementStart = DataSourceManagementServiceStart;

const IPM_APP_ID = 'dataSources';

export class DataSourceManagementPlugin
  implements
    Plugin<
      DataSourceManagementSetup,
      DataSourceManagementStart,
      DataSourceManagementSetupDependencies,
      DataSourceManagementStartDependencies
    > {
  private readonly dataSourceManagementService = new DataSourceManagementService();

  public setup(
    // todo: y setup accept start fucntions
    core: CoreSetup<DataSourceManagementStartDependencies, DataSourceManagementStart>,
    { management, urlForwarding }: DataSourceManagementSetupDependencies
  ) {
    const opensearchDashboardsSection = management.sections.section.opensearchDashboards;

    if (!opensearchDashboardsSection) {
      throw new Error('`opensearchDashboards` management section not found.');
    }

    opensearchDashboardsSection.registerApp({
      id: IPM_APP_ID,
      title: PLUGIN_NAME,
      order: 1,
      mount: async (params) => {
        const { mountManagementSection } = await import('./management_app');

        return mountManagementSection(core.getStartServices, params);
      },
    });

    return this.dataSourceManagementService.setup({ httpClient: core.http });
  }

  public start(core: CoreStart, plugins: DataSourceManagementStartDependencies) {
    return this.dataSourceManagementService.start();
  }

  public stop() {
    return this.dataSourceManagementService.stop();
  }
}
