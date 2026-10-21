/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext } from 'react';
import { TraceRow } from '../hooks/tree_utils';
import { SessionRow } from '../../sessions/session_utils';

/**
 * One flyout slot for Agent Traces: either a trace or a session, never both stacked.
 * Moving between them (session -> one of its traces, trace -> its session) replaces the
 * flyout and is recorded as a drill-down: Back returns to the flyout the user came from and
 * forgets the one left, so there is no Forward and no loop between a trace and its session.
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
    }
  | {
      kind: 'session';
      sessionId: string;
      /** Session row when already loaded (from the sessions list); fetched otherwise. */
      session?: SessionRow;
      /** Trace to focus when the session shows again (the one the user opened from it). */
      focusTraceId?: string;
      /** The agent run of that trace, when the trace lists several (parallel agents). */
      focusSpanId?: string;
      /** Session view and table tab the user left the session on, restored on Back. */
      sessionView?: SessionViewState;
    };

/** Where the user was in the session flyout: the conversation or the All traces/spans table. */
export interface SessionViewState {
  view: 'overview' | 'all';
  drillTab: 'traces' | 'spans';
}

/** Flyouts visited since the flyout was opened from a table, and the one shown. */
export interface FlyoutHistory {
  entries: FlyoutView[];
  index: number;
}

export const EMPTY_HISTORY: FlyoutHistory = { entries: [], index: -1 };

export const currentView = (history: FlyoutHistory): FlyoutView | null =>
  history.entries[history.index] ?? null;

/** Start over with one flyout (opened from a table, not from another flyout). */
export const resetHistory = (view: FlyoutView): FlyoutHistory => ({ entries: [view], index: 0 });

/**
 * Show a flyout reached from the current one. `updateCurrent` records state on the flyout
 * being left (e.g. the trace a session was left for), so going back restores it.
 */
export const pushHistory = (
  history: FlyoutHistory,
  view: FlyoutView,
  updateCurrent?: (current: FlyoutView) => FlyoutView
): FlyoutHistory => {
  const kept = history.entries.slice(0, history.index + 1);
  const last = kept.length - 1;
  if (updateCurrent && last >= 0) kept[last] = updateCurrent(kept[last]);
  return { entries: [...kept, view], index: kept.length };
};

/** Return to the flyout the current one was opened from, forgetting the current one. */
export const backHistory = (history: FlyoutHistory): FlyoutHistory =>
  history.index > 0
    ? { entries: history.entries.slice(0, history.index), index: history.index - 1 }
    : history;

/** The flyout the current one was opened from. */
export const previousView = (history: FlyoutHistory): FlyoutView | undefined =>
  history.entries[history.index - 1];

export type TraceView = Extract<FlyoutView, { kind: 'trace' }>;
export type SessionView = Extract<FlyoutView, { kind: 'session' }>;

/**
 * Open a trace from the session flyout. When the session was itself opened from that trace,
 * go back to it instead of repeating it (no trace -> session -> trace loop), showing the row
 * picked (another agent of the same trace). Otherwise drill down, recording on the session
 * which agent run was opened and where the session was left, so Back restores both.
 */
export const openTraceFromSession = (
  history: FlyoutHistory,
  next: TraceView,
  sessionView?: SessionViewState
): FlyoutHistory => {
  const previous = previousView(history);
  if (previous?.kind === 'trace' && previous.trace.traceId === next.trace.traceId) {
    const back = backHistory(history);
    const entries = [...back.entries];
    entries[back.index] = previous.trace.spanId === next.trace.spanId ? previous : next;
    return { ...back, entries };
  }
  return pushHistory(history, next, (current) =>
    current.kind === 'session'
      ? {
          ...current,
          focusTraceId: next.trace.traceId,
          focusSpanId: next.trace.spanId,
          sessionView,
        }
      : current
  );
};

/**
 * Open a session from the trace flyout. When the trace was opened from that session, go back
 * to it; otherwise drill down with the trace (and its agent run) focused in the session.
 */
export const openSessionFromTrace = (history: FlyoutHistory, next: SessionView): FlyoutHistory => {
  const previous = previousView(history);
  if (previous?.kind === 'session' && previous.sessionId === next.sessionId) {
    return backHistory(history);
  }
  const current = currentView(history);
  return pushHistory(
    history,
    current?.kind === 'trace'
      ? { ...next, focusTraceId: current.trace.traceId, focusSpanId: current.trace.spanId }
      : next
  );
};

/** Where Back leads, for its label. */
export interface FlyoutHistoryTarget {
  kind: FlyoutView['kind'];
  /** Session id or trace name. */
  label: string;
}

const targetOf = (view: FlyoutView | undefined): FlyoutHistoryTarget | undefined => {
  if (!view) return undefined;
  return view.kind === 'session'
    ? { kind: 'session', label: view.sessionId }
    : { kind: 'trace', label: view.trace.name || view.trace.traceId };
};

/** Back for the flyout that is shown. */
export interface FlyoutNavigation {
  back?: FlyoutHistoryTarget;
  onBack: () => void;
}

export const navigationTargets = (history: FlyoutHistory) => ({
  back: targetOf(previousView(history)),
});

export interface OpenTraceOptions {
  /**
   * Opened from the session flyout: recorded in the flyout history (Back returns to the
   * session, with this trace focused) instead of starting a new one.
   */
  fromSession?: SessionRow;
  /** The session flyout's view and tab when the trace was opened, restored on Back. */
  sessionView?: SessionViewState;
}

export interface OpenSessionOptions {
  /** Opened from the trace flyout: recorded in the flyout history (Back returns to it). */
  fromTrace?: boolean;
}

export interface TraceFlyoutContextValue {
  /** Open the trace details flyout for a given trace/span row. */
  openFlyout: (trace: TraceRow, options?: OpenTraceOptions) => void;
  /** Open the session flyout, from a loaded session row or just its id. */
  openSession: (session: SessionRow | string, options?: OpenSessionOptions) => void;
  /** Close the currently open flyout. */
  closeFlyout: () => void;
  /**
   * Keep a session row that was fetched by id in its history entries, so going back to the
   * session reuses it instead of fetching it again.
   */
  cacheSession: (session: SessionRow) => void;
  /**
   * Update a trace's full tree and loading state after its fetch completes. Keyed by trace
   * id: the history can hold several traces, and a fetch may finish after the user moved on.
   */
  updateFlyoutFullTree: (
    traceId: string,
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
