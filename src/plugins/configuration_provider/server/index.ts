/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginConfigDescriptor, PluginInitializerContext } from '../../../core/server';
import { ConfigurationProviderConfigSchema, configSchema } from '../config';
import { ConfigurationProviderPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export const config: PluginConfigDescriptor<ConfigurationProviderConfigSchema> = {
  schema: configSchema,
};

export function plugin(initializerContext: PluginInitializerContext) {
  return new ConfigurationProviderPlugin(initializerContext);
}

export { ConfigurationProviderPluginSetup, ConfigurationProviderPluginStart } from './types';
