/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup, CoreStart, Plugin } from '../../../core/public';

import { PLUGIN_NAME } from '../common';

import { ManagementSetup } from '../../management/public';
import { IndexPatternManagementSetup } from '../../index_pattern_management/public';
import { DataSourceColumn } from './components/data_source_column/data_source_column';

export interface DataSourceManagementSetupDependencies {
  management: ManagementSetup;
  indexPatternManagement: IndexPatternManagementSetup;
}

const DSM_APP_ID = 'dataSources';

export class DataSourceManagementPlugin
  implements Plugin<void, void, DataSourceManagementSetupDependencies> {
  public setup(
    core: CoreSetup,
    { management, indexPatternManagement }: DataSourceManagementSetupDependencies
  ) {
    const opensearchDashboardsSection = management.sections.section.opensearchDashboards;

    if (!opensearchDashboardsSection) {
      throw new Error('`opensearchDashboards` management section not found.');
    }

    const savedObjectPromise = core
      .getStartServices()
      .then(([coreStart]) => coreStart.savedObjects);
    const httpPromise = core.getStartServices().then(([coreStart]) => coreStart.http);
    const column = new DataSourceColumn(savedObjectPromise, httpPromise);
    indexPatternManagement.columns.register(column);

    opensearchDashboardsSection.registerApp({
      id: DSM_APP_ID,
      title: PLUGIN_NAME,
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
