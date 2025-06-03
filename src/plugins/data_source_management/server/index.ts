/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginConfigDescriptor, PluginInitializerContext } from '../../../core/server';
import { ConfigSchema, configSchema } from '../config';
import { DataSourceManagementPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new DataSourceManagementPlugin(initializerContext);
}

export const config: PluginConfigDescriptor<ConfigSchema> = {
  schema: configSchema,
};

export { DataSourceManagementPluginSetup, DataSourceManagementPluginStart } from './types';
