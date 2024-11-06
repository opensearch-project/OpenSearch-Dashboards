import './index.scss';

import { ExamplePlugin3Plugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin() {
  return new ExamplePlugin3Plugin();
}
export { ExamplePlugin3PluginSetup, ExamplePlugin3PluginStart } from './types';
