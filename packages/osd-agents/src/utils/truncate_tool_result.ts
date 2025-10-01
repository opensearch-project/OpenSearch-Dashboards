/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Simple utility to truncate tool results to prevent Bedrock API input size errors
 */

const MAX_TOOL_RESULT_LENGTH = 5000; // Maximum characters per tool result

/**
 * Truncate a tool result to a maximum length
 * TODO: In future, implement Bedrock-based summarization instead of simple truncation
 */
export function truncateToolResult(
  result: any,
  maxLength: number = MAX_TOOL_RESULT_LENGTH
): string {
  const resultStr = typeof result === 'string' ? result : JSON.stringify(result, null, 2);

  if (resultStr.length <= maxLength) {
    return resultStr;
  }

  // Simple truncation with indicator
  return (
    resultStr.substring(0, maxLength) +
    `\n\n[Output truncated - ${resultStr.length - maxLength} characters removed]`
  );
}
