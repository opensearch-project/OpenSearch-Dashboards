/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const SUGGESTIONS_PATTERN = /\n?SUGGESTIONS:\s*(\[[\s\S]*?\])\s*$/;
const TITLE_PATTERN = /\n?CONVERSATION_TITLE:\s*(.+)\s*$/;

/**
 * Parse inline suggestions from assistant response content.
 * Matches a trailing line like: SUGGESTIONS:["action1","action2"]
 */
export function parseInlineSuggestions(content: string): {
  cleanContent: string;
  suggestions: string[];
} {
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
 * Parse inline conversation title from assistant response content.
 * Matches a trailing line like: CONVERSATION_TITLE: My Short Title
 * Only emitted on the first turn of a new conversation.
 */
export function parseInlineTitle(content: string): {
  cleanContent: string;
  title: string | undefined;
} {
  if (!content) {
    return { cleanContent: content, title: undefined };
  }

  const match = content.match(TITLE_PATTERN);
  if (!match) {
    return { cleanContent: content, title: undefined };
  }

  const title = match[1].trim();
  if (title && title.length > 0 && title.length <= 100) {
    return {
      cleanContent: content.replace(TITLE_PATTERN, '').trimEnd(),
      title,
    };
  }

  return { cleanContent: content, title: undefined };
}

/**
 * Strip the SUGGESTIONS: and CONVERSATION_TITLE: lines from content for display.
 * Also strips incomplete suffixes during streaming
 * (where the JSON array or title text hasn't fully arrived yet).
 */
export function stripInlineSuggestions(content: string): string {
  let result = content;

  // Strip complete SUGGESTIONS
  const { cleanContent, suggestions } = parseInlineSuggestions(result);
  if (suggestions.length > 0) {
    result = cleanContent;
  } else {
    // Strip incomplete SUGGESTIONS:[ suffix during streaming
    const incompletePattern = /\n?SUGGESTIONS:\s*\[[\s\S]*$/;
    if (incompletePattern.test(result)) {
      result = result.replace(incompletePattern, '').trimEnd();
    }
  }

  // Strip complete CONVERSATION_TITLE
  const { cleanContent: titleClean, title } = parseInlineTitle(result);
  if (title) {
    result = titleClean;
  } else {
    // Strip incomplete CONVERSATION_TITLE: suffix during streaming
    const incompleteTitlePattern = /\n?CONVERSATION_TITLE:\s*[^\n]*$/;
    if (incompleteTitlePattern.test(result)) {
      result = result.replace(incompleteTitlePattern, '').trimEnd();
    }
  }

  return result;
}
