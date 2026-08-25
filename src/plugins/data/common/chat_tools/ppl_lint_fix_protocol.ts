/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Cross-realm contract for the PPL lint quick-fix, shared by the query editors
 * (data/explore) and any external assistant that drives the fix from a separate
 * realm. An out-of-tree consumer imports these as types only (erased at build),
 * so it stays a compile-time contract with no cross-bundle runtime dependency.
 */

export const PPL_LINT_FIX_REQUEST_CATEGORY = 'ppl-lint-fix-request';

export type PPLLintFixRequestCategory = typeof PPL_LINT_FIX_REQUEST_CATEGORY;

export const PPL_LINT_FIX_REQUEST_ID_CONTEXT_SUFFIX = '::request-id';

/**
 * Args an out-of-realm caller sets to bind a confirmed apply to its request,
 * standing in for the in-process symbol binding the card uses (a Symbol cannot
 * survive postMessage serialization).
 */
export interface PPLLintFixApprovalArgs {
  __approvedRequestId?: string;
}
