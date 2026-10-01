/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext } from 'react';
import { TraceRow } from '../hooks/tree_utils';
import { SessionRow } from '../../sessions/session_utils';

/**
 * One flyout slot for Agent Traces: either a trace or a session, never both stacked.
 * Moving between them (trace -> its session, session -> one of its traces) replaces the
 * flyout. A trace opened from a session remembers it, so the trace flyout can go back.
 *
 * Kept free of component imports so the trace and session flyouts can both use the
 * context without a circular import with the provider that renders them.
 */
export type FlyoutView =
  | {
      kind: 'trace';
      trace: TraceRow;
      fullTree?: TraceRow[];
      isLoadingFullTree?: boolean;
      fullTreeError?: string;
      /** The session this trace was opened from, for a "Back to session" link. */
      fromSession?: SessionRow;
    }
  | {
      kind: 'session';
      sessionId: string;
      /** Session row when already loaded (from the sessions list); fetched otherwise. */
      session?: SessionRow;
    };

export interface OpenTraceOptions {
  /** The session the trace is opened from (enables "Back to session"). */
  fromSession?: SessionRow;
}

export interface TraceFlyoutContextValue {
  /** Open the trace details flyout for a given trace/span row. */
  openFlyout: (trace: TraceRow, options?: OpenTraceOptions) => void;
  /** Open the session flyout, from a loaded session row or just its id. */
  openSession: (session: SessionRow | string) => void;
  /** Close the currently open flyout. */
  closeFlyout: () => void;
  /** Update the full tree and loading state after async fetch completes. */
  updateFlyoutFullTree: (
    fullTree: TraceRow[] | undefined,
    isLoading: boolean,
    error?: string
  ) => void;
  /** Id of the session shown in the flyout, if a session is open. */
  activeSessionId?: string;
}

export const TraceFlyoutContext = createContext<TraceFlyoutContextValue | null>(null);

export const useTraceFlyout = (): TraceFlyoutContextValue => {
  const ctx = useContext(TraceFlyoutContext);
  if (!ctx) {
    throw new Error('useTraceFlyout must be used within a TraceFlyoutProvider');
  }
  return ctx;
};
