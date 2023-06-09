import './index.scss';

import { DataExplorerPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin() {
  return new DataExplorerPlugin();
}
export { DataExplorerPluginSetup, DataExplorerPluginStart } from './types';
