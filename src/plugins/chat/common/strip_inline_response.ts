/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { stripInlineSuggestions } from './parse_inline_suggestions';
import { stripInlineConversationTitle } from './parse_inline_title';

/**
 * Strippers for the inline control lines the agent writes into its response
 * text, each removing one kind of line. Suggestions are stripped first so the
 * trailing SUGGESTIONS: line is gone before the title strip inspects the end of
 * the content for a partially streamed title.
 */
const RESPONSE_STRIPPERS: Array<(content: string) => string> = [
  stripInlineSuggestions,
  stripInlineConversationTitle,
];

/**
 * Remove every inline control line (SUGGESTIONS:, CONVERSATION_TITLE:) from
 * assistant response text before it is displayed or exported.
 */
export function stripAdditionalTextFromResponse(content: string): string {
  return RESPONSE_STRIPPERS.reduce((text, strip) => strip(text), content);
}

/**
 * True when assistant content has nothing left to display once the inline
 * control lines are stripped. Used to skip rendering an empty assistant bubble,
 * e.g. a tool-calling round whose only text was the leading CONVERSATION_TITLE:
 * line.
 */
export function isBlankAfterStrip(content: string | undefined | null): boolean {
  if (!content) {
    return true;
  }
  return !stripAdditionalTextFromResponse(content).trim();
}
