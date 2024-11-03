/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export class DuplicateCollaboratorError {
  constructor(
    private _details: {
      pendingAdded: string[];
      existing: string[];
    }
  ) {}
  public get details() {
    return this._details;
  }
}
