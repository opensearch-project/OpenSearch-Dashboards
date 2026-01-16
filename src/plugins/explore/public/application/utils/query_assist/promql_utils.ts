/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shared utilities for PromQL query assist
 */

/**
 * Regular expression patterns for PromQL query detection
 */
const PROMQL_CODE_BLOCK_PATTERN = /```(?:promql)?\s*\n?([\s\S]*?)\n?```/;
const PROMQL_INLINE_CODE_PATTERN = /`([^`]+)`/;

/**
 * Common PromQL function names for validation
 */
const PROMQL_FUNCTIONS = [
  'rate',
  'sum',
  'avg',
  'max',
  'min',
  'count',
  'histogram_quantile',
  'increase',
  'irate',
  'delta',
  'idelta',
  'deriv',
  'predict_linear',
  'topk',
  'bottomk',
  'sort',
  'sort_desc',
  'time',
  'vector',
  'scalar',
  'absent',
  'present_over_time',
  'changes',
  'resets',
  'label_replace',
  'label_join',
];

/**
 * Check if a string looks like a valid PromQL query
 * More robust than just checking for parentheses/braces
 */
function looksLikePromQL(text: string): boolean {
  if (!text || text.length < 3) return false;

  const trimmed = text.trim();

  // Check for common PromQL patterns:
  // 1. Metric name followed by label selector: metric_name{label="value"}
  // 2. Function call: rate(metric[5m])
  // 3. Aggregation: sum by (label) (metric)

  // Must start with a letter or underscore (metric name or function)
  if (!/^[a-zA-Z_]/.test(trimmed)) return false;

  // Check for PromQL function patterns
  const hasFunction = PROMQL_FUNCTIONS.some(
    (fn) =>
      trimmed.includes(`${fn}(`) || trimmed.includes(`${fn} (`) || trimmed.startsWith(`${fn}_`)
  );

  // Check for label selector pattern
  const hasLabelSelector = /\{[^}]*\}/.test(trimmed);

  // Check for range selector pattern
  const hasRangeSelector = /\[[^\]]+\]/.test(trimmed);

  // Check for aggregation operators
  const hasAggregation = /\b(by|without|on|ignoring|group_left|group_right)\s*\(/.test(trimmed);

  // Must have at least one PromQL-specific pattern
  return hasFunction || hasLabelSelector || hasRangeSelector || hasAggregation;
}

/**
 * Extract the PromQL query from the assistant's text response.
 * The agent should return the query in a code block or clearly formatted.
 *
 * Priority:
 * 1. Code block with ```promql or ``` markers
 * 2. Inline code with backticks
 * 3. Raw text that looks like a PromQL query (validated)
 */
export function extractQueryFromText(text: string): string | undefined {
  if (!text) return undefined;

  // Try to extract from code block first (most reliable)
  const codeBlockMatch = text.match(PROMQL_CODE_BLOCK_PATTERN);
  if (codeBlockMatch) {
    const query = codeBlockMatch[1].trim();
    if (query.length > 0) {
      return query;
    }
  }

  // Try to extract from inline code
  const inlineCodeMatch = text.match(PROMQL_INLINE_CODE_PATTERN);
  if (inlineCodeMatch) {
    const query = inlineCodeMatch[1].trim();
    if (query.length > 0 && looksLikePromQL(query)) {
      return query;
    }
  }

  // Last resort: check if the text itself looks like a query
  const trimmed = text.trim();
  if (trimmed.length > 0 && trimmed.length < 500 && looksLikePromQL(trimmed)) {
    // Take the first line only
    const firstLine = trimmed.split('\n')[0].trim();
    if (firstLine.length > 0 && looksLikePromQL(firstLine)) {
      return firstLine;
    }
  }

  return undefined;
}

/**
 * Validate tool call arguments for safety
 * Returns an error message if invalid, undefined if valid
 */
export function validateToolArgs(
  toolName: string,
  args: Record<string, unknown>
): string | undefined {
  const MAX_STRING_LENGTH = 1000;
  for (const [key, value] of Object.entries(args)) {
    if (typeof value === 'string' && value.length > MAX_STRING_LENGTH) {
      return `Argument '${key}' exceeds maximum length of ${MAX_STRING_LENGTH}`;
    }
  }

  switch (toolName) {
    case 'search_metrics':
      if (args.limit !== undefined) {
        const limit = Number(args.limit);
        if (isNaN(limit) || limit < 1 || limit > 1000) {
          return 'Limit must be a number between 1 and 1000';
        }
      }
      break;

    case 'search_label_values':
      if (!args.label || typeof args.label !== 'string' || args.label.trim().length === 0) {
        return 'Label name is required and must be a non-empty string';
      }
      break;
  }

  return undefined;
}
