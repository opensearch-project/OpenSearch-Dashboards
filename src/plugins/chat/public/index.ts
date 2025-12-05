/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext } from '../../../core/public';
import { ChatPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

/**
 * @experimental This plugin is experimental and will change in future releases.
 */
export function plugin(initializerContext: PluginInitializerContext) {
  return new ChatPlugin(initializerContext);
}
export { ChatPluginSetup, ChatPluginStart } from './types';
export { ChatService } from './services/chat_service';
