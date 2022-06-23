import { i18n } from '@osd/i18n';
import { AppMountParameters, CoreSetup, CoreStart, Plugin } from '../../../core/public';
import {
  DataSourceManagementPluginSetup,
  DataSourceManagementPluginStart,
  AppPluginStartDependencies,
} from './types';
import { PLUGIN_NAME } from '../common';

import { ManagementSetup } from '../../management/public';
import { UrlForwardingSetup } from '../../url_forwarding/public';

import { DataSourceManagementService } from './service';

export interface DataSourceManagementSetupDependencies {
  management: ManagementSetup;
  urlForwarding: UrlForwardingSetup;
}

export class DataSourceManagementPlugin
  implements Plugin<DataSourceManagementPluginSetup, DataSourceManagementPluginStart> {
  private readonly dataSourceManagementService = new DataSourceManagementService();

  public setup(
    core: CoreSetup,
    { management, urlForwarding }: DataSourceManagementSetupDependencies
  ): DataSourceManagementPluginSetup {
    const opensearchDashboardsSection = management.sections.section.opensearchDashboards;

    if (!opensearchDashboardsSection) {
      throw new Error('`opensearchDashboards` management section not found.');
    }

    opensearchDashboardsSection.registerApp({
      id: 'dataSourceManagement',
      title: PLUGIN_NAME,
      order: 0,
      mount: async (params) => {
        const { mountManagementSection } = await import('./management_app');

        return mountManagementSection(core.getStartServices, params);
      },
    });

    return this.dataSourceManagementService.setup({ httpClient: core.http });
  }

  public start(core: CoreStart): DataSourceManagementPluginStart {
    return {};
  }

  public stop() {}
}
