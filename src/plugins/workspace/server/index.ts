/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginConfigDescriptor, PluginInitializerContext } from '../../../core/server';
import { WorkspacePlugin } from './plugin';
import { configSchema } from '../config';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new WorkspacePlugin(initializerContext);
}

export const config: PluginConfigDescriptor = {
  schema: configSchema,
};

export { WorkspaceFindOptions } from './types';
