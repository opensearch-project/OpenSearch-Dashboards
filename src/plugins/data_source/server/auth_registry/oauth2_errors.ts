/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Custom error class for OAuth2 non-retryable errors (4xx client errors except 408/429)
 */
export class OAuth2NonRetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OAuth2NonRetryableError';
  }
}
