/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Custom error class for endpoint contamination security violations
 */
export class EndpointContaminationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EndpointContaminationError';
  }
}
