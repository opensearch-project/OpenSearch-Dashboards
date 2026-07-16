/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext } from 'opensearch-dashboards/public';
import './index.scss';

import { ExplorePlugin } from './plugin';

export { SavedExplore, SavedExploreLoader, createSavedExploreLoader } from './saved_explore';

// PPL query utilities for use by other plugins
export { addPPLSourceClause } from './application/utils/languages/ppl/get_query_string_with_source';
export type { QueryWithQueryAsString } from './application/utils/languages/types';

export function plugin(initializerContext: PluginInitializerContext) {
  return new ExplorePlugin(initializerContext);
}

export { ExplorePluginSetup, ExplorePluginStart, ExploreServices } from './types';

// Export trace auto-detection utilities for use by other plugins
export { detectTraceData, DetectionResult } from './utils/auto_detect_trace_data';
export { createAutoDetectedDatasets, CreateDatasetsResult } from './utils/create_auto_datasets';

// Visualization system for use by other plugins
export { VisualizationBuilder } from './components/visualizations/visualization_builder';
export type { AxisColumnMappings } from './components/visualizations/types';
