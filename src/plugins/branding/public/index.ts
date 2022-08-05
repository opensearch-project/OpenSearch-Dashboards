import './index.scss';

import { BrandingPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin() {
  return new BrandingPlugin();
}
export { BrandingPluginSetup, BrandingPluginStart } from './types';
