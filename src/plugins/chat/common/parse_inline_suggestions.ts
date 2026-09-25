/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseInlineTitle } from './parse_inline_title';

const SUGGESTIONS_PATTERN = /\n?SUGGESTIONS:\s*(\[[\s\S]*?\])\s*$/;

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
    } else if (isLeadingTitlePrefix(result)) {
      // The title is the leading line, so its first streamed deltas (e.g.
      // "CONVERSATI") arrive before the colon and would otherwise flash.
      result = '';
    }
  }

  return result;
}

const TITLE_MARKER = 'CONVERSATION_TITLE:';

/**
 * True when the whole content so far is a partial prefix of the
 * CONVERSATION_TITLE: marker, i.e. the leading title line is still streaming
 * and its colon has not arrived yet.
 */
function isLeadingTitlePrefix(content: string): boolean {
  const trimmed = content.trim();
  return trimmed.length > 0 && TITLE_MARKER.startsWith(trimmed);
}

/**
 * True when assistant content has nothing left to display once the inline
 * SUGGESTIONS: and CONVERSATION_TITLE: lines are stripped. Used to skip
 * rendering an empty assistant bubble -- e.g. a tool-calling round whose only
 * text was the leading CONVERSATION_TITLE: line, which is stripped for display.
 */
export function isBlankAfterStrip(content: string | undefined | null): boolean {
  if (!content) {
    return true;
  }
  return !stripInlineSuggestions(content).trim();
}
