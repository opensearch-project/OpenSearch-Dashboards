/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext } from 'opensearch-dashboards/public';
import './index.scss';

import { AgentTracesPlugin } from './plugin';

export {
  SavedAgentTraces,
  SavedAgentTracesLoader,
  createSavedAgentTracesLoader,
} from './saved_agent_traces';

export function plugin(initializerContext: PluginInitializerContext) {
  return new AgentTracesPlugin(initializerContext);
}

export { AgentTracesPluginSetup, AgentTracesPluginStart } from './types';

// Export trace auto-detection utilities for use by other plugins
export { detectTraceData, DetectionResult } from './utils/auto_detect_trace_data';
export { createAutoDetectedDatasets, CreateDatasetsResult } from './utils/create_auto_datasets';
