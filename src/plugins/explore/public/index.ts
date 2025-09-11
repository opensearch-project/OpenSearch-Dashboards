/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { ExplorePlugin } from './plugin';

// This exports the plugin for OpenSearch Dashboards to load
export function plugin(initializerContext: any) {
  return new ExplorePlugin(initializerContext);
}

export { ExplorePlugin };
export * from './types';
export { formatExploreContext } from './services/context_formatter';
