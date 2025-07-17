/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LogsTab } from '../components/tabs/logs_tab';
import { TracesTab } from '../components/tabs/traces_tab';
import { TabRegistryService } from '../services/tab_registry/tab_registry_service';
import { PatternsTab } from '../components/tabs/patterns_tab';
import { ExploreServices } from '../types';
import { EXPLORE_DEFAULT_LANGUAGE, ExploreFlavor } from '../../common';
import { VisTab } from '../components/tabs/vis_tab';

/**
 * Registers built-in tabs with the tab registry
 */
export const registerBuiltInTabs = (tabRegistry: TabRegistryService, flavor?: ExploreFlavor) => {
  if (flavor === ExploreFlavor.Traces) {
    // Register Results Tab for Traces
    const tracesTabDefinition = {
      id: 'traces',
      label: 'Spans',
      flavor: [],
      order: 10,
      supportedLanguages: [EXPLORE_DEFAULT_LANGUAGE],

      component: TracesTab,

      // Add lifecycle hooks
      onActive: () => {
        // Tab activated
      },
      onInactive: () => {
        // Tab deactivated
      },
    };

    tabRegistry.registerTab(tracesTabDefinition);
  } else {
    // Register Logs Tab for other flavors
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
  }

  // Register Patterns Tab (skip for Traces)
  if (flavor !== ExploreFlavor.Traces) {
    tabRegistry.registerTab({
      id: 'explore_patterns_tab',
      label: 'Patterns',
      flavor: [],
      order: 15,
      supportedLanguages: [EXPLORE_DEFAULT_LANGUAGE],

      prepareQuery: (query) => {
        return typeof query.query === 'string' ? query.query : '';
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
  }

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
      return typeof query.query === 'string' ? query.query : '';
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
  // Get the current flavor from the URL
  const path = window.location.pathname;
  let flavor: ExploreFlavor | undefined;

  if (path.includes(`/${ExploreFlavor.Logs}`)) {
    flavor = ExploreFlavor.Logs;
  } else if (path.includes(`/${ExploreFlavor.Traces}`)) {
    flavor = ExploreFlavor.Traces;
  } else if (path.includes(`/${ExploreFlavor.Metrics}`)) {
    flavor = ExploreFlavor.Metrics;
  }

  // Register built-in tabs with the appropriate flavor
  registerBuiltInTabs(services.tabRegistry, flavor);

  // Register plugin-provided tabs
  // This would be called by plugins that want to add tabs
  const pluginTabs = (services as any).plugins?.explore?.getTabs?.() || [];

  pluginTabs.forEach(
    (tabDefinition: import('../services/tab_registry/tab_registry_service').TabDefinition) => {
      services.tabRegistry.registerTab(tabDefinition);
    }
  );
};
