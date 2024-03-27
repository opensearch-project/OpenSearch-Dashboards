import './index.scss';

import { ExamplePlugin2Plugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin() {
  return new ExamplePlugin2Plugin();
}
export { ExamplePlugin2PluginSetup, ExamplePlugin2PluginStart } from './types';
