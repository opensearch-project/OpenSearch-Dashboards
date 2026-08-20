/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export function extractQueryError(errorBody: any): string {
  if (errorBody?.shortMessage) {
    return errorBody.shortMessage;
  }
  const message = errorBody?.message;
  const inner = errorBody?.attributes?.error || message?.error;
  return (
    (typeof inner === 'string'
      ? inner
      : inner?.root_cause?.[0]?.reason || inner?.details || inner?.reason) ||
    (typeof message === 'string' ? message : undefined) ||
    errorBody?.error ||
    'Query execution failed'
  );
}
