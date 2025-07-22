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

    prepareQuery: (query, state) => {
      // Get the selected patterns field from the Redux state
      const patternsField = state?.tab.patterns.patterns_field;

      const preparedQuery = getQueryWithSource(query);
      if (!patternsField) return preparedQuery.query;

      return typeof preparedQuery.query === 'string' && preparedQuery.query !== ''
        ? preparedQuery.query +
            ` | patterns \`${patternsField}\` method=brain mode=aggregation | sort - pattern_count`
        : '';
    },

    // // New callback for handling query results
    // handleQueryResult: async (results, error, services, state) => {
    //   // Check for errors
    //   if (error) {
    //     // Cast error to any to access statusCode
    //     const errorWithStatus = error as any;
    //     const errorCode = errorWithStatus.statusCode || 500;
    //     console.log(`Query failed with status code: ${errorCode}`);
    //   // ` | patterns \`${patternsField}\` method=brain | stats count() as count, take(\`${patternsField}\`, 1) as sample by patterns_field | sort - count | fields patterns_field, count, sample`

    //     // Dispatch error to Redux store
    //     services.store.dispatch(
    //       setPatternQueryError({
    //         code: errorCode,
    //         message: error.message || 'Unknown error',
    //       })
    //     );

    //     // Check specific error types
    //     if (errorCode === 400 && error.message.includes('patterns command not found')) {
    //       // Example: Try a different query approach if patterns command isn't available
    //       // Instead of directly calling search, we would dispatch an action to execute a new query
    //       // This is just a placeholder for the implementation
    //       console.log('Would execute fallback query: stats count by message');

    //       // In a real implementation, we would dispatch a thunk action like:
    //       // services.store.dispatch(executeCustomQuery({
    //       //   query: state.query.query + ' | stats count by message',
    //       //   services
    //       // }));
    //     }
    //   } else if (results) {
    //     // Process successful results
    //     console.log(`Query succeeded with ${results.hits?.hits?.length || 0} hits`);

    //     // You could perform additional queries based on the results
    //     if (results.hits?.total === 0) {
    //       // No results case - could trigger a different query
    //     }
    //   }
    // },

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
