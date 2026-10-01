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

// Extension points for external data sources
export type {
  SourceTypeDatasetSelectorProps,
  SourceTypeDefinition,
  SourceTypeDependencies,
  SourceTypeLanguageSettings,
  SourceTypeRegistrySetup,
} from './services/source_type_registry';
export {
  ExploreFlavor,
  EXPLORE_LOGS_TAB_ID,
  EXPLORE_STATISTICS_TAB_ID,
  EXPLORE_VISUALIZATION_TAB_ID,
} from '../common';

// Export trace auto-detection utilities for use by other plugins
export {
  detectTraceData,
  detectTraceDataAcrossDataSources,
  collectTraceDataSourceIds,
  DetectionResult,
} from './utils/auto_detect_trace_data';
export {
  getIndexPatternSignalTypes,
  IndexPatternSignalType,
} from './utils/get_index_pattern_signal_types';
export { createAutoDetectedDatasets, CreateDatasetsResult } from './utils/create_auto_datasets';

// Visualization system for use by other plugins
export { VisualizationBuilder } from './components/visualizations/visualization_builder';
export type { AxisColumnMappings } from './components/visualizations/types';

// Trace-to-logs correlation (correlations saved objects) and its log views, for Agent Traces
export { CorrelationService } from './application/pages/traces/trace_details/public/logs/correlation_service';
export { TraceLogsTab } from './application/pages/traces/trace_details/public/logs/trace_logs_tab';
export { SpanLogsTab } from './application/pages/traces/trace_details/public/logs/span_logs_tab';
export { filterLogsBySpanId } from './application/pages/traces/trace_details/public/logs/url_builder';
export type { LogHit } from './application/pages/traces/trace_details/server/ppl_request_logs';
