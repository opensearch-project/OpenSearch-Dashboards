/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginConfigDescriptor, PluginInitializerContext } from '../../../core/server';
import { ChatPlugin } from './plugin';
import { configSchema, ChatConfigType } from './config';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export const config: PluginConfigDescriptor<ChatConfigType> = {
  schema: configSchema,
  exposeToBrowser: {
    agUiUrl: true,
  },
};

export function plugin(initializerContext: PluginInitializerContext) {
  return new ChatPlugin(initializerContext);
}

export { ChatPluginSetup, ChatPluginStart } from './types';
