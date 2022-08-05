import { PluginInitializerContext } from '../../../core/server';
import { BrandingPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new BrandingPlugin(initializerContext);
}

export { BrandingPluginSetup, BrandingPluginStart } from './types';
