/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { registerBuiltInTabs } from './register_tabs';
import { TabRegistryService } from '../services/tab_registry/tab_registry_service';
import {
  ExploreFlavor,
  EXPLORE_LOGS_TAB_ID,
  EXPLORE_VISUALIZATION_TAB_ID,
  EXPLORE_STATISTICS_TAB_ID,
  EXPLORE_METRICS_EXPLORE_TAB_ID,
  EXPLORE_PATTERNS_TAB_ID,
} from '../../common';
import { ExploreServices } from '../types';

// Mock tab components to avoid React rendering during tests
jest.mock('../components/tabs/logs_tab', () => ({
  LogsTab: () => null,
}));
jest.mock('../components/tabs/metrics_tab', () => ({
  MetricsTab: () => null,
}));
jest.mock('./pages/metrics/explore', () => ({
  MetricsExploreTab: () => null,
}));
jest.mock('../components/tabs/metrics_vis_tab', () => ({
  MetricsVisTab: () => null,
}));
jest.mock('../components/tabs/field_stats_tab', () => ({
  FieldStatsTab: () => null,
}));
jest.mock('../components/tabs/vis_tab', () => ({
  VisTab: () => null,
}));
jest.mock('../components/tabs/patterns_tab', () => ({
  PatternsTab: () => null,
}));
jest.mock('../components/tabs/statistics_tab', () => ({
  StatisticsTab: () => null,
}));

// Mock i18n
jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: (key: string, options: { defaultMessage: string }) => options.defaultMessage,
  },
}));

const createMockServices = (experimentalEnabled = false): Partial<ExploreServices> => ({
  uiSettings: {
    get: jest.fn((key: string, defaultValue?: unknown) => {
      if (key === 'explore:experimental') return experimentalEnabled;
      return defaultValue;
    }),
  } as any,
  store: {
    getState: jest.fn().mockReturnValue({
      tab: { patterns: { patternsField: '', usingRegexPatterns: false } },
    }),
    dispatch: jest.fn(),
  } as any,
});

describe('registerBuiltInTabs - SQL Language Restrictions', () => {
  describe('Logs flavor', () => {
    let tabRegistry: TabRegistryService;

    beforeEach(() => {
      tabRegistry = new TabRegistryService();
      registerBuiltInTabs(tabRegistry, createMockServices() as ExploreServices, ExploreFlavor.Logs);
    });

    it('should include SQL in supported languages for the Logs tab', () => {
      const logsTab = tabRegistry.getTab(EXPLORE_LOGS_TAB_ID);

      expect(logsTab).toBeDefined();
      expect(logsTab?.supportedLanguages).toContain('SQL');
      expect(logsTab?.supportedLanguages).toContain('PPL');
    });

    it('should include SQL in supported languages for the Visualization tab', () => {
      const vizTab = tabRegistry.getTab(EXPLORE_VISUALIZATION_TAB_ID);

      expect(vizTab).toBeDefined();
      expect(vizTab?.supportedLanguages).toContain('SQL');
      expect(vizTab?.supportedLanguages).toContain('PPL');
    });

    it('should include SQL in supported languages for the Statistics tab', () => {
      const statsTab = tabRegistry.getTab(EXPLORE_STATISTICS_TAB_ID);

      expect(statsTab).toBeDefined();
      expect(statsTab?.supportedLanguages).toContain('SQL');
      expect(statsTab?.supportedLanguages).toContain('PPL');
    });
  });

  describe('Traces flavor', () => {
    let tabRegistry: TabRegistryService;

    beforeEach(() => {
      tabRegistry = new TabRegistryService();
      registerBuiltInTabs(
        tabRegistry,
        createMockServices() as ExploreServices,
        ExploreFlavor.Traces
      );
    });

    it('should NOT include SQL in supported languages for the Logs tab (Spans)', () => {
      const logsTab = tabRegistry.getTab(EXPLORE_LOGS_TAB_ID);

      expect(logsTab).toBeDefined();
      expect(logsTab?.supportedLanguages).not.toContain('SQL');
      expect(logsTab?.supportedLanguages).toContain('PPL');
    });

    it('should NOT include SQL in supported languages for the Visualization tab', () => {
      const vizTab = tabRegistry.getTab(EXPLORE_VISUALIZATION_TAB_ID);

      expect(vizTab).toBeDefined();
      expect(vizTab?.supportedLanguages).not.toContain('SQL');
      expect(vizTab?.supportedLanguages).toContain('PPL');
    });

    it('should label the Logs tab as "Spans" for Traces flavor', () => {
      const logsTab = tabRegistry.getTab(EXPLORE_LOGS_TAB_ID);

      expect(logsTab?.label).toBe('Spans');
    });
  });

  describe('Metrics flavor', () => {
    let tabRegistry: TabRegistryService;

    beforeEach(() => {
      tabRegistry = new TabRegistryService();
      registerBuiltInTabs(
        tabRegistry,
        createMockServices() as ExploreServices,
        ExploreFlavor.Metrics
      );
    });

    it('should NOT include SQL for the Metrics Explore tab', () => {
      const metricsExploreTab = tabRegistry.getTab(EXPLORE_METRICS_EXPLORE_TAB_ID);

      expect(metricsExploreTab).toBeDefined();
      expect(metricsExploreTab?.supportedLanguages).not.toContain('SQL');
      expect(metricsExploreTab?.supportedLanguages).toContain('PROMQL');
    });

    it('should NOT include SQL for the metrics table tab', () => {
      const metricsTab = tabRegistry.getTab('metrics');

      expect(metricsTab).toBeDefined();
      expect(metricsTab?.supportedLanguages).not.toContain('SQL');
      expect(metricsTab?.supportedLanguages).toContain('PROMQL');
    });

    it('should NOT include SQL for the Visualization tab in Metrics flavor', () => {
      const vizTab = tabRegistry.getTab(EXPLORE_VISUALIZATION_TAB_ID);

      expect(vizTab).toBeDefined();
      expect(vizTab?.supportedLanguages).not.toContain('SQL');
      expect(vizTab?.supportedLanguages).toContain('PROMQL');
    });

    it('should NOT register the Logs tab for Metrics flavor', () => {
      const logsTab = tabRegistry.getTab(EXPLORE_LOGS_TAB_ID);

      expect(logsTab).toBeUndefined();
    });

    it('should register Statistics tab scoped to Logs flavor only', () => {
      // Statistics tab is registered for all non-metrics flavors but its `flavor` array
      // restricts it to Logs - consumers filter by flavor, so it won't appear in metrics UI
      const statsTab = tabRegistry.getTab(EXPLORE_STATISTICS_TAB_ID);

      expect(statsTab?.flavor).toEqual([ExploreFlavor.Logs]);
      expect(statsTab?.flavor).not.toContain(ExploreFlavor.Metrics);
    });
  });

  describe('Cross-flavor SQL availability summary', () => {
    /**
     * SQL availability is determined by combining:
     * 1. Tabs that match the flavor (via tab.flavor array)
     * 2. Tabs whose supportedLanguages includes 'SQL'
     */
    const getSqlEnabledTabsForFlavor = (flavor: ExploreFlavor) => {
      const tabRegistry = new TabRegistryService();
      registerBuiltInTabs(tabRegistry, createMockServices() as ExploreServices, flavor);
      return tabRegistry
        .getAllTabs()
        .filter((tab) => tab.flavor.includes(flavor) && tab.supportedLanguages.includes('SQL'));
    };

    it('should have SQL-enabled tabs for Logs flavor', () => {
      const sqlTabs = getSqlEnabledTabsForFlavor(ExploreFlavor.Logs);
      expect(sqlTabs.length).toBeGreaterThan(0);
    });

    it('should have NO SQL-enabled tabs for Traces flavor', () => {
      const sqlTabs = getSqlEnabledTabsForFlavor(ExploreFlavor.Traces);
      expect(sqlTabs.length).toBe(0);
    });

    it('should have NO SQL-enabled tabs for Metrics flavor', () => {
      const sqlTabs = getSqlEnabledTabsForFlavor(ExploreFlavor.Metrics);
      expect(sqlTabs.length).toBe(0);
    });
  });
});

describe('registerBuiltInTabs - patterns prepareQuery when the patterns field is unknown', () => {
  // Reproduces the post-refresh state: `resultsCache` is in-memory only, so after a
  // page reload the logs tab has no cached results and `findDefaultPatternsField`
  // throws. `state.tab.patterns.patternsField` is likewise empty because it is not
  // persisted to the URL.
  const registerPatternsTab = () => {
    const tabRegistry = new TabRegistryService();
    const services = {
      uiSettings: {
        get: jest.fn((key: string) => key === 'explore:experimental'),
      },
      store: {
        getState: jest.fn().mockReturnValue({
          tab: { patterns: { patternsField: '', usingRegexPatterns: false } },
          query: { language: 'PPL' },
        }),
        dispatch: jest.fn(),
      },
      // No logs results cached => findDefaultPatternsField throws.
      tabRegistry,
    } as unknown as ExploreServices;
    registerBuiltInTabs(tabRegistry, services, ExploreFlavor.Logs);
    return tabRegistry.getTab(EXPLORE_PATTERNS_TAB_ID)!;
  };

  it('does not fall back to executing the raw user query', () => {
    const patternsTab = registerPatternsTab();
    const userQuery = { query: 'source = my_index', language: 'PPL' } as any;

    const prepared = patternsTab.prepareQuery!(userQuery);

    // Returning the user's own query makes the patterns tab execute a plain search
    // under its own cache key; the container then reads raw documents through the
    // patterns column mapping, and the fixed PPL field names match nothing.
    expect(prepared).not.toBe('source = my_index');
  });

  // The other throw in findDefaultPatternsField: logs hits are present but none of
  // the fields is string-typed. Same catch, so the tab reports itself unbuildable
  // and ErrorGuard renders the field picker instead of a blank panel.
  it('produces no query when logs results exist but hold no string field', () => {
    const tabRegistry = new TabRegistryService();
    const services = {
      uiSettings: { get: jest.fn((key: string) => key === 'explore:experimental') },
      store: {
        getState: jest.fn().mockReturnValue({
          tab: { patterns: { patternsField: '', usingRegexPatterns: false } },
          query: { language: 'PPL' },
        }),
        dispatch: jest.fn(),
      },
      tabRegistry,
    } as unknown as ExploreServices;
    registerBuiltInTabs(tabRegistry, services, ExploreFlavor.Logs);
    const patternsTab = tabRegistry.getTab(EXPLORE_PATTERNS_TAB_ID)!;

    expect(patternsTab.prepareQuery!({ query: 'source = my_index', language: 'PPL' } as any)).toBe(
      ''
    );
  });

  it('produces no query at all rather than a wrong one', () => {
    const patternsTab = registerPatternsTab();
    const prepared = patternsTab.prepareQuery!({
      query: 'source = my_index',
      language: 'PPL',
    } as any);

    expect(prepared).toBe('');
  });
});
