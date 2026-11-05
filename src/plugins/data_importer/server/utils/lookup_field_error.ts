/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Thrown by `ensureLookupField` when an import identifier was requested for an existing index but
 * the lookup field cannot be made filterable by exact value (it is mapped with an unusable type, or
 * the user may not update the mapping). Raised BEFORE any row is written, so the import fails
 * cleanly instead of producing a lookup alias whose `term` filter silently matches nothing.
 *
 * `statusCode` is 403 for a permission denial and 400 otherwise, so route handlers can respond
 * `forbidden` / `badRequest`. Kept in its own file because the repo enforces one class per file.
 */
export class LookupFieldError extends Error {
  constructor(
    message: string,
    public readonly statusCode: 400 | 403 = 400
  ) {
    super(message);
    this.name = 'LookupFieldError';
  }
}
