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

// Export framework utilities
export { usePolling, UsePolling, PollingConfigurations } from '../framework/utils/use_polling';
export { SQLService } from '../framework/requests/sql';
export { useDirectQuery } from '../framework/hooks/direct_query_hook';
export { DirectQueryRequest, DirectQueryLoadingStatus } from '../framework/types';
export { getAsyncSessionId, setAsyncSessionId } from '../framework/utils/query_session_utils';
export { formatError } from '../framework/utils/shared';
export { ASYNC_POLLING_INTERVAL } from '../framework/constants';
