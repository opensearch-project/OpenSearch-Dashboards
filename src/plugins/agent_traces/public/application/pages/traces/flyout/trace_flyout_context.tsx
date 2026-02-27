/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { TraceDetailsFlyout } from './trace_details_flyout';
import { TraceRow } from '../hooks/use_agent_traces';
import { useSidebarPanel } from '../../../../components/container/bottom_container/sidebar_panel_context';

interface FlyoutState {
  trace: TraceRow;
  fullTree?: TraceRow[];
  isLoadingFullTree?: boolean;
  fullTreeError?: string;
}

interface TraceFlyoutContextValue {
  /** Open the trace details flyout for a given trace/span row. */
  openFlyout: (trace: TraceRow) => void;
  /** Close the currently open flyout. */
  closeFlyout: () => void;
  /** Update the full tree and loading state after async fetch completes. */
  updateFlyoutFullTree: (
    fullTree: TraceRow[] | undefined,
    isLoading: boolean,
    error?: string
  ) => void;
}

const TraceFlyoutContext = createContext<TraceFlyoutContextValue | null>(null);

export const useTraceFlyout = (): TraceFlyoutContextValue => {
  const ctx = useContext(TraceFlyoutContext);
  if (!ctx) {
    throw new Error('useTraceFlyout must be used within a TraceFlyoutProvider');
  }
  return ctx;
};

export const TraceFlyoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flyoutState, setFlyoutState] = useState<FlyoutState | null>(null);
  const { collapseSidebar } = useSidebarPanel();

  const openFlyout = useCallback(
    (trace: TraceRow) => {
      collapseSidebar();
      setFlyoutState({
        trace,
        fullTree: undefined,
        isLoadingFullTree: true,
        fullTreeError: undefined,
      });
    },
    [collapseSidebar]
  );

  const closeFlyout = useCallback(() => {
    setFlyoutState(null);
  }, []);

  const updateFlyoutFullTree = useCallback(
    (fullTree: TraceRow[] | undefined, isLoading: boolean, error?: string) => {
      setFlyoutState((prev) => {
        if (!prev) return prev;
        return { ...prev, fullTree, isLoadingFullTree: isLoading, fullTreeError: error };
      });
    },
    []
  );

  const value = useMemo(() => ({ openFlyout, closeFlyout, updateFlyoutFullTree }), [
    openFlyout,
    closeFlyout,
    updateFlyoutFullTree,
  ]);

  return (
    <TraceFlyoutContext.Provider value={value}>
      {children}
      {flyoutState && (
        <TraceDetailsFlyout
          trace={flyoutState.trace}
          onClose={closeFlyout}
          fullTree={flyoutState.fullTree}
          isLoadingFullTree={flyoutState.isLoadingFullTree}
          fullTreeError={flyoutState.fullTreeError}
        />
      )}
    </TraceFlyoutContext.Provider>
  );
};
