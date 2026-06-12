/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const SUGGESTIONS_PATTERN = /\n?SUGGESTIONS:\s*(\[.*\])\s*$/;

/**
 * Parse inline suggestions from assistant response content.
 * Matches a trailing line like: SUGGESTIONS:["action1","action2"]
 */
export function parseInlineSuggestions(
  content: string
): { cleanContent: string; suggestions: string[] } {
  if (!content) {
    return { cleanContent: content, suggestions: [] };
  }

  const match = content.match(SUGGESTIONS_PATTERN);
  if (!match) {
    return { cleanContent: content, suggestions: [] };
  }

  try {
    const parsed = JSON.parse(match[1]);
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
      return {
        cleanContent: content.replace(SUGGESTIONS_PATTERN, '').trimEnd(),
        suggestions: parsed,
      };
    }
  } catch {
    // invalid JSON — return content as-is
  }

  return { cleanContent: content, suggestions: [] };
}

/**
 * Strip the SUGGESTIONS: line from content for display purposes.
 * Also strips incomplete SUGGESTIONS: suffixes during streaming
 * (where the JSON array hasn't fully arrived yet).
 */
export function stripInlineSuggestions(content: string): string {
  const { cleanContent, suggestions } = parseInlineSuggestions(content);
  if (suggestions.length > 0) {
    return cleanContent;
  }
  // Strip incomplete SUGGESTIONS:[ suffix during streaming
  const incompletePattern = /\n+SUGGESTIONS:\s*\[.*$/;
  if (incompletePattern.test(content)) {
    return content.replace(incompletePattern, '').trimEnd();
  }
  return content;
}
