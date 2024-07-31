import { PluginInitializerContext } from '../../../src/core/server';
import { ExamplePlugin3Plugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new ExamplePlugin3Plugin(initializerContext);
}

export { ExamplePlugin3PluginSetup, ExamplePlugin3PluginStart } from './types';
