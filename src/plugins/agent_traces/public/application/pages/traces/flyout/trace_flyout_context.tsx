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
  FlyoutView,
  OpenTraceOptions,
  TraceFlyoutContext,
  TraceFlyoutContextValue,
} from './trace_flyout_state';

export { useTraceFlyout } from './trace_flyout_state';

/**
 * Hosts the single Agent Traces flyout. A trace and a session never stack: opening one
 * replaces the other, and a trace opened from a session links back to it.
 */
export const TraceFlyoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [view, setView] = useState<FlyoutView | null>(null);
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
      setView({
        kind: 'trace',
        trace,
        fullTree: undefined,
        isLoadingFullTree: true,
        fullTreeError: undefined,
        fromSession: options?.fromSession,
      });
    },
    [collapseSidebar]
  );

  const openSession = useCallback(
    (session: SessionRow | string) => {
      collapseSidebar();
      setView(
        typeof session === 'string'
          ? { kind: 'session', sessionId: session }
          : { kind: 'session', sessionId: session.sessionId, session }
      );
    },
    [collapseSidebar]
  );

  const closeFlyout = useCallback(() => {
    setView(null);
  }, []);

  const updateFlyoutFullTree = useCallback(
    (fullTree: TraceRow[] | undefined, isLoading: boolean, error?: string) => {
      setView((prev) => {
        if (!prev || prev.kind !== 'trace') return prev;
        return { ...prev, fullTree, isLoadingFullTree: isLoading, fullTreeError: error };
      });
    },
    []
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
          trace={view.trace}
          onClose={closeFlyout}
          fullTree={view.fullTree}
          isLoadingFullTree={view.isLoadingFullTree}
          fullTreeError={view.fullTreeError}
          onOpenSession={openSession}
          fromSession={view.fromSession}
        />
      )}
      {view?.kind === 'session' && (
        <SessionFlyoutHost
          // A new session gets a fresh flyout (focused trace, view and tab reset).
          key={view.sessionId}
          sessionId={view.sessionId}
          session={view.session}
          formatTs={formatTs}
          onClose={closeFlyout}
        />
      )}
    </TraceFlyoutContext.Provider>
  );
};
