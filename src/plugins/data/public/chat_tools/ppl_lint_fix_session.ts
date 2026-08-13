/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AskPPLLintFixRequest, PPLLintContext } from '@osd/monaco';
import type { Query } from '../../common';
import type { PPLLintFixHost } from './ppl_lint_fix_host';

export type { AskPPLLintFixRequest } from '@osd/monaco';

/**
 * One in-flight fix request and the live accessors the tools need to evaluate it.
 * Host-agnostic: the Discover search bar and the Explore query panel both store
 * sessions here, so only one request is ever active across the whole app.
 *
 * `getCurrentQueryState` is optional because only the search-bar host needs the
 * full `Query` object (it reapplies language/dataset when setting the fix);
 * Explore writes the query text straight into its editor.
 */
export interface PPLLintFixSession {
  host: PPLLintFixHost;
  request: AskPPLLintFixRequest;
  getCurrentQuery: () => string | undefined;
  getLintContext: () => PPLLintContext;
  getCurrentQueryState?: () => Query;
  chatThreadId?: string;
  getCurrentChatThreadId?: () => string | undefined;
}

let activeSession: PPLLintFixSession | undefined;

/**
 * Terminal outcome of a request, driven directly by the card's Apply/Dismiss click
 * and the apply handler — NOT by the framework's tool-call status. The framework
 * status only flips after the chat plugin finishes sending the tool result, which
 * waits on the model's follow-up AG-UI turn (observed at 60–128s live, and it can
 * hang). Gating the card on that made both buttons look dead: the query updated
 * (or the dismiss happened) but the card stayed frozen with its buttons up. This
 * local signal lets the card reach its terminal state the instant the user acts.
 */
export type PPLLintFixOutcome =
  | { kind: 'applied'; fixedQuery?: string }
  | { kind: 'failed'; message?: string }
  | { kind: 'dismissed' };

export type RemovePPLLintFixContextById = (contextId: string) => void;

const MAX_RETAINED_FIX_OUTCOMES = 100;
const fixOutcomes = new Map<string, PPLLintFixOutcome>();
const outcomeSubscribers = new Set<() => void>();

function notifyOutcomeSubscribers(): void {
  outcomeSubscribers.forEach((cb) => cb());
}

function recordFixOutcome(requestId: string, outcome: PPLLintFixOutcome): void {
  fixOutcomes.delete(requestId);
  fixOutcomes.set(requestId, outcome);
  if (fixOutcomes.size > MAX_RETAINED_FIX_OUTCOMES) {
    const oldestRequestId = fixOutcomes.keys().next().value;
    if (oldestRequestId !== undefined) {
      fixOutcomes.delete(oldestRequestId);
    }
  }
  notifyOutcomeSubscribers();
}

export function storePPLLintFixSession(session: PPLLintFixSession): void {
  activeSession = session;
  // A fresh request starts with no outcome so its card shows the Apply/Dismiss
  // buttons rather than inheriting a previous fix's terminal state.
  fixOutcomes.delete(session.request.requestId);
  notifyOutcomeSubscribers();
}

/** Record that the fix was applied to the editor, for immediate card feedback. */
export function markPPLLintFixApplied(requestId: string, fixedQuery?: string): void {
  recordFixOutcome(requestId, {
    kind: 'applied',
    ...(fixedQuery !== undefined ? { fixedQuery: fixedQuery.trim() } : {}),
  });
}

/** Record that the fix could not be applied, for immediate card feedback. */
export function markPPLLintFixFailed(requestId: string, message?: string): void {
  recordFixOutcome(requestId, { kind: 'failed', message });
}

/** Record that the user dismissed the active fix, for immediate card feedback. */
export function markPPLLintFixDismissed(requestId: string): void {
  recordFixOutcome(requestId, { kind: 'dismissed' });
}

/** The requested fix's terminal outcome, or undefined while it is still pending. */
export function getPPLLintFixOutcome(requestId: string): PPLLintFixOutcome | undefined {
  return fixOutcomes.get(requestId);
}

/** Subscribe to outcome changes so an idle fix card can re-render when the user acts. */
export function subscribePPLLintFixOutcome(callback: () => void): () => void {
  outcomeSubscribers.add(callback);
  return () => outcomeSubscribers.delete(callback);
}

export function getPPLLintFixSession(requestId?: string): PPLLintFixSession | undefined {
  // With no requestId, return the single active session. Callers no longer key on
  // a model-provided requestId (weak models fill it with wrong values); the active
  // session is the source of truth and staleness is checked against its own query.
  if (!requestId) {
    return activeSession;
  }
  return activeSession?.request.requestId === requestId ? activeSession : undefined;
}

export function clearPPLLintFixSession(requestId?: string): void {
  if (!requestId || activeSession?.request.requestId === requestId) {
    const hadActiveSession = activeSession !== undefined;
    activeSession = undefined;
    if (hadActiveSession) {
      notifyOutcomeSubscribers();
    }
  }
}

/**
 * Release both resources owned by a request. Context removal is unconditional,
 * while session removal is request-scoped so late cleanup cannot clear a newer
 * active request.
 */
export function cleanupPPLLintFixRequest(
  requestId: string,
  contextIdPrefix: string,
  removeContextById?: RemovePPLLintFixContextById
): void {
  try {
    removeContextById?.(contextIdPrefix + requestId);
  } finally {
    clearPPLLintFixSession(requestId);
  }
}
