/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LogsTab } from '../components/tabs/logs_tab';
import { TabRegistryService } from '../services/tab_registry/tab_registry_service';
import { PatternsTab } from '../components/tabs/patterns_tab';
import { ExploreServices } from '../types';
import { EXPLORE_DEFAULT_LANGUAGE } from '../../common';
import { VisTab } from '../components/tabs/vis_tab';
import { getQueryWithSource } from './utils/languages';

/**
 * Registers built-in tabs with the tab registry
 */
export const registerBuiltInTabs = (tabRegistry: TabRegistryService) => {
  // Register Logs Tab
  const logsTabDefinition = {
    id: 'logs',
    label: 'Logs',
    flavor: [],
    order: 10,
    supportedLanguages: [EXPLORE_DEFAULT_LANGUAGE],

    component: LogsTab,

    // Add lifecycle hooks
    onActive: () => {
      // Tab activated
    },
    onInactive: () => {
      // Tab deactivated
    },
  };

  tabRegistry.registerTab(logsTabDefinition);

  // Register Patterns Tab
  tabRegistry.registerTab({
    id: 'explore_patterns_tab',
    label: 'Patterns',
    flavor: [],
    order: 15,
    supportedLanguages: [EXPLORE_DEFAULT_LANGUAGE],

    prepareQuery: (query) => {
      const patternsField = 'message'; // TODO: pull from patterns field configured in dataset

      // TODO: add quotes around take patternsField
      // ` | patterns ${patternsField} method=brain | stats count() as count, take(${patternsField}, 1) as sample by patterns_field | sort - count | fields patterns_field, count, sample`

      return typeof query.query === 'string' && query.query !== ''
        ? query.query +
            ` | patterns ${patternsField} method=brain mode=aggregation | sort - pattern_count`
        : '';
    },

    component: PatternsTab,

    // Add lifecycle hooks
    onActive: () => {
      // Tab activated
    },
    onInactive: () => {
      // Tab deactivated
    },
  });

  // Register Visualizations Tab
  tabRegistry.registerTab({
    id: 'explore_visualization_tab',
    label: 'Visualization',
    flavor: [],
    order: 20,
    supportedLanguages: [EXPLORE_DEFAULT_LANGUAGE],

    // No query transformation for visualizations tab
    // Visualization tab owner will implement their own prepareQuery
    prepareQuery: (query) => {
      const preparedQuery = getQueryWithSource(query);
      return preparedQuery.query;
    },

    component: VisTab,

    // Add lifecycle hooks
    onActive: () => {
      // Tab activated
    },
    onInactive: () => {
      // Tab deactivated
    },
  });
};

/**
 * Register tabs in the application
 * This is the main entry point for tab registration
 */
export const registerTabs = (services: ExploreServices) => {
  // Register built-in tabs
  registerBuiltInTabs(services.tabRegistry);

  // Register plugin-provided tabs
  // This would be called by plugins that want to add tabs
  const pluginTabs = (services as any).plugins?.explore?.getTabs?.() || [];

  pluginTabs.forEach(
    (tabDefinition: import('../services/tab_registry/tab_registry_service').TabDefinition) => {
      services.tabRegistry.registerTab(tabDefinition);
    }
  );
};
