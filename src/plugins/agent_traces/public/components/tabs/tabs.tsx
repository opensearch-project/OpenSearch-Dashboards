/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './tabs.scss';
import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
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
import { useTraceMetricsContext } from '../../application/pages/traces/hooks/use_trace_metrics';

/**
 * Lightweight store for the active tab ID.
 *
 * Lives outside React so updating it does NOT trigger a React context
 * re-render or tree traversal.  Consumers that need to know which tab
 * is active subscribe via `useSyncExternalStore`.
 */
type Listener = () => void;
const createActiveTabStore = () => {
  let activeId = '';
  const listeners = new Set<Listener>();
  return {
    setActiveId(id: string) {
      if (id === activeId) return;
      activeId = id;
      listeners.forEach((l) => l());
    },
    subscribe(l: Listener) {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    getActiveId: () => activeId,
  };
};

const activeTabStore = createActiveTabStore();

/**
 * Returns `true` when the enclosing tab panel is the active (visible) tab.
 * Backed by an external store — only components that call this hook
 * re-render on tab switch, NOT the entire panel subtree.
 */
export const useIsTabActive = () => {
  const ownTabId = useOwnTabId();
  return useSyncExternalStore(
    activeTabStore.subscribe,
    () => activeTabStore.getActiveId() === ownTabId
  );
};

/**
 * Context that provides the tab's own ID to its content tree.
 * Hooks like useTabResults read this instead of the global activeTabId
 * from Redux, so hidden tabs don't re-render when the active tab changes.
 */
const TabIdContext = createContext('');

/** Returns the tab ID of the enclosing tab panel. */
export const useOwnTabId = () => useContext(TabIdContext);

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
  const { refresh: refreshMetrics } = useTraceMetricsContext();

  // Only select the result keys (not values) to check existence without re-rendering on data changes
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

  // Ref to the panels container for imperative class toggling
  const panelsRef = useRef<HTMLDivElement>(null);

  /** Toggle the --active CSS class on panel divs and update the external store. */
  const applyPanelVisibility = useCallback((activeId: string) => {
    const container = panelsRef.current;
    if (!container) return;
    const panels = container.querySelectorAll<HTMLDivElement>('[role="tabpanel"]');
    panels.forEach((panel) => {
      panel.classList.toggle('agentTracesTabs__panel--active', panel.dataset.tabId === activeId);
    });
    activeTabStore.setActiveId(activeId);
  }, []);

  // Sync panel visibility on mount and when a new tab is first mounted.
  useLayoutEffect(() => {
    applyPanelVisibility(resolvedActiveTabId);
  }, [resolvedActiveTabId, visitedTabs, applyPanelVisibility]);

  const onTabClick = useCallback(
    (tabId: string) => {
      // 1. Toggle panel visibility immediately via DOM so the browser can
      //    paint the switch in ~60 ms.
      applyPanelVisibility(tabId);

      // 2. Lazy-mount the panel if this is the first visit.  This is a React
      //    state update but only adds a lightweight wrapper div — it doesn't
      //    trigger the heavy subtree re-renders.
      setVisitedTabs((prev) => {
        if (prev.has(tabId)) return prev;
        return new Set(prev).add(tabId);
      });

      // 3. Defer Redux dispatch until after the browser paints the CSS change.
      //    The double-rAF ensures the dispatch runs in frame N+1, after the
      //    browser has painted the visibility toggle in frame N.  This lets the
      //    user see the tab switch in ~60 ms while the heavier Redux re-renders
      //    (sidebar, field selector, etc.) run non-blockingly afterward.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          dispatch(setActiveTab(tabId));

          // Skip query execution for tabs that handle their own data fetching
          const tab = services.tabRegistry.getTab(tabId);
          if (!tab?.prepareQuery) return;

          const newTabCacheKey = tab.prepareQuery(query, sort);
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
            // Re-fetch metrics alongside the tab query to keep counts in sync.
            // Without this, the metrics bar can show stale totals (e.g. "182 of 180 Spans")
            // because the tab query returns fresh data while metrics remain cached.
            refreshMetrics();
          }
        });
      });
    },
    [query, sort, resultKeys, dispatch, services, applyPanelVisibility, refreshMetrics]
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
      <div className="agentTracesTabs__panels" ref={panelsRef}>
        {filteredTabs.map((tab) => {
          if (!visitedTabs.has(tab.id)) return null;
          return <TabPanel key={tab.id} tab={tab} />;
        })}
      </div>
    </div>
  );
};

/**
 * Inner content of a tab panel, memoized separately from the outer shell.
 * `tab` is a stable reference from the registry, so this component never
 * re-renders after mount — React skips the entire subtree.
 */
const TabPanelContent = React.memo(({ tab }: { tab: TabDefinition }) => (
  <ErrorGuard registryTab={tab}>
    <tab.component />
  </ErrorGuard>
));

/**
 * Outer panel shell.  Receives only `tab` (stable registry reference),
 * so React.memo always bails out after the initial mount.  Visibility is
 * toggled imperatively by the parent via `useLayoutEffect` + classList,
 * which avoids React traversing the heavy content subtree entirely.
 */
const TabPanel = React.memo(({ tab }: { tab: TabDefinition }) => (
  <div role="tabpanel" data-tab-id={tab.id} className="agentTracesTabs__panel">
    <TabIdContext.Provider value={tab.id}>
      <TabPanelContent tab={tab} />
    </TabIdContext.Provider>
  </div>
));
