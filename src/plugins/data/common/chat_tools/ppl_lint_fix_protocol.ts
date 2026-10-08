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

export const PPL_LINT_FIX_APPROVAL_NONCE_CONTEXT_SUFFIX = '::approval-nonce';

/**
 * Args an out-of-realm caller sets to authorize a confirmed apply, standing in
 * for the in-process symbol binding the card uses (a Symbol cannot survive
 * postMessage serialization). The value is a per-request nonce, minted with the
 * request and published only under PPL_LINT_FIX_REQUEST_CATEGORY, which every
 * agent payload strips — so the model never sees it and cannot authorize an
 * apply by naming the (public) request id. Never carry this over a channel the
 * model can read, and never substitute the request id for it.
 */
export interface PPLLintFixApprovalArgs {
  __approvedNonce?: string;
}
