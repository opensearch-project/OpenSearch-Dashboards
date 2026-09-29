/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { TracesTab } from './pages/traces/traces_tab';
import { SpansTab } from './pages/traces/spans_tab';
import { VisTab } from './pages/traces/vis_tab';
import { SessionsTab } from './pages/sessions/sessions_tab';
import { SESSION_FACET_FIELDS } from './pages/sessions/session_utils';
import { sessionFacetBuckets$ } from './pages/sessions/session_facets';
import { TabDefinition, TabRegistryService } from '../services/tab_registry/tab_registry_service';
import { AgentTracesServices } from '../types';
import {
  AgentTracesFlavor,
  AGENT_TRACES_DEFAULT_LANGUAGE,
  AGENT_TRACES_TRACES_TAB_ID,
  AGENT_TRACES_SPANS_TAB_ID,
  AGENT_TRACES_VISUALIZATION_TAB_ID,
  AGENT_TRACES_SESSIONS_TAB_ID,
} from '../../common';
import { defaultPrepareQueryString } from './utils/state_management/actions/query_actions';
import { buildPplSortClause, splitPplWhereAndTail } from './pages/traces/table_shared';
import { prepareQueryForLanguage } from './utils/languages';

/** Root agent spans (one per trace). Shared by Traces and Sessions so they share a cache key. */
const prepareRootSpansQuery: NonNullable<TabDefinition['prepareQuery']> = (query, sort) => {
  const baseQuery = defaultPrepareQueryString(query);
  const { whereQuery, tailCommands } = splitPplWhereAndTail(baseQuery);
  const sortClause = sort?.length ? ` ${buildPplSortClause(sort[0][0], sort[0][1])}` : '';
  return `${whereQuery} | where parentSpanId = "" AND isnotnull(\`attributes.gen_ai.operation.name\`) ${tailCommands}${sortClause}`;
};

/**
 * Registers built-in tabs with the tab registry
 * Agent Traces only supports Traces
 */
export const registerBuiltInTabs = (tabRegistry: TabRegistryService) => {
  // Register Traces Tab
  const tracesTabDefinition: TabDefinition = {
    id: AGENT_TRACES_TRACES_TAB_ID,
    label: i18n.translate('agentTraces.tracesTab.label', {
      defaultMessage: 'Traces',
    }),
    flavor: [AgentTracesFlavor.Traces],
    order: 10,
    supportedLanguages: [AGENT_TRACES_DEFAULT_LANGUAGE],

    prepareQuery: prepareRootSpansQuery,

    component: TracesTab,
  };
  tabRegistry.registerTab(tracesTabDefinition);

  // Register Spans Tab
  const spansTabDefinition: TabDefinition = {
    id: AGENT_TRACES_SPANS_TAB_ID,
    label: i18n.translate('agentTraces.spansTab.label', {
      defaultMessage: 'Spans',
    }),
    flavor: [AgentTracesFlavor.Traces],
    order: 20,
    supportedLanguages: [AGENT_TRACES_DEFAULT_LANGUAGE],

    // Filter to all gen_ai spans (not just root spans)
    prepareQuery: (query, sort) => {
      const baseQuery = defaultPrepareQueryString(query);
      const { whereQuery, tailCommands } = splitPplWhereAndTail(baseQuery);
      const sortClause = sort?.length ? ` ${buildPplSortClause(sort[0][0], sort[0][1])}` : '';
      return `${whereQuery} | where isnotnull(\`attributes.gen_ai.operation.name\`) ${tailCommands}${sortClause}`;
    },

    component: SpansTab,
  };
  tabRegistry.registerTab(spansTabDefinition);

  // Register Sessions Tab: traces grouped by gen_ai.conversation.id.
  // The sessions list itself comes from its own stats queries (see use_sessions.ts). The
  // root-span prepareQuery (same cache key as Traces) feeds the fields panel so facet
  // filters work; a facet filter narrows sessions to those containing matching traces.
  tabRegistry.registerTab({
    id: AGENT_TRACES_SESSIONS_TAB_ID,
    label: i18n.translate('agentTraces.sessionsTab.label', {
      defaultMessage: 'Sessions',
    }),
    flavor: [AgentTracesFlavor.Traces],
    order: 25,
    supportedLanguages: [AGENT_TRACES_DEFAULT_LANGUAGE],
    prepareQuery: prepareRootSpansQuery,
    facetFields: SESSION_FACET_FIELDS,
    facetBuckets$: sessionFacetBuckets$,
    fixedColumns: true,
    component: SessionsTab,
  });

  // Register Visualization Tab
  tabRegistry.registerTab({
    id: AGENT_TRACES_VISUALIZATION_TAB_ID,
    label: i18n.translate('agentTraces.visualizationTab.label', {
      defaultMessage: 'Visualization',
    }),
    flavor: [AgentTracesFlavor.Traces],
    order: 30,
    supportedLanguages: [AGENT_TRACES_DEFAULT_LANGUAGE],

    prepareQuery: (query) => {
      return prepareQueryForLanguage(query).query;
    },

    component: VisTab,
  });
};

/**
 * Register tabs in the application
 * This is the main entry point for tab registration
 */
export const registerTabs = (services: AgentTracesServices) => {
  // Register built-in tabs
  registerBuiltInTabs(services.tabRegistry);

  // Register plugin-provided tabs
  const pluginTabs = (services as any).plugins?.agentTraces?.getTabs?.() || [];

  pluginTabs.forEach(
    (tabDefinition: import('../services/tab_registry/tab_registry_service').TabDefinition) => {
      services.tabRegistry.registerTab(tabDefinition);
    }
  );
};
