import './index.scss';

import { DataUploaderPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin() {
  return new DataUploaderPlugin();
}
export { DataUploaderPluginSetup, DataUploaderPluginStart } from './types';
