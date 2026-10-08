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

// Re-export trace auto-detection utilities from explore (single source of truth)
export { detectTraceData, DetectionResult } from '../../explore/public';
