import { PluginInitializerContext } from '../../../../src/core/server';
import { QueryEnhancementsPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new QueryEnhancementsPlugin(initializerContext);
}

export { QueryEnhancementsPluginSetup, QueryEnhancementsPluginStart } from './types';
