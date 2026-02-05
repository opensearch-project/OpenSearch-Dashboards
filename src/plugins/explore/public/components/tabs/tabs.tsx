/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './tabs.scss';
import React, { useCallback } from 'react';
import { EuiTabbedContent, EuiTabbedContentTab } from '@elastic/eui';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveTab } from '../../application/utils/state_management/slices';
import { clearQueryStatusMapByKey } from '../../application/utils/state_management/slices';
import {
  defaultPrepareQueryString,
  executeTabQuery,
} from '../../application/utils/state_management/actions/query_actions';
import { selectActiveTab } from '../../application/utils/state_management/selectors';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../types';
import { RootState } from '../../application/utils/state_management/store';
import { useFlavorId } from '../../helpers/use_flavor_id';
import { ErrorGuard } from './error_guard/error_guard';
import { EXPLORE_PATTERNS_TAB_ID } from '../../../common';
import { DEFAULT_DATA } from '../../../../data/common';

/**
 * Rendering tabs with different views of 1 OpenSearch hit in Discover.
 * The tabs are provided by the `docs_views` registry.
 * A view can contain a React `component`, or any JS framework by using
 * a `render` function.
 */
export const ExploreTabs = () => {
  const dispatch = useDispatch();
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const flavorId = useFlavorId();
  const registryTabs = services.tabRegistry.getAllTabs();
  const results = useSelector((state: RootState) => state.results);
  const query = useSelector((state: RootState) => state.query);
  const activeTabId = useSelector(selectActiveTab);

  const onTabsClick = useCallback(
    (selectedTab: EuiTabbedContentTab) => {
      dispatch(setActiveTab(selectedTab.id));

      const activeTab = services.tabRegistry.getTab(selectedTab.id);
      const prepareQuery = activeTab?.prepareQuery || defaultPrepareQueryString;
      const newTabCacheKey = prepareQuery(query);

      const needsExecution = !results[newTabCacheKey];

      if (needsExecution) {
        dispatch(clearQueryStatusMapByKey(newTabCacheKey));
        dispatch(
          // @ts-expect-error TS2345 TODO(ts-error): fixme
          executeTabQuery({
            services,
            cacheKey: newTabCacheKey,
            queryString: newTabCacheKey,
          })
        );
      }
    },
    [query, results, dispatch, services]
  );

  if (flavorId == null) {
    return null;
  }

  // Display tabs that registered under current flavor
  const tabs: EuiTabbedContentTab[] = registryTabs
    .filter((registryTab) => {
      const registeredFlavor = registryTab.flavor.includes(flavorId);
      const isPatternsTab = registryTab.id === EXPLORE_PATTERNS_TAB_ID;
      const isDefaultDataset =
        query?.dataset &&
        (query.dataset.type === DEFAULT_DATA.SET_TYPES.INDEX_PATTERN ||
          query.dataset.type === DEFAULT_DATA.SET_TYPES.INDEX);
      if (isPatternsTab) {
        return registeredFlavor && isDefaultDataset;
      }
      return registeredFlavor;
    })
    .map((registryTab) => {
      return {
        id: registryTab.id,
        name: registryTab.label,
        content: (
          <ErrorGuard registryTab={registryTab}>
            <registryTab.component />
          </ErrorGuard>
        ),
      };
    });

  const activeTab =
    tabs.find((tab) => {
      return tab.id === activeTabId;
    }) || tabs[0];

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
