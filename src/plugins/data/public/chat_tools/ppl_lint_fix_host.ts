/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Identity of one editor surface that can host the AI lint-fix flow. Two hosts
 * exist today — the Discover/data search bar and the Explore query panel — and
 * they differ only in their tool names, their assistant-context key, and how a
 * fix reaches the editor. Everything else (session store, candidate evaluator,
 * approve card, tool descriptions) is shared, so a new surface needs a descriptor
 * and an apply handler, nothing more.
 */
export interface PPLLintFixHost {
  /** Tool the model calls to propose a fix; renders the approve card. */
  applyToolName: string;
  /**
   * Silent companion to {@link applyToolName}. The model calls this to check a
   * candidate without showing the user anything; only a candidate that passes
   * here should be handed to the apply tool. Keeps rejected fixes out of view.
   */
  testToolName: string;
  /**
   * Prefix for the assistant-context-store entry carrying a fix request's
   * out-of-band metadata (correlation ids + tool instructions). Keyed by
   * requestId so it can be added when chat opens and removed once the fix is
   * applied or dismissed. Shared between the editor (which adds it) and the tool
   * registration (which removes it).
   */
  contextIdPrefix: string;
  /** Surface name used in tool descriptions and result messages. */
  surfaceLabel: string;
}

/** JSON schema for the apply tool's arguments. Identical across hosts. */
export const PPL_LINT_FIX_APPLY_PARAMETERS = {
  type: 'object' as const,
  properties: {
    fixedQuery: {
      type: 'string',
      description: 'The complete corrected OpenSearch PPL query.',
    },
    explanation: {
      type: 'string',
      description: 'One short plain-language sentence that says what changed and why it helps.',
    },
  },
  required: ['fixedQuery'],
};

/** JSON schema for the silent test tool's arguments. Identical across hosts. */
export const PPL_LINT_FIX_TEST_PARAMETERS = {
  type: 'object' as const,
  properties: {
    fixedQuery: {
      type: 'string',
      description: 'A complete candidate corrected OpenSearch PPL query to check.',
    },
  },
  required: ['fixedQuery'],
};

/**
 * Description for the apply tool. The active request is tracked by the UI, so the
 * model is told not to pass correlation ids — weak models filled them with wrong
 * values (rule names, query text), which tripped false staleness failures and,
 * because a failure result prompts a retry, sent the model into a tool-call loop.
 */
export function buildApplyToolDescription(host: PPLLintFixHost): string {
  return (
    `Proposes a corrected OpenSearch PPL query for the active ${host.surfaceLabel} lint-fix ` +
    'request. This tool does not execute the query; the UI asks the user to approve before the ' +
    'editor is updated. Call it directly with the corrected query — the active request is ' +
    'tracked by the UI, so no request id or hash is needed.'
  );
}

/**
 * Description for the silent test tool. Spells out the two-step contract, because
 * the model must verify a candidate before the user ever sees a card, and must
 * stop rather than propose a fix when nothing clears.
 */
export function buildTestToolDescription(host: PPLLintFixHost): string {
  return (
    `Silently checks whether a candidate OpenSearch PPL query would fix the active ` +
    `${host.surfaceLabel} lint finding, WITHOUT showing anything to the user or changing the ` +
    'editor. Returns { ok, reason, message, requiredRewrite? }. Call this first to try a ' +
    `candidate fix; only pass a candidate whose result was ok:true to the ${host.applyToolName} ` +
    'tool. If no candidate returns ok:true, tell the user the query cannot be automatically ' +
    'fixed and do NOT call the apply tool. Never call a query execution or search tool during ' +
    'this fix flow.'
  );
}

/**
 * Appended to a failed test-tool result when the diagnostic carries literal
 * rewrite instructions, so the model retries against the contract instead of
 * improvising a different query.
 */
export function buildRetryContractMessage(host: PPLLintFixHost, message: string): string {
  return (
    `${message} Retry by following requiredRewrite literally, without changing any quoted ` +
    `text. Use only ${host.testToolName} and ${host.applyToolName}; do not execute the query.`
  );
}

/** Rules whose finding comes from `_explain` attribution rather than the parse tree. */
export const PERFORMANCE_RULE_IDS = new Set(['operation-not-pushed', 'operation-pushed-as-script']);
