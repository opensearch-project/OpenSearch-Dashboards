/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Thrown when a `_bulk` request is rejected wholesale with a 403 (e.g. the user can read the
 * target index but lacks `indices:data/write/bulk`). This is a whole-import authorization failure,
 * NOT a per-document data problem: surfacing it as one actionable permission error prevents the
 * confusing "failed to upload" + N distinct failed-document-id buckets users otherwise see when
 * every row is rejected for the same missing privilege. Carries `statusCode = 403` so route
 * handlers can respond `forbidden`.
 *
 * Kept in its own file because `util.ts` already defines `IndexAccessForbiddenError` and the repo
 * enforces one class per file; `util.ts` re-exports this so existing imports resolve from there.
 */
export class BulkIndexForbiddenError extends Error {
  public readonly statusCode = 403;
  constructor(message: string) {
    super(message);
    this.name = 'BulkIndexForbiddenError';
  }
}
