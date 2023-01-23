/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext } from 'opensearch-dashboards/public';
import { SecurityPlugin } from './plugin';

export function plugin(initializerContext: PluginInitializerContext) {
  return new SecurityPlugin(initializerContext);
}

export { SecurityPluginSetup, SecurityPluginStart } from './types';
