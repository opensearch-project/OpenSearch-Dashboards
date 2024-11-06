import { PluginInitializerContext } from '../../../src/core/server';
import { ExamplePlugin2Plugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new ExamplePlugin2Plugin(initializerContext);
}

export { ExamplePlugin2PluginSetup, ExamplePlugin2PluginStart } from './types';
