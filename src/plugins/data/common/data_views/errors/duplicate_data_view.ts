/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export class DuplicateDataViewError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateDataViewError';
  }
}
