/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TabRegistryService } from '../services/tab_registry/tab_registry_service';

// Import tab components
const LogsTabComponent = React.lazy(() => import('./components/logs_tab'));
const VisualizationsTabComponent = React.lazy(() => import('./components/tabs/visualizations_tab'));

/**
 * Registers built-in tabs with the tab registry
 */
export const registerBuiltInTabs = (tabRegistry: TabRegistryService) => {
  console.log('🔧 registerBuiltInTabs - Starting tab registration');
  console.log('🔧 registerBuiltInTabs - TabRegistry:', tabRegistry);
  console.log('🔧 registerBuiltInTabs - LogsTabComponent:', LogsTabComponent);

  // Register Logs Tab
  const logsTabDefinition = {
    id: 'logs',
    label: 'Logs',
    flavor: [],
    order: 10,
    supportedLanguages: ['PPL'],

    prepareQuery: (query: import('../../../data/common').Query) => {
      if (query.language === 'PPL') {
        // Remove stats pipe for logs view
        return {
          ...query,
          query:
            typeof query.query === 'string'
              ? query.query.replace(/\s*\|\s*stats.*$/i, '')
              : query.query,
        };
      }
      return query;
    },

    component: LogsTabComponent,

    // Add lifecycle hooks
    onActive: () => {
      // Tab activated
    },
    onInactive: () => {
      // Tab deactivated
    },
  };

  console.log('🔧 registerBuiltInTabs - Registering logs tab with definition:', logsTabDefinition);
  tabRegistry.registerTab(logsTabDefinition);
  console.log('🔧 registerBuiltInTabs - Logs tab registered successfully');

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
  console.log('🔧 registerTabs - Starting tab registration with services:', services);
  console.log('🔧 registerTabs - TabRegistry available:', !!services.tabRegistry);

  // Register built-in tabs
  registerBuiltInTabs(services.tabRegistry);

  // Register plugin-provided tabs
  // This would be called by plugins that want to add tabs
  const pluginTabs = (services as any).plugins?.explore?.getTabs?.() || [];
  console.log('🔧 registerTabs - Plugin tabs:', pluginTabs);

  pluginTabs.forEach(
    (tabDefinition: import('../services/tab_registry/tab_registry_service').TabDefinition) => {
      services.tabRegistry.registerTab(tabDefinition);
    }
  );

  // Get the number of registered tabs
  const tabCount = services.tabRegistry.getAllTabs().length;
  console.log('🔧 registerTabs - Total registered tabs:', tabCount);
  console.log('🔧 registerTabs - All tabs:', services.tabRegistry.getAllTabs());
};
