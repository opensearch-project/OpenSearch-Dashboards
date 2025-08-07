/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LogsTab } from '../components/tabs/logs_tab';
import { SpansTab } from '../components/tabs/spans_tab';
import { TabRegistryService } from '../services/tab_registry/tab_registry_service';
import { PatternsTab } from '../components/tabs/patterns_tab';
import { ExploreServices } from '../types';
import { EXPLORE_DEFAULT_LANGUAGE, ExploreFlavor } from '../../common';
import { VisTab } from '../components/tabs/vis_tab';
import { getQueryWithSource } from './utils/languages';
import { setUsingRegexPatterns } from './utils/state_management/slices/tab/tab_slice';
import {
  brainPatternQuery,
  findDefaultPatternsField,
  regexPatternQuery,
} from '../components/patterns_table/utils/utils';
import { executeTabQuery } from './utils/state_management/actions/query_actions';
import { QueryExecutionStatus } from './utils/state_management/types';
import { BRAIN_QUERY_OLD_ENGINE_ERROR_PREFIX } from '../components/patterns_table/utils/constants';
import { setIndividualQueryStatus } from './utils/state_management/slices';

interface TabConfig {
  id: string;
  label: string;
  order: number;
  component: any;
  supportedLanguages: string[];
  // Empty array means all flavors)
  includeFlavors?: ExploreFlavor[];
  excludeFlavors?: ExploreFlavor[];
  prepareQuery?: (query: any, services: ExploreServices) => string;
  handleQueryError?: (error: any, cacheKey: string, services: ExploreServices) => boolean;
}

/**
 * Tab configurations for different flavors
 */
const TAB_CONFIGURATIONS: TabConfig[] = [
  // Logs Tab - shown for all flavors except traces
  {
    id: 'logs',
    label: 'Logs',
    order: 10,
    component: LogsTab,
    supportedLanguages: [EXPLORE_DEFAULT_LANGUAGE],
    excludeFlavors: [ExploreFlavor.Traces],
  },

  // Spans Tab - only shown for traces flavor
  {
    id: 'spans',
    label: 'Spans',
    order: 10,
    component: SpansTab,
    supportedLanguages: [EXPLORE_DEFAULT_LANGUAGE],
    includeFlavors: [ExploreFlavor.Traces],
  },

  // Patterns Tab - shown for all flavors except traces
  {
    id: 'explore_patterns_tab',
    label: 'Patterns',
    order: 15,
    component: PatternsTab,
    supportedLanguages: [EXPLORE_DEFAULT_LANGUAGE],
    excludeFlavors: [ExploreFlavor.Traces],
    prepareQuery: (query, services) => {
      const state = services.store.getState();
      let patternsField = state.tab.patterns.patternsField;
      const preparedQuery = getQueryWithSource(query);

      if (!patternsField) {
        patternsField = findDefaultPatternsField(services);
      }

      if (state.tab.patterns.usingRegexPatterns)
        return regexPatternQuery(preparedQuery.query, patternsField);

      return brainPatternQuery(preparedQuery.query, patternsField);
    },
    handleQueryError: (error, cacheKey, services) => {
      const state = services.store.getState();

      if (
        error &&
        error.status &&
        error.status === 400 &&
        error.error.details &&
        error.error.details.startsWith(BRAIN_QUERY_OLD_ENGINE_ERROR_PREFIX)
      ) {
        let patternsField = state.tab.patterns.patternsField;
        if (!patternsField) {
          patternsField = findDefaultPatternsField(services);
        }
        const query = state.query;
        const preparedQuery = getQueryWithSource(query);
        services.store.dispatch(setUsingRegexPatterns(true));
        services.store.dispatch(
          executeTabQuery({
            services,
            cacheKey: regexPatternQuery(preparedQuery.query, patternsField),
          })
        );

        services.store.dispatch(
          setIndividualQueryStatus({
            cacheKey,
            status: {
              status: QueryExecutionStatus.UNINITIALIZED,
              startTime: undefined,
              elapsedMs: undefined,
              error: undefined,
            },
          })
        );

        return true;
      }

      return false;
    },
  },

  // Visualization Tab - shown for all flavors
  {
    id: 'explore_visualization_tab',
    label: 'Visualization',
    order: 20,
    component: VisTab,
    supportedLanguages: [EXPLORE_DEFAULT_LANGUAGE],
    prepareQuery: (query) => {
      const preparedQuery = getQueryWithSource(query);
      return preparedQuery.query;
    },
  },
];

/**
 * Check if a tab should be shown for the given flavor
 */
const shouldShowTab = (tabConfig: TabConfig, flavor?: ExploreFlavor): boolean => {
  // If includeFlavors is specified, only show for those flavors
  if (tabConfig.includeFlavors && tabConfig.includeFlavors.length > 0) {
    return flavor ? tabConfig.includeFlavors.includes(flavor) : false;
  }

  // If excludeFlavors is specified, hide for those flavors
  if (tabConfig.excludeFlavors && tabConfig.excludeFlavors.length > 0) {
    return flavor ? !tabConfig.excludeFlavors.includes(flavor) : true;
  }

  // Default: show for all flavors
  return true;
};

/**
 * Registers built-in tabs with the tab registry
 */
export const registerBuiltInTabs = (
  tabRegistry: TabRegistryService,
  services: ExploreServices,
  flavor?: ExploreFlavor
) => {
  TAB_CONFIGURATIONS.filter((tabConfig) => shouldShowTab(tabConfig, flavor)).forEach(
    (tabConfig) => {
      const tabDefinition: any = {
        id: tabConfig.id,
        label: tabConfig.label,
        flavor: [],
        order: tabConfig.order,
        supportedLanguages: tabConfig.supportedLanguages,
        component: tabConfig.component,
      };

      // Add custom query preparation if provided
      if (tabConfig.prepareQuery) {
        tabDefinition.prepareQuery = (query: any) => tabConfig.prepareQuery!(query, services);
      }

      // Add custom error handling if provided
      if (tabConfig.handleQueryError) {
        tabDefinition.handleQueryError = (error: any, cacheKey: string) =>
          tabConfig.handleQueryError!(error, cacheKey, services);
      }

      tabRegistry.registerTab(tabDefinition);
    }
  );
};

/**
 * Register tabs in the application
 * This is the main entry point for tab registration
 */
export const registerTabs = (services: ExploreServices, flavor?: ExploreFlavor) => {
  // If no flavor is provided, try to detect it from the URL as fallback
  if (!flavor) {
    const path = window.location.pathname;
    if (path.includes(`/${ExploreFlavor.Logs}`)) {
      flavor = ExploreFlavor.Logs;
    } else if (path.includes(`/${ExploreFlavor.Traces}`)) {
      flavor = ExploreFlavor.Traces;
    } else if (path.includes(`/${ExploreFlavor.Metrics}`)) {
      flavor = ExploreFlavor.Metrics;
    }
  }

  // Clear existing tabs before registering new ones
  // This ensures tabs are properly updated when navigating between flavors
  services.tabRegistry.clearTabs();

  // Register built-in tabs with the appropriate flavor
  registerBuiltInTabs(services.tabRegistry, services, flavor);

  // Register plugin-provided tabs
  // This would be called by plugins that want to add tabs
  const pluginTabs = (services as any).plugins?.explore?.getTabs?.() || [];

  pluginTabs.forEach(
    (tabDefinition: import('../services/tab_registry/tab_registry_service').TabDefinition) => {
      services.tabRegistry.registerTab(tabDefinition);
    }
  );
};

/**
 * Re-register tabs when flavor changes
 * This should be called when navigating between different flavors
 */
export const reRegisterTabsForFlavor = (services: ExploreServices, flavor: ExploreFlavor) => {
  // Clear existing tabs
  services.tabRegistry.clearTabs();

  // Register built-in tabs with the new flavor
  registerBuiltInTabs(services.tabRegistry, services, flavor);

  // Register plugin-provided tabs
  const pluginTabs = (services as any).plugins?.explore?.getTabs?.() || [];
  pluginTabs.forEach(
    (tabDefinition: import('../services/tab_registry/tab_registry_service').TabDefinition) => {
      services.tabRegistry.registerTab(tabDefinition);
    }
  );
};
