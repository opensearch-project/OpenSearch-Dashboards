/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EuiTabs, EuiTab } from '@elastic/eui';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../types';
import { setActiveTab } from '../utils/state_management/slices/ui_slice';
import { executeQueries } from '../utils/state_management/actions/query_actions';
import { createCacheKey } from '../utils/state_management/handlers/query_handler';
import {
  selectActiveTabId,
  selectQueryLanguage,
  selectQuery,
} from '../utils/state_management/selectors';
import { TabDefinition } from '../../services/tab_registry/tab_registry_service';

/**
 * Tab bar component for switching between different views
 * Uses memoized selectors for optimal performance
 */
export const TabBar: React.FC = () => {
  const dispatch = useDispatch();

  // Get services from context
  const { services } = useOpenSearchDashboards<ExploreServices>();

  // Use Redux selectors for UI state only
  const activeTabId = useSelector(selectActiveTabId);
  const queryLanguage = useSelector(selectQueryLanguage);
  const query = useSelector(selectQuery);

  // Get all tabs from tabRegistry service
  const allTabs = useMemo(() => {
    return services.tabRegistry?.getAllTabs?.() || [];
  }, [services.tabRegistry]);

  // Filter tabs that support the current query language
  const tabs = useMemo(() => {
    if (!queryLanguage) return allTabs; // Fallback to all tabs if language is undefined
    return allTabs.filter((tab: TabDefinition) => tab.supportedLanguages.includes(queryLanguage));
  }, [allTabs, queryLanguage]);

  // Handle tab click with cache-aware logic
  const handleTabClick = useCallback(
    (tabId: string) => {
      if (tabId === activeTabId) return;

      const timeRange = services.data.query.timefilter.timefilter.getTime();
      const preparedQueries = [];

      if (tabId === 'logs') {
        // Switching to logs - only need logs query
        const logsTabDefinition = services.tabRegistry?.getTab('logs');
        const logsPreparedQuery = logsTabDefinition?.prepareQuery
          ? logsTabDefinition.prepareQuery(query)
          : query;
        const logsCacheKey = createCacheKey(logsPreparedQuery, timeRange);

        preparedQueries.push({
          query: logsPreparedQuery,
          cacheKey: logsCacheKey,
          tabId: 'logs',
        });
      } else {
        // Switching to other tab - need both logs and target tab queries

        // 1. Logs query for histogram
        const logsTabDefinition = services.tabRegistry?.getTab('logs');
        const logsPreparedQuery = logsTabDefinition?.prepareQuery
          ? logsTabDefinition.prepareQuery(query)
          : query;
        const logsCacheKey = createCacheKey(logsPreparedQuery, timeRange);

        // 2. Target tab query
        const targetTabDefinition = services.tabRegistry?.getTab(tabId);
        const targetPreparedQuery = targetTabDefinition?.prepareQuery
          ? targetTabDefinition.prepareQuery(query)
          : query;
        const targetCacheKey = createCacheKey(targetPreparedQuery, timeRange);

        preparedQueries.push(
          { query: logsPreparedQuery, cacheKey: logsCacheKey, tabId: 'logs' },
          { query: targetPreparedQuery, cacheKey: targetCacheKey, tabId }
        );
      }

      // Update active tab
      dispatch(setActiveTab(tabId));

      // Execute cache-aware tab switching
      dispatch(
        executeQueries({
          services,
          reason: 'tab_switch',
          preparedQueries,
        }) as any
      );
    },
    [dispatch, activeTabId, query, services]
  );

  // If no tabs support the current language, show all tabs
  // Use useMemo instead of conditional hook call
  const displayTabs = useMemo(() => {
    return tabs.length > 0 ? tabs : allTabs;
  }, [tabs, allTabs]);

  return (
    <EuiTabs>
      {displayTabs.map((tab: TabDefinition) => (
        <EuiTab
          key={tab.id}
          isSelected={tab.id === activeTabId}
          onClick={() => handleTabClick(tab.id)}
          data-test-subj={`exploreTab-${tab.id}`}
        >
          {tab.label}
        </EuiTab>
      ))}
    </EuiTabs>
  );
};
