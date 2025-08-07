/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
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

  return false;
};
