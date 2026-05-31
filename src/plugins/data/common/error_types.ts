/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Based on: https://github.com/opensearch-project/sql/pull/5266

export interface QueryPosition {
  line: number;
  column: number;
}

// Structure varies based on error type
export interface OpenSearchErrorContext {
  available_fields?: string[];
  requested_field?: string;
  query_pos?: QueryPosition;
  [key: string]: unknown;
}

export interface OpenSearchError {
  type: string;
  reason: string;
  details?: string;
  context?: OpenSearchErrorContext;
  location?: string[];
  code?: string;
  suggestion?: string;
}

export interface OpenSearchErrorResponse {
  error: OpenSearchError;
  status: number;
}

export interface QueryErrorInfo {
  message: {
    reason: string;
    details: string;
    type?: string;
  };
  statusCode?: number;
  originalErrorMessage: string;
  errorBody?: OpenSearchErrorResponse;
  errorContext?: {
    context?: OpenSearchErrorContext;
    code?: string;
    type?: string;
    location?: string[];
  };
}
