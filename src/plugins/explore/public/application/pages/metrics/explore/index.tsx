/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './index.scss';

import { isEqual } from 'lodash';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { EXPLORE_VISUALIZATION_TAB_ID } from '../../../../../common';
import { ExploreServices } from '../../../../types';
import { useSetEditorText } from '../../../hooks/editor_hooks/use_set_editor_text/use_set_editor_text';
import { runQueryActionCreator } from '../../../utils/state_management/actions/query_editor/run_query/run_query';
import { clearLastExecutedData } from '../../../utils/state_management/slices';
import { setHasUserInitiatedQuery } from '../../../utils/state_management/slices/query_editor/query_editor_slice';
import { setMetricsExploreState } from '../../../utils/state_management/slices/tab/tab_slice';
import {
  setActiveTab,
  setMetricsPageMode,
} from '../../../utils/state_management/slices/ui/ui_slice';
import { RootState } from '../../../utils/state_management/store';
import type { AppDispatch } from '../../../utils/state_management/store';
import { CursorContext, createCursorBus } from './hooks/cursor_context';
import {
  ExplorationContext,
  defaultState,
  explorationReducer,
} from './contexts/exploration_context';
import { MetricBrowser } from './components/metric_browser';
import { MetricDetail } from './components/metric_detail';
import { PrometheusClient } from './services/prometheus_client';
import { MetricQueryGenerator } from './services/query_generator';
import { ExplorationLevel, ExplorationState } from './types';

export const MetricsExploreTab = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const reduxDispatch: AppDispatch = useDispatch();
  const queryState = useSelector((state: RootState) => state.query);
  const savedTabState = useSelector((state: RootState) => state.tab.metricsExplore);
  const hasUserInitiatedQuery = useSelector(
    (state: RootState) => state.queryEditor.hasUserInitiatedQuery
  );
  const dataConnectionId = queryState.dataset?.id || '';

  // Initialize from Redux (which was loaded from URL) or default
  const initialState = useMemo(
    () =>
      savedTabState ? ({ ...defaultState, ...savedTabState } as ExplorationState) : defaultState,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // only on mount
  );
  const [state, dispatch] = useReducer(explorationReducer, initialState);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const setEditorText = useSetEditorText();
  const queryGenRef = useRef(new MetricQueryGenerator());

  const client = useMemo(() => {
    return new PrometheusClient(services, dataConnectionId);
  }, [services, dataConnectionId]);

  // Sync local state → Redux (for URL persistence)
  const prevStateRef = useRef(state);
  useEffect(() => {
    if (!isEqual(prevStateRef.current, state)) {
      const levelChanged = prevStateRef.current.level !== state.level;
      prevStateRef.current = state;

      const metricsExplore = {
        level: state.level,
        search: state.search,
        metric: state.metric,
        label: state.label,
        filters: state.filters,
        grouping: state.grouping,
      };

      // When the exploration level changes from a user action (not a POP restore),
      // attach pushHistory meta so the persistence middleware creates a history entry.
      const pushHistory = levelChanged && !restoringRef.current;
      reduxDispatch({
        type: setMetricsExploreState.type,
        payload: metricsExplore,
        meta: pushHistory ? { pushHistory: true } : undefined,
      });
      restoringRef.current = false;
    }
  }, [state, reduxDispatch]);

  // Restore from Redux on browser back/forward (URL → Redux → here)
  const restoringRef = useRef(false);
  const prevSavedRef = useRef(savedTabState);
  useEffect(() => {
    const target = savedTabState ?? defaultState;
    if (!isEqual(target, prevStateRef.current) && savedTabState !== prevSavedRef.current) {
      restoringRef.current = true;
      dispatch({ type: 'RESTORE', state: target });
    }
    prevSavedRef.current = savedTabState;
  }, [savedTabState]);

  // Handle query bar refresh button
  // The metrics explore tab bypasses the normal query pipeline (uses its own PrometheusClient),
  // so the overall_status_middleware never resets hasUserInitiatedQuery to false.
  // We must reset it ourselves so the next refresh click triggers a false→true transition.
  //
  // When a metric is selected (DETAIL/BREAKDOWN level), refresh switches to the Visualization
  // tab and executes the metric's PromQL query — matching the "Execute" button behavior.
  // At BROWSER level (no metric selected), refresh just reloads sparklines and metadata.
  const dateRange = useSelector((s: RootState) => s.queryEditor.dateRange);
  useEffect(() => {
    if (hasUserInitiatedQuery) {
      // Sync Redux dateRange to the timefilter service before queries execute.
      // The timefilter_sync_middleware only syncs on executeQueries/executeTabQuery actions,
      // which this tab bypasses. Without this, PromQLSearchInterceptor reads a stale time range.
      if (dateRange && services.data?.query?.timefilter?.timefilter) {
        const timefilter = services.data.query.timefilter.timefilter;
        if (!isEqual(timefilter.getTime(), dateRange)) {
          timefilter.setTime(dateRange);
        }
      }
      client.clearCache();
      setRefreshCounter((c) => c + 1);
      reduxDispatch(setHasUserInitiatedQuery(false));
    }
  }, [
    hasUserInitiatedQuery,
    client,
    reduxDispatch,
    dateRange,
    services.data?.query?.timefilter?.timefilter,
  ]);

  // Refresh when time range changes externally (e.g. browser back/forward, date picker)
  useEffect(() => {
    const timefilter = services.data?.query?.timefilter?.timefilter;
    if (!timefilter) return;
    const sub = timefilter.getTimeUpdate$().subscribe(() => {
      client.clearCache();
      setRefreshCounter((c) => c + 1);
    });
    return () => sub.unsubscribe();
  }, [services.data?.query?.timefilter?.timefilter, client]);

  // Abort pending queries on unmount
  useEffect(() => {
    return () => client.abort();
  }, [client]);

  const executePromQL = useCallback(
    (promql: string) => {
      setEditorText(promql);
      reduxDispatch(setMetricsPageMode('query'));
      reduxDispatch(setActiveTab(EXPLORE_VISUALIZATION_TAB_ID));
      reduxDispatch(setHasUserInitiatedQuery(true));
      reduxDispatch(clearLastExecutedData());
      reduxDispatch(runQueryActionCreator(services, promql));
    },
    [reduxDispatch, services, setEditorText]
  );

  function renderContent() {
    switch (state.level) {
      case ExplorationLevel.DETAIL:
        return <MetricDetail />;
      default:
        return <MetricBrowser />;
    }
  }

  const cursorBus = useMemo(() => createCursorBus(), []);

  const handleTimeRangeChange = useCallback(
    (from: string, to: string) => {
      const timefilter = services.data?.query?.timefilter?.timefilter;
      if (timefilter) {
        timefilter.setTime({ from, to });
        client.clearCache();
        setRefreshCounter((c) => c + 1);
      }
    },
    [services.data?.query?.timefilter?.timefilter, client]
  );

  return (
    <ExplorationContext.Provider
      value={{
        state,
        dispatch,
        client,
        queryGen: queryGenRef.current,
        executePromQL,
        refreshCounter,
        onTimeRangeChange: handleTimeRangeChange,
      }}
    >
      <CursorContext.Provider value={cursorBus}>
        <div className="metricsExploreTab">{renderContent()}</div>
      </CursorContext.Provider>
    </ExplorationContext.Provider>
  );
};
