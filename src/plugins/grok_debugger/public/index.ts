/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext } from 'opensearch-dashboards/public';
import { GrokDebuggerPlugin } from './plugin';

export function plugin(_initializerContext: PluginInitializerContext) {
  return new GrokDebuggerPlugin();
}
