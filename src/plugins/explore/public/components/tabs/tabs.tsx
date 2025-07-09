/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './tabs.scss';
import React, { useCallback, memo, useEffect } from 'react';
import { EuiTabbedContent, EuiTabbedContentTab } from '@elastic/eui';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveTab } from '../../application/utils/state_management/slices';
import { executeQueries } from '../../application/utils/state_management/actions/query_actions';
import { detectAndSetOptimalTab } from '../../application/utils/state_management/actions/detect_optimal_tab';
import { selectActiveTab } from '../../application/utils/state_management/selectors';
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
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const registryTabs = services.tabRegistry.getAllTabs();
  const results = useSelector((state: RootState) => state.results);
  const activeTabId = useSelector(selectActiveTab);

  useEffect(() => {
    if (activeTabId === '' && results && Object.keys(results).length > 0) {
      dispatch(detectAndSetOptimalTab({ services }));
    }
  }, [activeTabId, results, dispatch, services]);

  const onTabsClick = useCallback(
    (selectedTab: EuiTabbedContentTab) => {
      dispatch(setActiveTab(selectedTab.id));
      dispatch(executeQueries({ services }));
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

  const activeTab =
    tabs.find((tab) => {
      return tab.id === activeTabId;
    }) || tabs.find((tab) => tab.id === 'logs'); // Fallback to logs if activeTabId is empty

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
