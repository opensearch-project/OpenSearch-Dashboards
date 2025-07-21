/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utility function to detect if a trace span represents an error
 * Based on the same logic used in StatusCodeFormatter
 */
export const isErrorSpan = (source: any): boolean => {
  if (!source) return false;

  // Check HTTP status codes (4xx and 5xx are errors)
  const httpStatusCode =
    source['attributes.http.status_code'] ||
    source.attributes?.['http.status_code'] ||
    source.attributes?.http?.status_code;
  if (httpStatusCode) {
    const statusStr = String(httpStatusCode);
    if (statusStr.startsWith('4') || statusStr.startsWith('5')) {
      return true;
    }
  }

  // Check trace status codes (2 = Error)
  // Handle both flat and nested status structures
  const traceStatusCode = source['status.code'] || source.status?.code || source.statusCode;
  if (traceStatusCode && String(traceStatusCode) === '2') {
    return true;
  }

  // Additional checks for error indicators in your data format
  // Check if span kind indicates an error
  if (source.kind && source.kind.toString().toLowerCase().includes('error')) {
    return true;
  }

  // Check span name for error patterns
  if (source.name && source.name.toString().toLowerCase().includes('error')) {
    return true;
  }

  // Check for explicit error flags
  if (source.error === true || source.hasError === true) {
    return true;
  }

  return false;
};
