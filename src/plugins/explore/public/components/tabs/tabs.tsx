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
import { setActiveTab } from '../../application/utils/state_management/slices';
import { executeQueries } from '../../application/utils/state_management/actions/query_actions';
import { selectActiveTab } from '../../application/utils/state_management/selectors';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../types';

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

  const activeTabId = useSelector(selectActiveTab);

  const onTabsClick = useCallback(
    (selectedTab: EuiTabbedContentTab) => {
      dispatch(beginTransaction());
      try {
        dispatch(setActiveTab(selectedTab.id));
        dispatch(executeQueries({ services }));
      } finally {
        dispatch(finishTransaction());
      }
    },
    [dispatch, services]
  );

  const tabs: EuiTabbedContentTab[] = registryTabs.map((registryTab) => {
    return {
      id: registryTab.id,
      name: registryTab.label,
      content: <registryTab.component />,
    };
  });

  const activeTab = tabs.find((tab) => {
    return tab.id === activeTabId;
  });

  return (
    <EuiTabbedContent
      className="exploreTabs"
      data-test-subj="exploreTabs"
      tabs={tabs}
      size="s"
      onTabClick={onTabsClick}
      selectedTab={activeTab}
    />
  );
};

export const ExploreTabs = memo(ExploreTabsComponent);
