/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TabRegistryService } from '../services/tab_registry/tab_registry_service';

// Import tab components
const LogsTabComponent = React.lazy(() =>
  import('./components/logs_tab').then((module) => ({ default: module.LogsTab }))
);
const VisualizationsTabComponent = React.lazy(() => import('./components/tabs/visualizations_tab'));

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

    component: LogsTabComponent,

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
    id: 'visualizations',
    label: 'Visualizations',
    flavor: [],
    order: 20,
    supportedLanguages: ['PPL'],

    prepareQuery: (query) => {
      // No query transformation for visualizations tab
      // Visualization tab owner will implement their own prepareQuery
      return query;
    },

    component: VisualizationsTabComponent,

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
