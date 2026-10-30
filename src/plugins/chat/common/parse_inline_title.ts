/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const TITLE_MARKER = 'CONVERSATION_TITLE:';

/** A line that starts with the CONVERSATION_TITLE: marker (case-insensitive). */
const TITLE_LINE_PATTERN = /^[ \t]*CONVERSATION_TITLE:/i;

/** Leading blank (whitespace-only) lines. */
const LEADING_BLANK_LINES_PATTERN = /^(?:[ \t]*\r?\n)+/;

/**
 * Strip the leading CONVERSATION_TITLE: line from assistant content for display.
 *
 * The agent is asked to write the title as the FIRST line of its first
 * response, and backends read the title from that same leading line (then
 * deliver it as a `conversation_title` CUSTOM event). So only the first
 * non-blank line is inspected, mirroring the backend; a CONVERSATION_TITLE:
 * mention anywhere else in the answer is left untouched.
 *
 * The line is removed regardless of its value's length, so an over-long title
 * never leaks into the bubble. During streaming this also hides a title line
 * whose newline has not arrived yet, and a partial marker (e.g. "CONVERSATI")
 * before its colon arrives, so neither flashes in the bubble.
 */
export function stripInlineConversationTitle(content: string): string {
  if (!content) {
    return content;
  }

  const rest = content.replace(LEADING_BLANK_LINES_PATTERN, '');
  const newlineIndex = rest.indexOf('\n');
  const firstLine = newlineIndex === -1 ? rest : rest.slice(0, newlineIndex);

  if (TITLE_LINE_PATTERN.test(firstLine)) {
    if (newlineIndex === -1) {
      // Only the title line so far (still streaming, or a tool-call round
      // whose only text was the title).
      return '';
    }
    // Drop the title line and the blank lines after it, plus trailing
    // whitespace. Only whole blank lines are removed at the start, so
    // indentation on the first remaining line -- e.g. an indented code block --
    // is preserved.
    return rest
      .slice(newlineIndex + 1)
      .replace(LEADING_BLANK_LINES_PATTERN, '')
      .trimEnd();
  }

  // The leading line is still streaming and its colon has not arrived yet.
  // Case-insensitive, matching TITLE_LINE_PATTERN.
  if (newlineIndex === -1) {
    const trimmed = firstLine.trim();
    if (trimmed.length > 0 && TITLE_MARKER.startsWith(trimmed.toUpperCase())) {
      return '';
    }
  }

  return content;
}
