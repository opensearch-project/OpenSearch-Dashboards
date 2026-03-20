/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export class MLClientError extends Error {
  public statusCode?: number;
  public statusText?: string;
}
