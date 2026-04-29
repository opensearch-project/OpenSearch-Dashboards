/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Error response structure from OpenSearch SQL/PPL queries
 * Based on: https://github.com/opensearch-project/sql/pull/5266
 */

/**
 * Query position information for error location
 */
export interface QueryPosition {
  line: number;
  column: number;
}

/**
 * Rich error context that may include field suggestions, query position, etc.
 * The structure varies based on error type.
 */
export interface OpenSearchErrorContext {
  /** Available fields in the index (for field not found errors) */
  available_fields?: string[];
  /** The field that was requested but not found */
  requested_field?: string;
  /** Position in the query where the error occurred */
  query_pos?: QueryPosition;
  /** Any additional context properties */
  [key: string]: unknown;
}

/**
 * OpenSearch error object structure
 */
export interface OpenSearchError {
  /** Error type (e.g., "SemanticCheckException", "SyntaxCheckException") */
  type: string;
  /** Human-readable error reason */
  reason: string;
  /** Detailed error message */
  details?: string;
  /** Rich context object with error-specific information */
  context?: OpenSearchErrorContext;
  /** Array of location strings indicating where the error occurred */
  location?: string[];
  /** Error code identifier */
  code?: string;
  /** Optional suggestion for how to fix the error */
  suggestion?: string;
}

/**
 * Complete error response from OpenSearch
 */
export interface OpenSearchErrorResponse {
  error: OpenSearchError;
  status: number;
}

/**
 * Query error information stored in Redux state
 * Extends the basic error structure with additional metadata
 */
export interface QueryErrorInfo {
  message: {
    reason: string;
    details: string;
    type?: string;
  };
  statusCode?: number;
  originalErrorMessage: string;
  /** Full error body from the response */
  errorBody?: OpenSearchErrorResponse;
  /** Extracted error context for quick access */
  errorContext?: {
    context?: OpenSearchErrorContext;
    code?: string;
    type?: string;
    location?: string[];
  };
}
