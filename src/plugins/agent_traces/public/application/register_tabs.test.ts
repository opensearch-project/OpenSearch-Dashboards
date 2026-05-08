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

describe('registerBuiltInTabs', () => {
  let tabRegistry: TabRegistryService;

  beforeEach(() => {
    tabRegistry = new TabRegistryService();
  });

  it('should register three tabs', () => {
    registerBuiltInTabs(tabRegistry);
    const tabs = tabRegistry.getAllTabs();
    expect(tabs).toHaveLength(3);
  });

  it('should register tabs with correct IDs', () => {
    registerBuiltInTabs(tabRegistry);
    expect(tabRegistry.getTab(AGENT_TRACES_TRACES_TAB_ID)).toBeDefined();
    expect(tabRegistry.getTab(AGENT_TRACES_SPANS_TAB_ID)).toBeDefined();
    expect(tabRegistry.getTab(AGENT_TRACES_VISUALIZATION_TAB_ID)).toBeDefined();
  });

  it('should register tabs in order: Traces, Spans, Visualization', () => {
    registerBuiltInTabs(tabRegistry);
    const tabs = tabRegistry.getAllTabs();
    expect(tabs[0].id).toBe(AGENT_TRACES_TRACES_TAB_ID);
    expect(tabs[1].id).toBe(AGENT_TRACES_SPANS_TAB_ID);
    expect(tabs[2].id).toBe(AGENT_TRACES_VISUALIZATION_TAB_ID);
  });

  it('should set correct labels', () => {
    registerBuiltInTabs(tabRegistry);
    expect(tabRegistry.getTab(AGENT_TRACES_TRACES_TAB_ID)!.label).toBe('Traces');
    expect(tabRegistry.getTab(AGENT_TRACES_SPANS_TAB_ID)!.label).toBe('Spans');
    expect(tabRegistry.getTab(AGENT_TRACES_VISUALIZATION_TAB_ID)!.label).toBe('Visualization');
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

    expect(tabRegistry.getAllTabs()).toHaveLength(4);
    expect(tabRegistry.getTab('custom_tab')).toBeDefined();
  });

  it('should handle missing plugin tabs gracefully', () => {
    const tabRegistry = new TabRegistryService();
    const services = { tabRegistry } as any;

    registerTabs(services);

    expect(tabRegistry.getAllTabs()).toHaveLength(3);
  });
});
