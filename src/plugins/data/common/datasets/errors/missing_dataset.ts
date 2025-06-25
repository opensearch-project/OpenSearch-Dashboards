/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export class MissingDatasetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MissingDatasetError';
  }
}
