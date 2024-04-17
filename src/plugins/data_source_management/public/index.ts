/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataSourceManagementPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin() {
  return new DataSourceManagementPlugin();
}

export { DataSourceManagementPluginStart } from './types';
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
} from './components/data_source_menu';
