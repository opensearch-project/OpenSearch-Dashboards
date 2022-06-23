import './index.scss';

import { DataSourceManagementPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin() {
  return new DataSourceManagementPlugin();
}
export { DataSourceManagementPluginSetup, DataSourceManagementPluginStart } from './types';
