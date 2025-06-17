/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LogsTab } from '../components/tabs/logs_tab';
import { VisualizationContainer } from '../components/visualizations/visualization_container';
import { TabRegistryService } from '../services/tab_registry/tab_registry_service';

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
    supportedLanguages: ['PPL'],

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

  // Register Visualizations Tab
  tabRegistry.registerTab({
    id: 'explore_visualization_tab',
    label: 'Visualization',
    flavor: [],
    order: 20,
    supportedLanguages: ['PPL'],

    prepareQuery: (query) => {
      // No query transformation for visualizations tab
      // Visualization tab owner will implement their own prepareQuery
      return query;
    },

    component: VisualizationContainer,

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
export const registerTabs = (services: import('../types').ExploreServices) => {
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

  // Get the number of registered tabs
  const tabCount = services.tabRegistry.getAllTabs().length;
};
