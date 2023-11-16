import './index.scss';

import { VisDrilldownPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin() {
  return new VisDrilldownPlugin();
}
export { VisDrilldownPluginSetup, VisDrilldownPluginStart } from './types';
