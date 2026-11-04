/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { stripInlineConversationTitle } from './parse_inline_title';

describe('stripInlineConversationTitle', () => {
  it('strips a complete title line', () => {
    expect(stripInlineConversationTitle('Answer text\nCONVERSATION_TITLE: Query Results')).toBe(
      'Answer text'
    );
  });

  it('leaves no blank line when the title was the leading line', () => {
    expect(stripInlineConversationTitle('CONVERSATION_TITLE: Greeting\n\nHello world')).toBe(
      'Hello world'
    );
  });

  it('handles a title line without a space after the colon', () => {
    expect(stripInlineConversationTitle('Answer text\nCONVERSATION_TITLE:My Title')).toBe(
      'Answer text'
    );
  });

  it('strips an incomplete title line during streaming', () => {
    expect(stripInlineConversationTitle('Answer text\nCONVERSATION_TITLE: Partial ti')).toBe(
      'Answer text'
    );
  });

  it('hides a leading partial marker before its colon arrives', () => {
    expect(stripInlineConversationTitle('CONVERSATI')).toBe('');
  });

  it('keeps normal text that is not a title prefix', () => {
    expect(stripInlineConversationTitle('CONVERSATION is fine')).toBe('CONVERSATION is fine');
    expect(stripInlineConversationTitle('Hello')).toBe('Hello');
  });

  it('leaves a SUGGESTIONS line alone', () => {
    expect(stripInlineConversationTitle('Hello\nSUGGESTIONS:["A"]')).toBe(
      'Hello\nSUGGESTIONS:["A"]'
    );
  });

  it('removes only the title line when a SUGGESTIONS line follows it', () => {
    expect(
      stripInlineConversationTitle(
        'Here is your answer.\nCONVERSATION_TITLE: Cluster Health\nSUGGESTIONS:["Check health"]'
      )
    ).toBe('Here is your answer.\nSUGGESTIONS:["Check health"]');
  });

  it('strips the LAST title line when several appear across tool-call bubbles', () => {
    expect(
      stripInlineConversationTitle(
        'Let me check...\nCONVERSATION_TITLE: Premature\nBased on results...\nCONVERSATION_TITLE: Final Title'
      )
    ).toBe('Let me check...\nCONVERSATION_TITLE: Premature\nBased on results...');
  });

  it('returns empty string unchanged', () => {
    expect(stripInlineConversationTitle('')).toBe('');
  });
});
