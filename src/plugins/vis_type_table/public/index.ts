/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext } from 'opensearch-dashboards/public';
import { TableVisPlugin as Plugin } from './plugin';

export function plugin(initializerContext: PluginInitializerContext) {
  return new Plugin(initializerContext);
}

/* Public Types */
export { TableVisExpressionFunctionDefinition } from './table_vis_fn';
