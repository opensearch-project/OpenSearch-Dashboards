/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export class DuplicateCollaboratorError {
  constructor(private _duplicateCollaboratorIds: string[]) {}
  public get duplicateCollaboratorIds() {
    return this._duplicateCollaboratorIds;
  }
}
