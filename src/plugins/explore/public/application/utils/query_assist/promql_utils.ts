/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PromQLToolName } from './promql_tools';

/**
 * Shared utilities for PromQL query assist
 */

/**
 * Regular expression pattern for extracting content from markdown code blocks
 * Matches code blocks with any language identifier (e.g., ```promql, ```)
 */
const CODE_BLOCK_PATTERN = /```(?:\w+)?\s*\n([\s\S]*?)\n?```/;

/**
 * Extract the PromQL query from the assistant's text response.
 * The agent returns the query in a markdown code block.
 */
export function extractQueryFromText(text: string): string | undefined {
  if (!text) return undefined;

  const codeBlockMatch = text.match(CODE_BLOCK_PATTERN);
  if (codeBlockMatch) {
    const content = codeBlockMatch[1].trim();
    if (content.length > 0) {
      return content;
    }
  }

  return undefined;
}

/**
 * Validate tool call arguments for safety
 * Returns an error message if invalid, undefined if valid
 */
export function validateToolArgs(
  toolName: PromQLToolName,
  args: Record<string, unknown>
): string | undefined {
  const MAX_STRING_LENGTH = 1000;
  for (const [key, value] of Object.entries(args)) {
    if (typeof value === 'string' && value.length > MAX_STRING_LENGTH) {
      return `Argument '${key}' exceeds maximum length of ${MAX_STRING_LENGTH}`;
    }
  }

  switch (toolName) {
    case PromQLToolName.SEARCH_PROMETHEUS_METADATA:
      for (const limitArg of ['metricsLimit', 'labelsLimit', 'valuesLimit'] as const) {
        if (args[limitArg] !== undefined) {
          const limit = Number(args[limitArg]);
          if (isNaN(limit) || limit < 1 || limit > 1000) {
            return `${limitArg} must be a number between 1 and 1000`;
          }
        }
      }
      break;
  }

  return undefined;
}
