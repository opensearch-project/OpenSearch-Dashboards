/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext } from '../../../src/core/public';
import { VisualizationExamplesPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, the plugin initialization function
export function plugin(initializerContext: PluginInitializerContext) {
  return new VisualizationExamplesPlugin();
}

export { VisualizationExamplesPlugin };
