/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PPLLintFixHost } from '../../../../../data/public';

/**
 * The Explore query-panel host. Its tool names stay distinct from the search bar's
 * so the model can tell the surfaces apart, and so this panel can re-register the
 * same names as `disabled` when it unmounts.
 */
export const PPL_LINT_FIX_EXPLORE_HOST: PPLLintFixHost = {
  applyToolName: 'apply_ppl_lint_fix_explore',
  testToolName: 'test_ppl_lint_fix_explore',
  contextIdPrefix: 'ppl-lint-fix-',
  surfaceLabel: 'Explore query panel',
};

export const APPLY_PPL_LINT_FIX_EXPLORE_TOOL_NAME = PPL_LINT_FIX_EXPLORE_HOST.applyToolName;
export const TEST_PPL_LINT_FIX_EXPLORE_TOOL_NAME = PPL_LINT_FIX_EXPLORE_HOST.testToolName;
export const PPL_LINT_FIX_CONTEXT_ID_PREFIX = PPL_LINT_FIX_EXPLORE_HOST.contextIdPrefix;
