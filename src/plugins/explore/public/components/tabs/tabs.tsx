/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './tabs.scss';
import React, { useCallback, memo } from 'react';
import { EuiTabbedContent, EuiTabbedContentTab } from '@elastic/eui';
import { useDispatch, useSelector } from 'react-redux';
import {
  beginTransaction,
  finishTransaction,
} from '../../application/utils/state_management/actions/transaction_actions';
import { setActiveTab } from '../../application/utils/state_management/slices/ui_slice';
import {
  defaultPrepareQuery,
  executeQueries,
} from '../../application/utils/state_management/actions/query_actions';
import { selectQuery } from '../../application/utils/state_management/selectors';
import { createCacheKey } from '../../application/utils/state_management/handlers/query_handler';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../types';
import { RootState } from '../../application/utils/state_management/store';

/**
 * Rendering tabs with different views of 1 OpenSearch hit in Discover.
 * The tabs are provided by the `docs_views` registry.
 * A view can contain a React `component`, or any JS framework by using
 * a `render` function.
 */
export const ExploreTabsComponent = () => {
  const dispatch = useDispatch();
  // Get services from context
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const registryTabs = services.tabRegistry.getAllTabs();

  const query = useSelector(selectQuery);
  const results = useSelector((state: RootState) => state.results);

  const onTabsClick = useCallback(
    (selectedTab: EuiTabbedContentTab) => {
      dispatch(beginTransaction());
      try {
        dispatch(setActiveTab(selectedTab.id));

        // SPECIAL: Check cache first, only execute if cache miss
        // Get new activeTab's prepareQuery to check cache
        const newActiveTab = services.tabRegistry?.getTab(selectedTab.id);
        const activeTabPrepareQuery = newActiveTab?.prepareQuery || defaultPrepareQuery;
        const activeTabQuery = activeTabPrepareQuery(query);
        const timeRange = services.data.query.timefilter.timefilter.getTime();
        const activeTabCacheKey = createCacheKey(activeTabQuery, timeRange);

        // Also check if we need histogram data
        const defaultQuery = defaultPrepareQuery(query);
        const defaultCacheKey = createCacheKey(defaultQuery, timeRange);

        // Only execute if cache miss
        const needsActiveTabQuery = !results[activeTabCacheKey];
        const needsDefaultQuery = !results[defaultCacheKey];

        if (needsActiveTabQuery || needsDefaultQuery) {
          // NO clearResults() - preserve existing cache
          dispatch(executeQueries({ services }));
        }
      } finally {
        dispatch(finishTransaction());
      }
    },
    [dispatch, services, query, results]
  );

  const tabs: EuiTabbedContentTab[] = registryTabs.map((registryTab) => {
    return {
      id: registryTab.id,
      name: registryTab.label,
      content: <registryTab.component />,
    };
  });

  return (
    <EuiTabbedContent
      className="exploreTabs"
      data-test-subj="exploreTabs"
      tabs={tabs}
      size="s"
      onTabClick={onTabsClick}
    />
  );
};

export const ExploreTabs = memo(ExploreTabsComponent);
