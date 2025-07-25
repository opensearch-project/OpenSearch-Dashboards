/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IFieldType } from 'src/plugins/data/common';
import { LogsTab } from '../components/tabs/logs_tab';
import { TabRegistryService } from '../services/tab_registry/tab_registry_service';
import { PatternsTab } from '../components/tabs/patterns_tab';
import { ExploreServices } from '../types';
import { EXPLORE_DEFAULT_LANGUAGE } from '../../common';
import { VisTab } from '../components/tabs/vis_tab';
import { getQueryWithSource } from './utils/languages';
import { setPatternsField } from './utils/state_management/slices/tab/tab_slice';
import { RootState } from './utils/state_management/store';
import { defaultPrepareQueryString } from './utils/state_management/actions/query_actions';

const findDefaultPatternsField = (state?: RootState, services?: ExploreServices) => {
  // set the value for patterns field
  if (!state || !services?.store) return;

  // Get the log tab's results from the state
  const query = state.query;
  const results = state.results;

  // Get the logs tab to find its cache key
  const logsTab = services.tabRegistry.getTab('logs');
  if (!logsTab) return;

  // Get the cache key for logs tab results
  const logsCacheKey = defaultPrepareQueryString(query);
  const logResults = results[logsCacheKey];

  // Get fields
  const filteredFields = logResults?.fieldSchema?.filter((field: Partial<IFieldType>) => {
    return field.type === 'string';
  });

  // Get the first hit if available
  const firstHit = logResults?.hits?.hits?.[0];

  if (firstHit && firstHit._source && filteredFields) {
    // Find the field with the longest value
    let longestField = '';
    let maxLength = 0;

    Object.entries(firstHit._source).forEach(([field, value]) => {
      // Check if the field exists in options
      if (filteredFields.some((option) => option.name === field)) {
        const valueLength = typeof value === 'string' ? value.length : 0;

        if (valueLength > maxLength) {
          maxLength = valueLength;
          longestField = field;
        }
      }
    });

    if (longestField) {
      services.store.dispatch(setPatternsField(longestField));
      return longestField;
    }
  }
};

/**
 * Registers built-in tabs with the tab registry
 */
export const registerBuiltInTabs = (
  tabRegistry: TabRegistryService,
  services?: ExploreServices
) => {
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
      let patternsField = state?.tab.patterns.patterns_field;

      const preparedQuery = getQueryWithSource(query);
      if (!patternsField) {
        patternsField = findDefaultPatternsField(state, services);
      }

      return typeof preparedQuery.query === 'string' && preparedQuery.query !== ''
        ? preparedQuery.query +
            ` | patterns \`${patternsField}\` method=brain mode=aggregation | sort - pattern_count`
        : preparedQuery.query;
    },

    component: PatternsTab,

    // Add lifecycle hooks
    onActive: (state?: RootState): void => {
      // TODO: write detailed message about predicting the field

      findDefaultPatternsField(state, services);
    },

    onInactive: (state?: RootState): void => {
      // Tab deactivated
      // TODO: maybe implement this to remove the patterns field? this might be needed to not use a field
      //        from a diff index pattern

      if (!state || !services?.store) return;
      services.store.dispatch(setPatternsField(''));
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
