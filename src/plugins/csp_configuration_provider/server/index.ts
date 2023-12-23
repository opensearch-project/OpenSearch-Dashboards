import { PluginInitializerContext } from '../../../core/server';
import { CspConfigurationProviderPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new CspConfigurationProviderPlugin(initializerContext);
}

export { CspConfigurationProviderPluginSetup, CspConfigurationProviderPluginStart } from './types';
