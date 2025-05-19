/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext } from '../../../core/public';
import { DataSourceManagementPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin(initializerContext: PluginInitializerContext) {
  return new DataSourceManagementPlugin(initializerContext);
}

export { DataSourceManagementPluginStart, DirectQueryDatasourceDetails } from './types';
export { DataSourceSelector, DataSourceOption } from './components/data_source_selector';
export { DataSourceMenu } from './components/data_source_menu';
export { DataSourceManagementPlugin, DataSourceManagementPluginSetup } from './plugin';
export {
  DataSourceSelectableConfig,
  DataSourceComponentType,
  DataSourceAggregatedViewConfig,
  DataSourceViewConfig,
  DataSourceMenuProps,
  DataSourceMultiSelectableConfig,
  createDataSourceMenu,
} from './components/data_source_menu';
export { DataSourceSelectionService } from './service/data_source_selection_service';
export { getDefaultDataSourceId, getDefaultDataSourceId$ } from './components/utils';
export { DATACONNECTIONS_BASE, DatasourceTypeToDisplayName } from './constants';
