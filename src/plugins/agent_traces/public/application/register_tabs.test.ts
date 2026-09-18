/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TabRegistryService } from '../services/tab_registry/tab_registry_service';
import { registerBuiltInTabs, registerTabs } from './register_tabs';
import {
  AGENT_TRACES_TRACES_TAB_ID,
  AGENT_TRACES_SPANS_TAB_ID,
  AGENT_TRACES_VISUALIZATION_TAB_ID,
  AGENT_TRACES_SESSIONS_TAB_ID,
  AGENT_TRACES_DEFAULT_LANGUAGE,
  AgentTracesFlavor,
} from '../../common';

jest.mock('./pages/traces/traces_tab', () => ({
  TracesTab: () => null,
}));
jest.mock('./pages/traces/spans_tab', () => ({
  SpansTab: () => null,
}));
jest.mock('./pages/traces/vis_tab', () => ({
  VisTab: () => null,
}));
jest.mock('./pages/traces/sessions_tab', () => ({
  SessionsTab: () => null,
}));

describe('registerBuiltInTabs', () => {
  let tabRegistry: TabRegistryService;

  beforeEach(() => {
    tabRegistry = new TabRegistryService();
  });

  it('should register four tabs', () => {
    registerBuiltInTabs(tabRegistry);
    const tabs = tabRegistry.getAllTabs();
    expect(tabs).toHaveLength(4);
  });

  it('should register tabs with correct IDs', () => {
    registerBuiltInTabs(tabRegistry);
    expect(tabRegistry.getTab(AGENT_TRACES_TRACES_TAB_ID)).toBeDefined();
    expect(tabRegistry.getTab(AGENT_TRACES_SPANS_TAB_ID)).toBeDefined();
    expect(tabRegistry.getTab(AGENT_TRACES_VISUALIZATION_TAB_ID)).toBeDefined();
    expect(tabRegistry.getTab(AGENT_TRACES_SESSIONS_TAB_ID)).toBeDefined();
  });

  it('should register tabs in order: Traces, Spans, Visualization, Sessions', () => {
    registerBuiltInTabs(tabRegistry);
    const tabs = tabRegistry.getAllTabs();
    expect(tabs[0].id).toBe(AGENT_TRACES_TRACES_TAB_ID);
    expect(tabs[1].id).toBe(AGENT_TRACES_SPANS_TAB_ID);
    expect(tabs[2].id).toBe(AGENT_TRACES_VISUALIZATION_TAB_ID);
    expect(tabs[3].id).toBe(AGENT_TRACES_SESSIONS_TAB_ID);
  });

  it('should assign order 40 to the Sessions tab', () => {
    registerBuiltInTabs(tabRegistry);
    expect(tabRegistry.getTab(AGENT_TRACES_SESSIONS_TAB_ID)!.order).toBe(40);
  });

  it('should set correct labels', () => {
    registerBuiltInTabs(tabRegistry);
    expect(tabRegistry.getTab(AGENT_TRACES_TRACES_TAB_ID)!.label).toBe('Traces');
    expect(tabRegistry.getTab(AGENT_TRACES_SPANS_TAB_ID)!.label).toBe('Spans');
    expect(tabRegistry.getTab(AGENT_TRACES_VISUALIZATION_TAB_ID)!.label).toBe('Visualization');
    expect(tabRegistry.getTab(AGENT_TRACES_SESSIONS_TAB_ID)!.label).toBe('Sessions');
  });

  it('should assign Traces flavor to all tabs', () => {
    registerBuiltInTabs(tabRegistry);
    const tabs = tabRegistry.getAllTabs();
    tabs.forEach((tab) => {
      expect(tab.flavor).toEqual([AgentTracesFlavor.Traces]);
    });
  });

  it('should set PPL as supported language for all tabs', () => {
    registerBuiltInTabs(tabRegistry);
    const tabs = tabRegistry.getAllTabs();
    tabs.forEach((tab) => {
      expect(tab.supportedLanguages).toEqual([AGENT_TRACES_DEFAULT_LANGUAGE]);
    });
  });

  describe('Traces tab prepareQuery', () => {
    const baseQuery = { language: 'PPL', query: 'source = idx', dataset: { id: 'idx' } } as any;

    it('should filter for root spans with gen_ai attribute', () => {
      registerBuiltInTabs(tabRegistry);
      const tab = tabRegistry.getTab(AGENT_TRACES_TRACES_TAB_ID)!;
      const result = tab.prepareQuery!(baseQuery);
      expect(result).toContain('parentSpanId = ""');
      expect(result).toContain('isnotnull(`attributes.gen_ai.operation.name`)');
    });

    it('should append sort clause when sort is provided', () => {
      registerBuiltInTabs(tabRegistry);
      const tab = tabRegistry.getTab(AGENT_TRACES_TRACES_TAB_ID)!;
      const result = tab.prepareQuery!(baseQuery, [['name', 'asc']]);
      expect(result).toContain('| sort name');
    });

    it('should not append sort clause when sort is empty', () => {
      registerBuiltInTabs(tabRegistry);
      const tab = tabRegistry.getTab(AGENT_TRACES_TRACES_TAB_ID)!;
      const result = tab.prepareQuery!(baseQuery, []);
      expect(result).not.toContain('| sort');
    });
  });

  describe('Spans tab prepareQuery', () => {
    const baseQuery = { language: 'PPL', query: 'source = idx', dataset: { id: 'idx' } } as any;

    it('should filter for gen_ai spans without parentSpanId filter', () => {
      registerBuiltInTabs(tabRegistry);
      const tab = tabRegistry.getTab(AGENT_TRACES_SPANS_TAB_ID)!;
      const result = tab.prepareQuery!(baseQuery);
      expect(result).toContain('isnotnull(`attributes.gen_ai.operation.name`)');
      expect(result).not.toContain('parentSpanId');
    });

    it('should append sort clause when sort is provided', () => {
      registerBuiltInTabs(tabRegistry);
      const tab = tabRegistry.getTab(AGENT_TRACES_SPANS_TAB_ID)!;
      const result = tab.prepareQuery!(baseQuery, [['latency', 'desc']]);
      expect(result).toContain('| sort - durationInNanos');
    });
  });

  describe('Visualization tab prepareQuery', () => {
    const statsQuery = {
      language: 'PPL',
      query: 'source = idx | stats count() by field',
      dataset: { id: 'idx' },
    } as any;

    it('should return prepared query string', () => {
      registerBuiltInTabs(tabRegistry);
      const tab = tabRegistry.getTab(AGENT_TRACES_VISUALIZATION_TAB_ID)!;
      const result = tab.prepareQuery!(statsQuery);
      expect(typeof result).toBe('string');
      expect(result).toContain('source');
    });
  });

  describe('Sessions tab prepareQuery', () => {
    const baseQuery = { language: 'PPL', query: 'source = idx', dataset: { id: 'idx' } } as any;

    it('should filter to spans that carry a conversation id and aggregate by it', () => {
      registerBuiltInTabs(tabRegistry);
      const tab = tabRegistry.getTab(AGENT_TRACES_SESSIONS_TAB_ID)!;
      const result = tab.prepareQuery!(baseQuery);
      expect(result).toContain('isnotnull(`attributes.gen_ai.conversation.id`)');
      expect(result).toContain('| stats');
      expect(result).toContain('by `attributes.gen_ai.conversation.id`');
    });

    it('should never emit a sort clause even when a session-level sort is provided', () => {
      // The session list renders in an EuiInMemoryTable and sorts client-side, so
      // no `sort` clause is emitted regardless of the sort argument. `session_start`
      // is an aggregated output column, so a naive emit would look valid but the
      // sort argument is actually the span-level redux sort (see below).
      registerBuiltInTabs(tabRegistry);
      const tab = tabRegistry.getTab(AGENT_TRACES_SESSIONS_TAB_ID)!;
      const result = tab.prepareQuery!(baseQuery, [['session_start', 'desc']]);
      expect(result).not.toContain('| sort');
    });

    it('should not emit a span-level sort passed via the sort parameter', () => {
      // Regression guard: `useTabResults` calls prepareQuery with the shared,
      // span-level redux sort (Traces defaults to `[[timeField, 'desc']]`). Those
      // fields do not exist after `stats … by conversation.id`; emitting them
      // produces a post-aggregation "field not found". Assert the parameter is
      // ignored rather than appended.
      registerBuiltInTabs(tabRegistry);
      const tab = tabRegistry.getTab(AGENT_TRACES_SESSIONS_TAB_ID)!;
      const result = tab.prepareQuery!(baseQuery, [['startTime', 'desc']]);
      expect(result).toContain('| stats');
      expect(result).not.toContain('| sort');
      expect(result).not.toContain('startTime desc');
    });

    it('should not append sort clause when sort is empty', () => {
      registerBuiltInTabs(tabRegistry);
      const tab = tabRegistry.getTab(AGENT_TRACES_SESSIONS_TAB_ID)!;
      const result = tab.prepareQuery!(baseQuery, []);
      expect(result).not.toContain('| sort');
    });

    it('should drop span-level tail commands that do not survive the aggregation', () => {
      // A span-level sort/dedup carried over from the shared query bar would
      // reference fields that no longer exist after `stats … by conversation.id`.
      const withSpanSort = {
        language: 'PPL',
        query: 'source = idx | sort - startTime | dedup traceId',
        dataset: { id: 'idx' },
      } as any;
      registerBuiltInTabs(tabRegistry);
      const tab = tabRegistry.getTab(AGENT_TRACES_SESSIONS_TAB_ID)!;
      const result = tab.prepareQuery!(withSpanSort);
      expect(result).toContain('| stats');
      // `min(startTime)` is expected; the dropped span-level sort would appear as
      // `| sort - startTime`, so assert the sort form and dedup are gone.
      expect(result).not.toContain('| sort - startTime');
      expect(result).not.toContain('dedup');
    });

    it('should preserve a head row-limit after the aggregation', () => {
      const withHead = {
        language: 'PPL',
        query: 'source = idx | head 100',
        dataset: { id: 'idx' },
      } as any;
      registerBuiltInTabs(tabRegistry);
      const tab = tabRegistry.getTab(AGENT_TRACES_SESSIONS_TAB_ID)!;
      const result = tab.prepareQuery!(withHead, [['session_start', 'desc']]);
      // The head limit is preserved after the aggregation; no sort is emitted.
      expect(result).toContain('| head 100');
      expect(result.indexOf('| stats')).toBeLessThan(result.indexOf('| head 100'));
      expect(result).not.toContain('| sort');
    });
  });
});

describe('registerTabs', () => {
  it('should register built-in tabs and plugin-provided tabs', () => {
    const tabRegistry = new TabRegistryService();
    const mockPluginTab = {
      id: 'custom_tab',
      label: 'Custom',
      flavor: [AgentTracesFlavor.Traces],
      supportedLanguages: ['PPL'],
      component: () => null,
    };

    const services = {
      tabRegistry,
      plugins: {
        agentTraces: {
          getTabs: () => [mockPluginTab],
        },
      },
    } as any;

    registerTabs(services);

    expect(tabRegistry.getAllTabs()).toHaveLength(5);
    expect(tabRegistry.getTab('custom_tab')).toBeDefined();
  });

  it('should handle missing plugin tabs gracefully', () => {
    const tabRegistry = new TabRegistryService();
    const services = { tabRegistry } as any;

    registerTabs(services);

    expect(tabRegistry.getAllTabs()).toHaveLength(4);
  });
});
