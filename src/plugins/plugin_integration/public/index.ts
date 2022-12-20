/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext } from 'src/core/public';
import { PluginIntegrationPlugin, PluginIntegrationSetup, PluginIntegrationStart } from './plugin';

export function plugin(initializerContext: PluginInitializerContext) {
  return new PluginIntegrationPlugin(initializerContext);
}
export { PluginIntegrationSetup, PluginIntegrationStart };
