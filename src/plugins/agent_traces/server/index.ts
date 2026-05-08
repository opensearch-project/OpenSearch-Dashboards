/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext } from '../../../core/server';
import { AgentTracesPlugin } from './plugin';

export function plugin(initializerContext: PluginInitializerContext) {
  return new AgentTracesPlugin(initializerContext);
}

export { AgentTracesPluginSetup, AgentTracesPluginStart } from './types';
