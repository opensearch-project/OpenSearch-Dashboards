/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Extracts a human-readable reason from a query error body, handling the
 * various shapes returned by the different search strategies. Shared between
 * the query editor error UI and the Discover "Ask AI for help" escalation flow
 * so the parsing heuristics stay in one place.
 */
export function extractQueryError(errorBody: any): string {
  if (errorBody?.shortMessage) {
    return errorBody.shortMessage;
  }
  const message = errorBody?.message;
  const inner = errorBody?.attributes?.error || message?.error;
  return (
    (typeof inner === 'string'
      ? inner
      : inner?.root_cause?.[0]?.reason || inner?.details || inner?.reason) ||
    (typeof message === 'string' ? message : undefined) ||
    errorBody?.error ||
    'Query execution failed'
  );
}

/**
 * Message template sent to the AI assistant when the user asks for help with a
 * query that failed to run. `{error}` is replaced with the reason returned by
 * {@link extractQueryError}.
 */
export const ASK_AI_ERROR_MESSAGE =
  'My query on this page failed to run with the following error: "{error}". Please review my query, fix it, and run the corrected query on the page so I can see the results.';
