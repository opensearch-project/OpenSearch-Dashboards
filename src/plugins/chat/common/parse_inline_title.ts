/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Message } from './types';

/**
 * Matches a `CONVERSATION_TITLE:` line anywhere in the content (line-anchored,
 * global + multiline), so the title is found whether it is the trailing line or
 * sits before a following `SUGGESTIONS:` line. Order-robust: callers take the
 * LAST match, mirroring the backend parser, so a premature/stray title emitted
 * on an intermediate tool-call bubble is superseded by the final answer's title.
 */
const TITLE_LINE_PATTERN = /^[ \t]*CONVERSATION_TITLE:[ \t]*(.+?)[ \t]*$/gim;

/**
 * Parse an inline conversation title from assistant response content.
 * Matches a line like: CONVERSATION_TITLE: My Short Title
 *
 * Only emitted on the first turn of a new conversation. The match is not
 * anchored to the end of the string — it is found even when a `SUGGESTIONS:`
 * line follows it — and the LAST occurrence wins.
 */
export function parseInlineTitle(content: string): {
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

/**
 * Derive a conversation title from assistant messages by parsing the inline
 * `CONVERSATION_TITLE:` sentinel. This is the frontend fallback for backends
 * that emit the sentinel in the response text but not a `conversation_title`
 * CUSTOM event (e.g. a generic AG-UI backend) — the preferred source remains
 * the CUSTOM event handled upstream.
 *
 * Scans assistant messages from the end so the final answer's title wins across
 * multi-round tool-call bubbles. When `skipStreamingLast` is set, the currently
 * streaming assistant message is ignored so a partially-arrived title
 * (`CONVERSATION_TITLE: Clu`) does not flicker into the header mid-stream.
 */
export function getConversationTitle(
  messages: Message[],
  options: { skipStreamingLast?: boolean } = {}
): string | undefined {
  const { skipStreamingLast = false } = options;

  // Index of the last assistant message — the only one that can be streaming.
  const lastAssistantIndex = skipStreamingLast
    ? messages.map((m) => m.role).lastIndexOf('assistant')
    : -1;

  for (let i = messages.length - 1; i >= 0; i--) {
    if (i === lastAssistantIndex) continue;
    const message = messages[i];
    if (message.role !== 'assistant') continue;
    if (typeof message.content !== 'string') continue;
    const { title } = parseInlineTitle(message.content);
    if (title) {
      return title;
    }
  }

  return undefined;
}
