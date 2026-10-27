/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Matches a `CONVERSATION_TITLE:` line anywhere in the content (line-anchored,
 * global + multiline), so the title line is found whether it is the trailing
 * line or sits before a following `SUGGESTIONS:` line. The LAST match wins,
 * mirroring the backend, so a premature/stray title on an intermediate
 * tool-call bubble is superseded by the final answer's title.
 */
const TITLE_LINE_PATTERN = /^[ \t]*CONVERSATION_TITLE:[ \t]*(.+?)[ \t]*$/gim;

/**
 * Locate an inline `CONVERSATION_TITLE:` line in assistant response content and
 * return the content with that line removed (`cleanContent`) plus the parsed
 * `title`. Internal helper used only by `stripInlineConversationTitle` to strip
 * the line from display — the conversation title itself is sourced from the
 * `conversation_title` CUSTOM event, NOT from this parse.
 */
function parseInlineTitle(content: string): {
  cleanContent: string;
  title: string | undefined;
} {
  if (!content) {
    return { cleanContent: content, title: undefined };
  }

  const matches = [...content.matchAll(TITLE_LINE_PATTERN)];
  if (matches.length === 0) {
    return { cleanContent: content, title: undefined };
  }

  const last = matches[matches.length - 1];
  const matchIndex = last.index ?? 0;
  const title = last[1].trim();

  if (title.length > 0 && title.length <= 100) {
    // Remove only the matched title line (and one leading newline if present),
    // keeping any text that follows it (e.g. a SUGGESTIONS: line) intact.
    const start = matchIndex > 0 && content[matchIndex - 1] === '\n' ? matchIndex - 1 : matchIndex;
    const cleanContent = (
      content.slice(0, start) + content.slice(matchIndex + last[0].length)
    ).trimEnd();
    return { cleanContent, title };
  }

  return { cleanContent: content, title: undefined };
}

const TITLE_MARKER = 'CONVERSATION_TITLE:';
const INCOMPLETE_TITLE_PATTERN = /\n?CONVERSATION_TITLE:\s*[^\n]*$/;

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
 * Strip the CONVERSATION_TITLE: line from content for display. During
 * streaming it also hides an incomplete title line, and a leading partial
 * marker (e.g. "CONVERSATI") that arrives before the colon and would
 * otherwise flash.
 */
export function stripInlineConversationTitle(content: string): string {
  if (!content) {
    return content;
  }
  const { cleanContent, title } = parseInlineTitle(content);
  if (title) {
    // parseInlineTitle removes a newline preceding the title line but not one
    // following it, so drop the blank line left behind when the title was the
    // leading line (the usual case). Only newlines are removed, so indentation
    // on the first remaining line -- e.g. a fenced code block -- is preserved.
    return cleanContent.replace(/^\n+/, '');
  }
  if (INCOMPLETE_TITLE_PATTERN.test(content)) {
    return content.replace(INCOMPLETE_TITLE_PATTERN, '').trimEnd();
  }
  if (isLeadingTitlePrefix(content)) {
    return '';
  }
  return content;
}
