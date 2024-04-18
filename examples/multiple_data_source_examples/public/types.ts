/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataSourcePluginSetup } from 'src/plugins/data_source/public';
import { DataSourceManagementPluginSetup } from 'src/plugins/data_source_management/public';
import { NavigationPublicPluginStart } from 'src/plugins/navigation/public';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MultipleDataSourceExamplesPluginSetup {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MultipleDataSourceExamplesPluginStart {}

export interface MultipleDataSourceExamplesPluginSetupDependencies {
  dataSource: DataSourcePluginSetup;
  dataSourceManagement: DataSourceManagementPluginSetup;
  developerExamples: DeveloperExamplesSetup;
}

export interface MultipleDataSourceExamplesPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}
