import { PluginInitializerContext } from '../../../core/server';
import { CredentialManagementPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new CredentialManagementPlugin(initializerContext);
}

export { CredentialManagementPluginSetup, CredentialManagementPluginStart } from './types';
