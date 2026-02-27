/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './tabs.scss';
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { EuiTab, EuiTabs } from '@elastic/eui';
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
import { TabDefinition } from '../../services/tab_registry/tab_registry_service';

/**
 * Context that tells tab content whether it is the currently visible tab.
 * Data-fetching hooks can consume this to defer server calls while hidden.
 */
const TabActiveContext = createContext(true);

/** Returns `true` when the enclosing tab panel is the active (visible) tab. */
export const useIsTabActive = () => useContext(TabActiveContext);

/**
 * Rendering tabs with different views of 1 OpenSearch hit in Discover.
 * The tabs are provided by the `docs_views` registry.
 *
 * Optimisations:
 * - Lazy mount: a tab component is not mounted until the user visits it.
 * - Keep-alive: once mounted, a tab stays in the DOM and is hidden via
 *   `visibility:hidden` (not `display:none`) so the browser preserves
 *   layout state and switching avoids a full reflow.
 * - Active-tab context: data-fetching hooks can read `useIsTabActive()` to
 *   skip server calls while the tab is hidden.
 */
export const AgentTracesTabs = () => {
  const dispatch = useDispatch();
  const { services } = useOpenSearchDashboards<AgentTracesServices>();
  const flavorId = useFlavorId();
  const registryTabs = services.tabRegistry.getAllTabs();
  const query = useSelector((state: RootState) => state.query);
  const activeTabId = useSelector(selectActiveTab);

  // Only select the result keys (not values) to check existence without re-rendering on data changes
  const resultKeys = useSelector(
    (state: RootState) => Object.keys(state.results),
    (a, b) => a.length === b.length && a.every((key, i) => key === b[i])
  );

  const filteredTabs = useMemo(
    () =>
      flavorId == null
        ? []
        : registryTabs.filter((registryTab) => registryTab.flavor.includes(flavorId)),
    [registryTabs, flavorId]
  );

  const resolvedActiveTabId = useMemo(() => {
    if (filteredTabs.find((tab) => tab.id === activeTabId)) return activeTabId;
    return filteredTabs[0]?.id ?? '';
  }, [filteredTabs, activeTabId]);

  // Track which tabs have been visited so we can lazy-mount them.
  // Initialise with the first active tab so it mounts immediately.
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(
    () => new Set(resolvedActiveTabId ? [resolvedActiveTabId] : [])
  );

  // Keep visitedTabs in sync if the resolved default changes before any click
  const prevResolvedRef = useRef(resolvedActiveTabId);
  if (resolvedActiveTabId && resolvedActiveTabId !== prevResolvedRef.current) {
    prevResolvedRef.current = resolvedActiveTabId;
    if (!visitedTabs.has(resolvedActiveTabId)) {
      setVisitedTabs((prev) => new Set(prev).add(resolvedActiveTabId));
    }
  }

  const onTabClick = useCallback(
    (tabId: string) => {
      dispatch(setActiveTab(tabId));

      // Mark as visited so the component mounts (if first visit)
      setVisitedTabs((prev) => {
        if (prev.has(tabId)) return prev;
        return new Set(prev).add(tabId);
      });

      // Skip query execution for tabs that handle their own data fetching
      const tab = services.tabRegistry.getTab(tabId);
      if (!tab?.prepareQuery) return;

      const newTabCacheKey = tab.prepareQuery(query);
      const needsExecution = !resultKeys.includes(newTabCacheKey);

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
    [query, resultKeys, dispatch, services]
  );

  if (flavorId == null) {
    return null;
  }

  return (
    <div className="agentTracesTabs" data-test-subj="agentTracesTabs">
      <EuiTabs size="s">
        {filteredTabs.map((tab) => (
          <EuiTab
            key={tab.id}
            isSelected={tab.id === resolvedActiveTabId}
            onClick={() => onTabClick(tab.id)}
          >
            {tab.label}
          </EuiTab>
        ))}
      </EuiTabs>
      <div className="agentTracesTabs__panels">
        {filteredTabs.map((tab) => {
          const isActive = tab.id === resolvedActiveTabId;
          if (!visitedTabs.has(tab.id)) return null;
          return <TabPanel key={tab.id} tab={tab} isActive={isActive} />;
        })}
      </div>
    </div>
  );
};

const TabPanel = React.memo(({ tab, isActive }: { tab: TabDefinition; isActive: boolean }) => (
  <div
    role="tabpanel"
    className={`agentTracesTabs__panel${isActive ? ' agentTracesTabs__panel--active' : ''}`}
  >
    <TabActiveContext.Provider value={isActive}>
      <ErrorGuard registryTab={tab}>
        <tab.component />
      </ErrorGuard>
    </TabActiveContext.Provider>
  </div>
));
