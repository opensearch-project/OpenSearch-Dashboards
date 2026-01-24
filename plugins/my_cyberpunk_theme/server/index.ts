import { PluginInitializerContext } from '../../../src/core/server';
import { MyCyberpunkThemePlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new MyCyberpunkThemePlugin(initializerContext);
}

export { MyCyberpunkThemePluginSetup, MyCyberpunkThemePluginStart } from './types';
