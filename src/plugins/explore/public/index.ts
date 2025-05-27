/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext } from 'opensearch-dashboards/public';
import './index.scss';

import { ExplorePlugin } from './plugin';

export { ExploreStart } from './application/legacy/discover';
export { SavedExplore, SavedExploreLoader, createSavedExploreLoader } from './saved_explore';

export function plugin(initializerContext: PluginInitializerContext) {
  return new ExplorePlugin(initializerContext);
}
export { ExplorePluginSetup, ExplorePluginStart } from './types';
