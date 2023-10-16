/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginConfigDescriptor, PluginInitializerContext } from '../../../core/server';
import { ConfigSchema, configSchema } from '../config';
import { VisBuilderPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as the OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new VisBuilderPlugin(initializerContext);
}

export { VisBuilderPluginSetup, VisBuilderPluginStart } from './types';

export const config: PluginConfigDescriptor<ConfigSchema> = {
  schema: configSchema,
};
