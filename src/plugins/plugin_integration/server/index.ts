/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext } from '../../../core/server';
import { PluginIntegrationPlugin } from './plugin';

export function plugin(initializerContext: PluginInitializerContext) {
  return new PluginIntegrationPlugin(initializerContext);
}
export { PluginIntegrationPluginSetup, PluginIntegrationPluginStart } from './plugin';
