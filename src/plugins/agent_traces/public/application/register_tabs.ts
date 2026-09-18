/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { TracesTab } from './pages/traces/traces_tab';
import { SpansTab } from './pages/traces/spans_tab';
import { VisTab } from './pages/traces/vis_tab';
import { SessionsTab } from './pages/traces/sessions_tab';
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

    prepareQuery: (query, sort) => {
      const baseQuery = defaultPrepareQueryString(query);
      const { whereQuery, tailCommands } = splitPplWhereAndTail(baseQuery);
      const sortClause = sort?.length ? ` ${buildPplSortClause(sort[0][0], sort[0][1])}` : '';
      return `${whereQuery} | where parentSpanId = "" AND isnotnull(\`attributes.gen_ai.operation.name\`) ${tailCommands}${sortClause}`;
    },

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

  // Register Sessions Tab
  // Derives conversations at query time from the same span dataset the page
  // already queries — no new index, no Data Prepper aggregation (v1). Filters to
  // gen_ai spans carrying a conversation id, then aggregates one row per
  // `gen_ai.conversation.id`. The aggregated columns map 1:1 to the session list.
  tabRegistry.registerTab({
    id: AGENT_TRACES_SESSIONS_TAB_ID,
    label: i18n.translate('agentTraces.sessionsTab.label', {
      defaultMessage: 'Sessions',
    }),
    flavor: [AgentTracesFlavor.Traces],
    order: 40,
    supportedLanguages: [AGENT_TRACES_DEFAULT_LANGUAGE],

    // The `sort` argument is intentionally ignored: it carries the shared,
    // span-level redux sort (`useTabResults` → `selectSort`; Traces defaults to
    // `[[timeField, 'desc']]`), whose fields do not exist after
    // `stats … by conversation.id`. Emitting it would produce a post-aggregation
    // `| sort - startTime` on an absent column ("field not found"). The session
    // list renders in an `EuiInMemoryTable` and sorts client-side, so no sort
    // clause is emitted here.
    prepareQuery: (query) => {
      const baseQuery = defaultPrepareQueryString(query);
      const { whereQuery, tailCommands } = splitPplWhereAndTail(baseQuery);
      // Only a row limit (`head`) is meaningful after the aggregation. Other tail
      // commands from the shared query bar (sort/dedup/eval) reference span-level
      // fields that no longer exist after `stats … by conversation.id`, so they
      // are dropped to avoid post-aggregation "field not found" errors.
      const headLimit = tailCommands
        .split(/\s*\|\s*/)
        .map((command) => command.trim())
        .filter((command) => /^head\b/i.test(command))
        .map((command) => `| ${command}`)
        .join(' ');
      return (
        `${whereQuery}` +
        ` | where isnotnull(\`attributes.gen_ai.conversation.id\`)` +
        ` | stats` +
        ` min(startTime) as session_start,` +
        ` max(endTime) as session_end,` +
        // Per-session span-latency percentiles surfaced as the list's P50/P99
        // columns (message-forward design). PPL-version fallback where
        // `percentile()` is unavailable: `pN(x)` (`p50()`/`p99()`).
        ` percentile(durationInNanos, 50) as p50_latency,` +
        ` percentile(durationInNanos, 99) as p99_latency,` +
        ` count() as span_count,` +
        ` dc(traceId) as trace_count,` +
        ` sum(\`attributes.gen_ai.usage.input_tokens\`) as input_tokens,` +
        ` sum(\`attributes.gen_ai.usage.output_tokens\`) as output_tokens,` +
        // Opening-exchange preview for the message-forward list columns: first
        // user message + first assistant response. `take(field, 1)` returns the
        // first non-null value in document order and is proven across the PPL
        // engines this tab targets (see the agent/model `take`s below). NB: on
        // the OS 3.9 PPL engine `latest()` returns the value on the temporally
        // last span of the session — typically a null-valued tool/chat span — so
        // it cannot surface a true "last assistant message"; a time-ordered
        // aggregation for that is deferred. Object-shaped values are projected to
        // text UI-side (see `previewText` in sessions_tab.tsx).
        ` take(\`attributes.gen_ai.input.messages\`, 1) as first_input,` +
        ` take(\`attributes.gen_ai.output.messages\`, 1) as first_output,` +
        ` sum(case(\`status.code\` = 'ERROR', 1 else 0)) as error_count,` +
        ` sum(case(parentSpanId = '', 1 else 0)) as turn_count,` +
        ` take(\`attributes.gen_ai.agent.id\`, 1) as agent_id,` +
        ` take(\`attributes.gen_ai.agent.name\`, 1) as agent_name,` +
        ` take(\`attributes.gen_ai.request.model\`, 1) as request_model,` +
        ` take(\`attributes.gen_ai.response.model\`, 1) as response_model,` +
        ` take(\`attributes.gen_ai.provider.name\`, 1) as provider_name` +
        ` by \`attributes.gen_ai.conversation.id\`` +
        (headLimit ? ` ${headLimit}` : '')
      );
    },

    component: SessionsTab,
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
