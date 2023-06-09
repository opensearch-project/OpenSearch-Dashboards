import { PluginInitializerContext } from '../../../core/server';
import { DataExplorerPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new DataExplorerPlugin(initializerContext);
}

export { DataExplorerPluginSetup, DataExplorerPluginStart } from './types';
