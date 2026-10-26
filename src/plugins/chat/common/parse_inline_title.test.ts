/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { stripInlineConversationTitle } from './parse_inline_title';

describe('stripInlineConversationTitle', () => {
  it('strips the leading title line and the blank line after it', () => {
    expect(stripInlineConversationTitle('CONVERSATION_TITLE: Greeting\n\nHello world')).toBe(
      'Hello world'
    );
  });

  it('skips leading blank lines before the title', () => {
    expect(stripInlineConversationTitle('\n  \nCONVERSATION_TITLE: After Blanks\nbody')).toBe(
      'body'
    );
  });

  it('handles a title line without a space after the colon, case-insensitively', () => {
    expect(stripInlineConversationTitle('conversation_title:My Title\nAnswer text')).toBe(
      'Answer text'
    );
  });

  it('preserves indentation on the first line after the title', () => {
    expect(stripInlineConversationTitle('CONVERSATION_TITLE: Code\n\n    indented code')).toBe(
      '    indented code'
    );
  });

  it('strips a title line longer than 100 chars', () => {
    expect(stripInlineConversationTitle(`CONVERSATION_TITLE: ${'x'.repeat(150)}\nAnswer`)).toBe(
      'Answer'
    );
  });

  it('strips an empty-valued title line without eating the next line', () => {
    expect(stripInlineConversationTitle('CONVERSATION_TITLE:\nHello world')).toBe('Hello world');
  });

  it('hides a leading title line that is still streaming', () => {
    expect(stripInlineConversationTitle('CONVERSATION_TITLE: Partial ti')).toBe('');
  });

  it('hides a leading partial marker before its colon arrives', () => {
    expect(stripInlineConversationTitle('CONVERSATI')).toBe('');
  });

  it('hides a lowercase partial marker, matching the case-insensitive line match', () => {
    expect(stripInlineConversationTitle('conversati')).toBe('');
  });

  it('trims trailing whitespace from the remaining body', () => {
    expect(stripInlineConversationTitle('CONVERSATION_TITLE: Foo\nHello\n\n')).toBe('Hello');
  });

  it('leaves a title line that is not the leading line alone', () => {
    const content = 'Answer text\nCONVERSATION_TITLE: Not Leading';
    expect(stripInlineConversationTitle(content)).toBe(content);
  });

  it('keeps normal text that is not a title prefix', () => {
    expect(stripInlineConversationTitle('CONVERSATION is fine')).toBe('CONVERSATION is fine');
    expect(stripInlineConversationTitle('Hello')).toBe('Hello');
  });

  it('removes only the title line when a SUGGESTIONS line follows the answer', () => {
    expect(
      stripInlineConversationTitle(
        'CONVERSATION_TITLE: Cluster Health\nHere is your answer.\nSUGGESTIONS:["Check health"]'
      )
    ).toBe('Here is your answer.\nSUGGESTIONS:["Check health"]');
  });

  it('leaves a SUGGESTIONS line alone', () => {
    expect(stripInlineConversationTitle('Hello\nSUGGESTIONS:["A"]')).toBe(
      'Hello\nSUGGESTIONS:["A"]'
    );
  });

  it('returns empty string unchanged', () => {
    expect(stripInlineConversationTitle('')).toBe('');
  });
});
