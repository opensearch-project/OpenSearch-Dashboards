/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { CoreSetup, CoreStart, Plugin } from '../../../core/public';
import { DataSourceManagementPluginStart, DataSourceManagementSetupDependencies } from './types';

import { PLUGIN_NAME } from '../common';

const IPM_APP_ID = 'dataSources';

export class DataSourceManagementPlugin
  implements Plugin<void, DataSourceManagementPluginStart, DataSourceManagementSetupDependencies> {
  public setup(core: CoreSetup, { management }: DataSourceManagementSetupDependencies) {
    const opensearchDashboardsSection = management.sections.section.opensearchDashboards;

    if (!opensearchDashboardsSection) {
      throw new Error('`opensearchDashboards` management section not found.');
    }

    opensearchDashboardsSection.registerApp({
      id: IPM_APP_ID,
      title: PLUGIN_NAME,
      order: 0,
      mount: async (params) => {
        const { mountManagementSection } = await import('./management_app');

        return mountManagementSection(core.getStartServices, params);
      },
    });
  }

  public start(core: CoreStart): DataSourceManagementPluginStart {
    return {};
  }

  public stop() {}
}
