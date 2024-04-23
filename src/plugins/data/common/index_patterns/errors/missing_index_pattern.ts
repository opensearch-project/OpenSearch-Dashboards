/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export class MissingIndexPatternError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MissingIndexPatternError';
  }
}
