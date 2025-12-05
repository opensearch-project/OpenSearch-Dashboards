/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LogsTab } from '../components/tabs/logs_tab';
import { MetricsTab } from '../components/tabs/metrics_tab';
import { FieldStatsTab } from '../components/tabs/field_stats_tab';
import { TabDefinition, TabRegistryService } from '../services/tab_registry/tab_registry_service';
import { ExploreServices } from '../types';
import {
  ExploreFlavor,
  EXPLORE_DEFAULT_LANGUAGE,
  EXPLORE_LOGS_TAB_ID,
  EXPLORE_VISUALIZATION_TAB_ID,
  EXPLORE_PATTERNS_TAB_ID,
  EXPLORE_FIELD_STATS_TAB_ID,
  ENABLE_EXPERIMENTAL_SETTING,
} from '../../common';
import { VisTab } from '../components/tabs/vis_tab';
import { prepareQueryForLanguage } from './utils/languages';
import {
  brainPatternQuery,
  findDefaultPatternsField,
  regexPatternQuery,
} from '../components/patterns_table/utils/utils';
import { setUsingRegexPatterns } from './utils/state_management/slices/tab/tab_slice';
import { executeTabQuery } from './utils/state_management/actions/query_actions';
import { setIndividualQueryStatus } from './utils/state_management/slices/query_editor/query_editor_slice';
import { QueryExecutionStatus } from './utils/state_management/types';
import { PatternsTab } from '../components/tabs/patterns_tab';
import { BRAIN_QUERY_OLD_ENGINE_ERROR_PREFIX } from '../components/patterns_table/utils/constants';

/**
 * Registers built-in tabs with the tab registry
 */
export const registerBuiltInTabs = (
  tabRegistry: TabRegistryService,
  services: ExploreServices,
  registryFlavor: ExploreFlavor
) => {
  const isExperimentalEnabled = services.uiSettings.get(ENABLE_EXPERIMENTAL_SETTING, false);

  if (registryFlavor === ExploreFlavor.Metrics) {
    tabRegistry.registerTab({
      id: 'metrics',
      label: 'Table',
      flavor: [ExploreFlavor.Metrics],
      order: 10,
      supportedLanguages: ['PROMQL'],
      component: MetricsTab,
    });
  } else {
    // Register Logs Tab
    const logsTabDefinition: TabDefinition = {
      id: EXPLORE_LOGS_TAB_ID,
      label: registryFlavor === ExploreFlavor.Traces ? 'Spans' : 'Logs',
      flavor: [ExploreFlavor.Logs, ExploreFlavor.Traces],
      order: 10,
      supportedLanguages: [EXPLORE_DEFAULT_LANGUAGE],
      component: LogsTab,
    };
    tabRegistry.registerTab(logsTabDefinition);
  }

  // Register Patterns Tab
  if (isExperimentalEnabled) {
    tabRegistry.registerTab({
      id: EXPLORE_PATTERNS_TAB_ID,
      label: 'Patterns',
      flavor: [ExploreFlavor.Logs],
      order: 15,
      supportedLanguages: [EXPLORE_DEFAULT_LANGUAGE],

      prepareQuery: (query) => {
        const state = services.store.getState();

        // Get the selected patterns field from the Redux state
        let patternsField = state.tab.patterns.patternsField;

        const preparedQuery = prepareQueryForLanguage(query);
        if (!patternsField) {
          try {
            patternsField = findDefaultPatternsField(services);
          } catch {
            return preparedQuery.query;
          }
        }

        if (state.tab.patterns.usingRegexPatterns)
          return regexPatternQuery(preparedQuery.query, patternsField);

        return brainPatternQuery(preparedQuery.query, patternsField);
      },

      handleQueryError: (error, cacheKey) => {
        const state = services.store.getState();

        /**
         * The below conditional is checking for the error returned when attempting to use a BRAIN
         * query on an older version of the querying engine. If this error appears, an attempt is made
         * to switch over to a patterns query which works on older versions of the querying engine.
         * A redux state is set to inform the UI that this older query is being utilized
         * Finally, the query is retriggered.
         * The return value being true will prevent the standard error from dispatching, keeping the page clear
         */
        if (
          error &&
          error.status &&
          error.status === 400 &&
          error.error.details &&
          error.error.details.startsWith(BRAIN_QUERY_OLD_ENGINE_ERROR_PREFIX)
        ) {
          // can check further details of err if needed
          let patternsField = state.tab.patterns.patternsField;
          if (!patternsField) {
            patternsField = findDefaultPatternsField(services);
          }
          const query = state.query;
          const preparedQuery = prepareQueryForLanguage(query);
          services.store.dispatch(setUsingRegexPatterns(true));
          services.store.dispatch(
            executeTabQuery({
              services,
              cacheKey: regexPatternQuery(preparedQuery.query, patternsField),
              queryString: query.query,
            })
          );

          // set the old cacheKey to uninitialized to finalize loading, our new tab query has new cacheKey
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

      component: PatternsTab,
    });
  }

  // Register Visualizations Tab
  tabRegistry.registerTab({
    id: EXPLORE_VISUALIZATION_TAB_ID,
    label: 'Visualization',
    flavor: [ExploreFlavor.Logs, ExploreFlavor.Metrics, ExploreFlavor.Traces],
    order: 20,
    supportedLanguages:
      registryFlavor === ExploreFlavor.Metrics
        ? [EXPLORE_DEFAULT_LANGUAGE, 'PROMQL']
        : [EXPLORE_DEFAULT_LANGUAGE],

    // Prepare query based on language
    prepareQuery: (query) => {
      const preparedQuery = prepareQueryForLanguage(query);
      return preparedQuery.query;
    },

    component: VisTab,
  });

  // Register Field Stats Tab
  if (isExperimentalEnabled) {
    tabRegistry.registerTab({
      id: EXPLORE_FIELD_STATS_TAB_ID,
      label: 'Field Stats',
      flavor: [ExploreFlavor.Logs],
      order: 25,
      supportedLanguages: [EXPLORE_DEFAULT_LANGUAGE],
      component: FieldStatsTab,
    });
  }
};

/**
 * Register tabs in the application
 * This is the main entry point for tab registration
 */
export const registerTabs = (services: ExploreServices, flavor: ExploreFlavor) => {
  // Register built-in tabs
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
