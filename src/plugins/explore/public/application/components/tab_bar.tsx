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
import {
  beginTransaction,
  finishTransaction,
} from '../utils/state_management/actions/transaction_actions';
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

  // Handle tab click with transaction pattern
  const handleTabClick = useCallback(
    (tabId: string) => {
      if (tabId === activeTabId) return;

      dispatch(beginTransaction());
      try {
        dispatch(setActiveTab(tabId));
        dispatch(executeQueries({ services }) as any); // No clearCache - use cache if available
      } finally {
        dispatch(finishTransaction());
      }
    },
    [dispatch, activeTabId, services]
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
