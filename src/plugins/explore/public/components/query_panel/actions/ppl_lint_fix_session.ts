/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The AI lint-fix session store lives in the data plugin so both editor hosts
 * (the Discover search bar and this query panel) share one active request, one
 * outcome signal, and one candidate evaluator. This module only re-exports it
 * under the names Explore's callers already use.
 *
 * See `src/plugins/data/public/chat_tools/ppl_lint_fix_session.ts`.
 */
export {
  clearPPLLintFixSession as clearActivePPLLintFixSession,
  getPPLLintFixSession as getActivePPLLintFixSession,
  getPPLLintFixOutcome,
  markPPLLintFixApplied,
  markPPLLintFixDismissed,
  markPPLLintFixFailed,
  storePPLLintFixSession as setActivePPLLintFixSession,
  subscribePPLLintFixOutcome,
} from '../../../../../data/public';

export type { PPLLintFixOutcome, PPLLintFixSession } from '../../../../../data/public';

export {
  PPL_LINT_FIX_EXPLORE_HOST,
  APPLY_PPL_LINT_FIX_EXPLORE_TOOL_NAME,
  TEST_PPL_LINT_FIX_EXPLORE_TOOL_NAME,
  PPL_LINT_FIX_CONTEXT_ID_PREFIX,
} from './ppl_lint_fix_host';
