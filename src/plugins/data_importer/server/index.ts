import { PluginInitializerContext } from '../../../core/server';
import { DataUploaderPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new DataUploaderPlugin(initializerContext);
}

export { DataUploaderPluginSetup, DataUploaderPluginStart } from './types';
