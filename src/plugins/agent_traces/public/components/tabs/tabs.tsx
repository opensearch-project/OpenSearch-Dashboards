/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './tabs.scss';
import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { EuiTabbedContent, EuiTabbedContentTab } from '@elastic/eui';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveTab } from '../../application/utils/state_management/slices';
import { clearQueryStatusMapByKey } from '../../application/utils/state_management/slices';
import { executeTabQuery } from '../../application/utils/state_management/actions/query_actions';
import { selectActiveTab } from '../../application/utils/state_management/selectors';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { AgentTracesServices } from '../../types';
import { RootState } from '../../application/utils/state_management/store';
import { useFlavorId } from '../../helpers/use_flavor_id';
import { ErrorGuard } from './error_guard/error_guard';
import { useTraceMetricsContext } from '../../application/pages/traces/hooks/use_trace_metrics';

/**
 * Context that provides the tab's own ID to its content tree.
 */
const TabIdContext = createContext('');

/** Returns the tab ID of the enclosing tab panel. */
export const useOwnTabId = () => useContext(TabIdContext);

export const AgentTracesTabs = () => {
  const dispatch = useDispatch();
  const { services } = useOpenSearchDashboards<AgentTracesServices>();
  const flavorId = useFlavorId();
  const registryTabs = services.tabRegistry.getAllTabs();
  const query = useSelector((state: RootState) => state.query);
  const activeTabId = useSelector(selectActiveTab);
  const { refresh: refreshMetrics } = useTraceMetricsContext();

  const resultKeys = useSelector(
    (state: RootState) => Object.keys(state.results),
    (a, b) => a.length === b.length && a.every((key, i) => key === b[i])
  );

  const sort = useSelector((state: RootState) => state.legacy.sort);

  const filteredTabs = useMemo(
    () =>
      flavorId == null
        ? []
        : registryTabs.filter((registryTab) => registryTab.flavor.includes(flavorId)),
    [registryTabs, flavorId]
  );

  const tabs: EuiTabbedContentTab[] = useMemo(
    () =>
      filteredTabs.map((tab) => ({
        id: tab.id,
        name: tab.label,
        content: (
          <TabIdContext.Provider value={tab.id}>
            <ErrorGuard registryTab={tab}>
              <tab.component />
            </ErrorGuard>
          </TabIdContext.Provider>
        ),
      })),
    [filteredTabs]
  );

  const selectedTab = useMemo(() => tabs.find((tab) => tab.id === activeTabId) ?? tabs[0], [
    tabs,
    activeTabId,
  ]);

  const onTabClick = useCallback(
    (tab: EuiTabbedContentTab) => {
      dispatch(setActiveTab(tab.id));

      const registryTab = services.tabRegistry.getTab(tab.id);
      if (!registryTab?.prepareQuery) return;

      const newTabCacheKey = registryTab.prepareQuery(query, sort);
      if (!resultKeys.includes(newTabCacheKey)) {
        dispatch(clearQueryStatusMapByKey(newTabCacheKey));
        dispatch(
          executeTabQuery({
            services,
            cacheKey: newTabCacheKey,
            queryString: newTabCacheKey,
          })
        );
        refreshMetrics();
      }
    },
    [query, sort, resultKeys, dispatch, services, refreshMetrics]
  );

  if (flavorId == null || tabs.length === 0) {
    return null;
  }

  return (
    <div className="agentTracesTabs" data-test-subj="agentTracesTabs">
      <EuiTabbedContent tabs={tabs} selectedTab={selectedTab} onTabClick={onTabClick} size="s" />
    </div>
  );
};
