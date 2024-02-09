import { PluginInitializerContext } from '../../../core/server';
import { ApplicationConfigPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new ApplicationConfigPlugin(initializerContext);
}

export { ApplicationConfigPluginSetup, ApplicationConfigPluginStart } from './types';
