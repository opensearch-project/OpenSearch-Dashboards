/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AppMountParameters,
  CoreSetup,
  CoreStart,
  DEFAULT_APP_CATEGORIES,
  Plugin,
  StartServicesAccessor,
} from '../../../core/public';

import { PLUGIN_NAME } from '../common';

import { ManagementSetup } from '../../management/public';
import { IndexPatternManagementSetup } from '../../index_pattern_management/public';
import { DataSourceColumn } from './components/data_source_column/data_source_column';
import { DataSourceManagementStartDependencies } from './types';

export interface DataSourceManagementSetupDependencies {
  management: ManagementSetup;
  indexPatternManagement: IndexPatternManagementSetup;
}

const DSM_APP_ID = 'dataSources';

export class DataSourceManagementPlugin
  implements Plugin<void, void, DataSourceManagementSetupDependencies> {
  public setup(core: CoreSetup, { indexPatternManagement }: DataSourceManagementSetupDependencies) {
    const savedObjectPromise = core
      .getStartServices()
      .then(([coreStart]) => coreStart.savedObjects);
    const httpPromise = core.getStartServices().then(([coreStart]) => coreStart.http);
    const column = new DataSourceColumn(savedObjectPromise, httpPromise);
    indexPatternManagement.columns.register(column);

    core.application.register({
      id: DSM_APP_ID,
      title: PLUGIN_NAME,
      order: 1,
      category: DEFAULT_APP_CATEGORIES.opensearchDashboards,
      mount: async (params: AppMountParameters) => {
        const { mountDataSourcesManagementSection } = await import('./management_app');

        return mountDataSourcesManagementSection(
          core.getStartServices as StartServicesAccessor<DataSourceManagementStartDependencies>,
          params
        );
      },
    });
  }

  public start(core: CoreStart) {}

  public stop() {}
}
