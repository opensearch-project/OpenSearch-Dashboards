import './index.scss';

import { QueryEnhancementsPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin() {
  return new QueryEnhancementsPlugin();
}
export { QueryEnhancementsPluginSetup, QueryEnhancementsPluginStart } from './types';
