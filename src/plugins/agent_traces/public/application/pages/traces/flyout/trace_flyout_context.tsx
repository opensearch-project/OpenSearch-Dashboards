/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useCallback, useMemo } from 'react';
import moment from 'moment-timezone';
import { TraceDetailsFlyout } from './trace_details_flyout';
import { TraceRow, formatTimestamp } from '../hooks/tree_utils';
import { useSidebarPanel } from '../../../../components/container/bottom_container/sidebar_panel_context';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { AgentTracesServices } from '../../../../types';
import { SessionFlyoutHost } from '../../sessions/session_flyout_host';
import { SessionRow } from '../../sessions/session_utils';
import {
  EMPTY_HISTORY,
  FlyoutHistory,
  FlyoutNavigation,
  FlyoutView,
  OpenSessionOptions,
  OpenTraceOptions,
  TraceFlyoutContext,
  TraceFlyoutContextValue,
  currentView,
  moveHistory,
  navigationTargets,
  pushHistory,
  resetHistory,
} from './trace_flyout_state';

export { useTraceFlyout } from './trace_flyout_state';

/**
 * Hosts the single Agent Traces flyout. A trace and a session never stack: opening one
 * replaces the other. Moves between them are kept in a history, so Back and Forward in
 * the flyout header follow the user's path.
 */
export const TraceFlyoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<FlyoutHistory>(EMPTY_HISTORY);
  const view = currentView(history);
  const { collapseSidebar } = useSidebarPanel();
  const { services } = useOpenSearchDashboards<AgentTracesServices>();

  const timezone = useMemo(() => {
    const tz = services?.uiSettings?.get('dateFormat:tz');
    if (tz && tz !== 'Browser') return tz;
    return moment.tz.guess() || moment().format('Z');
  }, [services?.uiSettings]);
  const formatTs = useCallback((ts: string) => formatTimestamp(ts, timezone), [timezone]);

  const openFlyout = useCallback(
    (trace: TraceRow, options?: OpenTraceOptions) => {
      collapseSidebar();
      const next: FlyoutView = {
        kind: 'trace',
        trace,
        fullTree: undefined,
        isLoadingFullTree: true,
        fullTreeError: undefined,
      };
      setHistory((prev) =>
        options?.fromSession
          ? pushHistory(prev, next, (current) =>
              current.kind === 'session' ? { ...current, focusTraceId: trace.traceId } : current
            )
          : resetHistory(next)
      );
    },
    [collapseSidebar]
  );

  const openSession = useCallback(
    (session: SessionRow | string, options?: OpenSessionOptions) => {
      collapseSidebar();
      const next: FlyoutView =
        typeof session === 'string'
          ? { kind: 'session', sessionId: session }
          : { kind: 'session', sessionId: session.sessionId, session };
      setHistory((prev) => (options?.fromTrace ? pushHistory(prev, next) : resetHistory(next)));
    },
    [collapseSidebar]
  );

  const closeFlyout = useCallback(() => {
    setHistory(EMPTY_HISTORY);
  }, []);

  const updateFlyoutFullTree = useCallback(
    (fullTree: TraceRow[] | undefined, isLoading: boolean, error?: string) => {
      setHistory((prev) => ({
        ...prev,
        // The trace being loaded: the one shown, or one the user already left while it loaded.
        entries: prev.entries.map((entry, i) =>
          entry.kind === 'trace' && (i === prev.index || entry.isLoadingFullTree)
            ? { ...entry, fullTree, isLoadingFullTree: isLoading, fullTreeError: error }
            : entry
        ),
      }));
    },
    []
  );

  const navigation = useMemo<FlyoutNavigation>(
    () => ({
      ...navigationTargets(history),
      onBack: () => setHistory((prev) => moveHistory(prev, -1)),
      onForward: () => setHistory((prev) => moveHistory(prev, 1)),
    }),
    [history]
  );

  const activeSessionId = view?.kind === 'session' ? view.sessionId : undefined;

  const value = useMemo<TraceFlyoutContextValue>(
    () => ({ openFlyout, openSession, closeFlyout, updateFlyoutFullTree, activeSessionId }),
    [openFlyout, openSession, closeFlyout, updateFlyoutFullTree, activeSessionId]
  );

  return (
    <TraceFlyoutContext.Provider value={value}>
      {children}
      {view?.kind === 'trace' && (
        <TraceDetailsFlyout
          // Each history entry gets a fresh flyout (selected span, tab).
          key={`trace-${history.index}`}
          trace={view.trace}
          onClose={closeFlyout}
          fullTree={view.fullTree}
          isLoadingFullTree={view.isLoadingFullTree}
          fullTreeError={view.fullTreeError}
          onOpenSession={(session) => openSession(session, { fromTrace: true })}
          navigation={navigation}
        />
      )}
      {view?.kind === 'session' && (
        <SessionFlyoutHost
          // A new session gets a fresh flyout (focused trace, view and tab reset).
          key={`session-${history.index}-${view.sessionId}`}
          sessionId={view.sessionId}
          session={view.session}
          focusTraceId={view.focusTraceId}
          formatTs={formatTs}
          onClose={closeFlyout}
          navigation={navigation}
        />
      )}
    </TraceFlyoutContext.Provider>
  );
};
