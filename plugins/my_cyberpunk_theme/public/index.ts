import './index.scss';

import { MyCyberpunkThemePlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin() {
  return new MyCyberpunkThemePlugin();
}
export { MyCyberpunkThemePluginSetup, MyCyberpunkThemePluginStart } from './types';
