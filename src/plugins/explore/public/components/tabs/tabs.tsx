/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './tabs.scss';
import React, { useCallback, useMemo } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiTab, EuiTabs } from '@elastic/eui';
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

export const EXPLORE_ACTION_BAR_SLOT_ID = 'explore-action-bar-slot';

export const ExploreTabs = () => {
  const dispatch = useDispatch();
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const flavorId = useFlavorId();
  const registryTabs = services.tabRegistry.getAllTabs();
  const results = useSelector((state: RootState) => state.results);
  const query = useSelector((state: RootState) => state.query);
  const activeTabId = useSelector(selectActiveTab);

  const onTabClick = useCallback(
    (tabId: string) => {
      dispatch(setActiveTab(tabId));

      const activeTab = services.tabRegistry.getTab(tabId);
      const prepareQuery = activeTab?.prepareQuery || defaultPrepareQueryString;
      const newTabCacheKey = prepareQuery(query);

      const needsExecution = !results[newTabCacheKey];

      if (needsExecution) {
        dispatch(clearQueryStatusMapByKey(newTabCacheKey));
        dispatch(
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

  const filteredTabs = useMemo(() => {
    if (flavorId == null) return [];
    return registryTabs.filter((registryTab) => {
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
    });
  }, [flavorId, registryTabs, query]);

  const activeRegistryTab = useMemo(() => {
    return filteredTabs.find((tab) => tab.id === activeTabId) || filteredTabs[0];
  }, [filteredTabs, activeTabId]);

  if (flavorId == null || !activeRegistryTab) {
    return null;
  }

  return (
    <div className="exploreTabs" data-test-subj="exploreTabs">
      <EuiFlexGroup
        className="exploreTabs__header"
        alignItems="center"
        gutterSize="none"
        responsive={false}
      >
        <EuiFlexItem grow={false}>
          <EuiTabs size="s" className="exploreTabs__tabs">
            {filteredTabs.map((tab) => (
              <EuiTab
                key={tab.id}
                isSelected={tab.id === activeRegistryTab.id}
                onClick={() => onTabClick(tab.id)}
                id={tab.id}
                data-test-subj={`exploreTab-${tab.id}`}
              >
                {tab.label}
              </EuiTab>
            ))}
          </EuiTabs>
        </EuiFlexItem>
        <EuiFlexItem>
          <div id={EXPLORE_ACTION_BAR_SLOT_ID} />
        </EuiFlexItem>
      </EuiFlexGroup>
      <div role="tabpanel" className="exploreTabs__tabPanel">
        <ErrorGuard registryTab={activeRegistryTab}>
          <activeRegistryTab.component />
        </ErrorGuard>
      </div>
    </div>
  );
};
