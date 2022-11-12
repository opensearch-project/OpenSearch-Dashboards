/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// import { PluginInitializerContext } from 'opensearch-dashboards/public';
import { TableVisPlugin as Plugin } from './plugin';

export function plugin() {
  return new Plugin();
}
/* Public Types */
export { TableVisExpressionFunctionDefinition } from './table_vis_fn';
