/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { validatePPLLintFixCandidate } from '@osd/monaco';
import type { PPLLintFixSession } from './ppl_lint_fix_session';
import { getPPLLintFixSession } from './ppl_lint_fix_session';
import { buildRetryContractMessage } from './ppl_lint_fix_host';
import { verifyPerformanceFixOutcome } from '../ppl_lint/verify_performance_fix_outcome';

/**
 * Machine-readable verdict for a single proposed PPL lint fix candidate. Shared by
 * the silent `test` tool (which returns it to the model so it can iterate) and the
 * user-facing `apply` tool (which uses it as a last-line backstop before it ever
 * renders an approve card). Keeping one evaluator means the two tools can never
 * disagree about whether a candidate is good.
 */
export interface PPLLintFixCandidateEvaluation {
  /** True only when the candidate is a valid, meaning-preserving fix that clears the finding. */
  ok: boolean;
  /**
   * Stable failure code the model can reason about when it decides whether to try
   * another candidate. Absent when `ok` is true.
   */
  reason?: 'empty-candidate' | 'stale-query' | 'invalid-candidate' | 'performance-not-cleared';
  /** One short human-readable sentence, safe to show or log. */
  message: string;
  /**
   * On ok:true, the exact validated query, echoed back so the model can pass it
   * verbatim to the apply tool without re-deriving it or asking the user to
   * re-paste. Absent when `ok` is false.
   */
  validatedQuery?: string;
  /** The validator's own reason string, when the failure came from lint validation. */
  validationReason?: string;
}

/**
 * Run the full acceptance check for a candidate against the active session: PPL
 * lint validation (parse-clean, diagnostic cleared, no new diagnostic, shape
 * preserved) and — for the explain-backed performance rules — an isolated
 * `_explain` re-check that the attributed outcome actually cleared.
 *
 * Never applies anything and never touches the card outcome; it is pure
 * evaluation so both tools can call it freely.
 */
export async function evaluatePPLLintFixCandidate(
  session: PPLLintFixSession,
  rawFixedQuery: unknown,
  isCurrent: () => boolean
): Promise<PPLLintFixCandidateEvaluation> {
  if (typeof rawFixedQuery !== 'string' || !rawFixedQuery.trim()) {
    return { ok: false, reason: 'empty-candidate', message: 'The proposed PPL query is missing.' };
  }

  const currentQueryText = session.getCurrentQuery() ?? '';
  if (currentQueryText !== session.request.query) {
    return {
      ok: false,
      reason: 'stale-query',
      message: 'The editor changed after this PPL lint fix request was created.',
    };
  }

  const fixedQuery = rawFixedQuery.trim();
  const lintContext = session.request.lintContext ?? session.getLintContext();
  const validation = validatePPLLintFixCandidate({
    originalQuery: session.request.query,
    fixedQuery,
    ruleId: session.request.diagnostic.ruleId,
    lintContext,
  });
  if (!validation.accepted) {
    return {
      ok: false,
      reason: 'invalid-candidate',
      validationReason: validation.reason,
      message: `The proposed query did not pass PPL lint validation: ${
        validation.reason || 'unknown'
      }.`,
    };
  }

  const performanceOutcomeCleared = await verifyPerformanceFixOutcome(
    session.request.query,
    fixedQuery,
    session.request.diagnostic,
    session.getLintContext(),
    isCurrent
  );
  if (!isCurrent()) {
    return {
      ok: false,
      reason: 'stale-query',
      message: 'The editor changed while this PPL lint fix was being validated.',
    };
  }
  if (!performanceOutcomeCleared) {
    return {
      ok: false,
      reason: 'performance-not-cleared',
      message: 'The proposed query did not clear the attributed performance outcome.',
    };
  }

  return {
    ok: true,
    validatedQuery: fixedQuery,
    message:
      'Verified: this candidate clears the finding. This was a silent check only — ' +
      'the editor is UNCHANGED and the user has seen nothing yet. You are NOT done. ' +
      'Your next action MUST be to call the apply tool, passing the validatedQuery ' +
      'field from this result verbatim as its fixedQuery argument. Do not reply to ' +
      'the user, do not say the finding is resolved, do not ask for permission, and ' +
      'do not ask the user to paste the query — it is in validatedQuery below. ' +
      'Calling the apply tool renders the Apply/Dismiss card, which is how the user ' +
      'approves and how the fix actually reaches the editor.',
  };
}

/** Shape the silent test tool returns to the model. */
export interface PPLLintFixTestToolResult {
  ok: boolean;
  reason?: string;
  message: string;
  validatedQuery?: string;
  requiredRewrite?: string;
}

/**
 * Full handler for the silent test tool, shared by every host: resolve the active
 * session, evaluate the candidate, and — when the candidate failed and the
 * diagnostic carries literal rewrite instructions — hand the model the retry
 * contract. Renders nothing, applies nothing, never touches the card outcome.
 */
export async function runPPLLintFixTestTool(
  rawFixedQuery: unknown
): Promise<PPLLintFixTestToolResult> {
  const session = getPPLLintFixSession();
  if (!session) {
    return {
      ok: false,
      reason: 'missing-request',
      message: 'The active PPL lint fix request is no longer available.',
    };
  }

  const evaluation = await evaluatePPLLintFixCandidate(
    session,
    rawFixedQuery,
    () =>
      getPPLLintFixSession() === session &&
      (session.getCurrentQuery() ?? '') === session.request.query
  );

  const requiredRewrite = session.request.diagnostic.fixInstructions?.trim();
  const shouldRetryContract =
    !evaluation.ok && !!requiredRewrite && evaluation.reason !== 'stale-query';

  return {
    ok: evaluation.ok,
    reason: evaluation.validationReason ?? evaluation.reason,
    message: shouldRetryContract
      ? buildRetryContractMessage(session.host, evaluation.message)
      : evaluation.message,
    ...(evaluation.validatedQuery !== undefined
      ? { validatedQuery: evaluation.validatedQuery }
      : {}),
    ...(shouldRetryContract ? { requiredRewrite } : {}),
  };
}
