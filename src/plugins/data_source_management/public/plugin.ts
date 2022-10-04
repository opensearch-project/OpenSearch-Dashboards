/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup, CoreStart, Plugin } from '../../../core/public';

import { PLUGIN_NAME } from '../common';

import { ManagementSetup } from '../../management/public';

export interface DataSourceManagementSetupDependencies {
  management: ManagementSetup;
}

const DSM_APP_ID = 'dataSources';

export class DataSourceManagementPlugin
  implements Plugin<void, void, DataSourceManagementSetupDependencies> {
  public setup(core: CoreSetup, { management }: DataSourceManagementSetupDependencies) {
    const opensearchDashboardsSection = management.sections.section.opensearchDashboards;

    if (!opensearchDashboardsSection) {
      throw new Error('`opensearchDashboards` management section not found.');
    }

    opensearchDashboardsSection.registerApp({
      id: DSM_APP_ID,
      title: PLUGIN_NAME,
      showExperimentalBadge: true,
      order: 1,
      mount: async (params) => {
        const { mountManagementSection } = await import('./management_app');

        return mountManagementSection(core.getStartServices, params);
      },
    });
  }

  public start(core: CoreStart) {}

  public stop() {}
}
