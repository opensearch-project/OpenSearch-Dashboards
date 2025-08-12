/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LogsTab } from '../components/tabs/logs_tab';
import { TabRegistryService } from '../services/tab_registry/tab_registry_service';
import { ExploreServices } from '../types';
import { EXPLORE_DEFAULT_LANGUAGE } from '../../common';
import { VisTab } from '../components/tabs/vis_tab';
import { getQueryWithSource } from './utils/languages';

/**
 * Registers built-in tabs with the tab registry
 */
export const registerBuiltInTabs = (tabRegistry: TabRegistryService, services: ExploreServices) => {
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
  // TODO: Disabled for P0.
  // tabRegistry.registerTab({
  //   id: 'explore_patterns_tab',
  //   label: 'Patterns',
  //   flavor: [],
  //   order: 15,
  //   supportedLanguages: [EXPLORE_DEFAULT_LANGUAGE],
  //
  //   prepareQuery: (query) => {
  //     const state = services.store.getState();
  //
  //     // Get the selected patterns field from the Redux state
  //     let patternsField = state.tab.patterns.patternsField;
  //
  //     const preparedQuery = getQueryWithSource(query);
  //     if (!patternsField) {
  //       patternsField = findDefaultPatternsField(services);
  //     }
  //
  //     if (state.tab.patterns.usingRegexPatterns)
  //       return regexPatternQuery(preparedQuery.query, patternsField);
  //
  //     return brainPatternQuery(preparedQuery.query, patternsField);
  //   },
  //
  //   handleQueryError: (error, cacheKey) => {
  //     const state = services.store.getState();
  //
  //     /**
  //      * The below conditional is checking for the error returned when attempting to use a BRAIN
  //      * query on an older version of the querying engine. If this error appears, an attempt is made
  //      * to switch over to a patterns query which works on older versions of the querying engine.
  //      * A redux state is set to inform the UI that this older query is being utilized
  //      * Finally, the query is retriggered.
  //      * The return value being true will prevent the standard error from dispatching, keeping the page clear
  //      */
  //     if (
  //       error &&
  //       error.status &&
  //       error.status === 400 &&
  //       error.error.details &&
  //       error.error.details.startsWith(BRAIN_QUERY_OLD_ENGINE_ERROR_PREFIX)
  //     ) {
  //       // can check further details of err if needed
  //       let patternsField = state.tab.patterns.patternsField;
  //       if (!patternsField) {
  //         patternsField = findDefaultPatternsField(services);
  //       }
  //       const query = state.query;
  //       const preparedQuery = getQueryWithSource(query);
  //       services.store.dispatch(setUsingRegexPatterns(true));
  //       services.store.dispatch(
  //         executeTabQuery({
  //           services,
  //           cacheKey: regexPatternQuery(preparedQuery.query, patternsField),
  //         })
  //       );
  //
  //       // set the old cacheKey to uninitialized to finalize loading, our new tab query has new cacheKey
  //       services.store.dispatch(
  //         setIndividualQueryStatus({
  //           cacheKey,
  //           status: {
  //             status: QueryExecutionStatus.UNINITIALIZED,
  //             startTime: undefined,
  //             elapsedMs: undefined,
  //             error: undefined,
  //           },
  //         })
  //       );
  //
  //       return true;
  //     }
  //
  //     return false;
  //   },
  //
  //   component: PatternsTab,
  // });

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
  });
};

/**
 * Register tabs in the application
 * This is the main entry point for tab registration
 */
export const registerTabs = (services: ExploreServices) => {
  // Register built-in tabs
  registerBuiltInTabs(services.tabRegistry, services);

  // Register plugin-provided tabs
  // This would be called by plugins that want to add tabs
  const pluginTabs = (services as any).plugins?.explore?.getTabs?.() || [];

  pluginTabs.forEach(
    (tabDefinition: import('../services/tab_registry/tab_registry_service').TabDefinition) => {
      services.tabRegistry.registerTab(tabDefinition);
    }
  );
};
