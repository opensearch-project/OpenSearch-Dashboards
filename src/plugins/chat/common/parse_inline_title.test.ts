/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseInlineTitle, getConversationTitle } from './parse_inline_title';
import type { Message } from './types';

describe('parseInlineTitle', () => {
  it('should parse CONVERSATION_TITLE from end of content', () => {
    const content = 'Here is your answer.\nCONVERSATION_TITLE: Cluster Health Summary';
    const result = parseInlineTitle(content);
    expect(result.cleanContent).toBe('Here is your answer.');
    expect(result.title).toBe('Cluster Health Summary');
  });

  it('should handle title without space after colon', () => {
    const content = 'Answer text\nCONVERSATION_TITLE:My Title';
    const result = parseInlineTitle(content);
    expect(result.cleanContent).toBe('Answer text');
    expect(result.title).toBe('My Title');
  });

  it('should return undefined when no CONVERSATION_TITLE line', () => {
    const content = 'Just a normal response';
    const result = parseInlineTitle(content);
    expect(result.cleanContent).toBe(content);
    expect(result.title).toBeUndefined();
  });

  it('should return undefined for empty title', () => {
    const content = 'Answer\nCONVERSATION_TITLE:   ';
    const result = parseInlineTitle(content);
    expect(result.cleanContent).toBe(content);
    expect(result.title).toBeUndefined();
  });

  it('should reject titles longer than 100 characters', () => {
    const longTitle = 'A'.repeat(101);
    const content = `Answer\nCONVERSATION_TITLE: ${longTitle}`;
    const result = parseInlineTitle(content);
    expect(result.title).toBeUndefined();
  });

  it('should handle empty string', () => {
    const result = parseInlineTitle('');
    expect(result.cleanContent).toBe('');
    expect(result.title).toBeUndefined();
  });

  // Order-robustness (#3): the title is matched anywhere, not just at the end.
  it('should match a CONVERSATION_TITLE that sits before a SUGGESTIONS line', () => {
    const content =
      'Here is your answer.\nCONVERSATION_TITLE: Cluster Health\nSUGGESTIONS:["Check health"]';
    const result = parseInlineTitle(content);
    expect(result.title).toBe('Cluster Health');
    // Only the title line is removed; the SUGGESTIONS line is left intact.
    expect(result.cleanContent).toBe('Here is your answer.\nSUGGESTIONS:["Check health"]');
  });

  it('should take the LAST CONVERSATION_TITLE when several appear', () => {
    const content =
      'Let me check...\nCONVERSATION_TITLE: Premature Title\nBased on results...\nCONVERSATION_TITLE: Final Title';
    const result = parseInlineTitle(content);
    expect(result.title).toBe('Final Title');
  });
});

describe('getConversationTitle', () => {
  const user = (content: string): Message => ({ id: 'u', role: 'user', content }) as Message;
  const assistant = (content: string): Message =>
    ({ id: `a-${Math.random()}`, role: 'assistant', content }) as Message;

  it('returns undefined when no assistant message carries a title', () => {
    const messages = [user('what indices do I have?'), assistant('Here are your indices.')];
    expect(getConversationTitle(messages)).toBeUndefined();
  });

  it('derives the title from the assistant response sentinel', () => {
    const messages = [
      user('what indices do I have?'),
      assistant('Here are your indices.\nCONVERSATION_TITLE: Index Overview'),
    ];
    expect(getConversationTitle(messages)).toBe('Index Overview');
  });

  it('finds the title even when a SUGGESTIONS line follows it', () => {
    const messages = [
      user('hi'),
      assistant('Answer.\nCONVERSATION_TITLE: Greeting\nSUGGESTIONS:["Say more"]'),
    ];
    expect(getConversationTitle(messages)).toBe('Greeting');
  });

  it('takes the final answer title across multi-round tool bubbles', () => {
    const messages = [
      user('investigate the cluster'),
      assistant('Let me check...\nCONVERSATION_TITLE: Premature'),
      { id: 't', role: 'tool', content: '{}', toolCallId: 'x' } as Message,
      assistant('Based on results...\nCONVERSATION_TITLE: Cluster Investigation'),
    ];
    expect(getConversationTitle(messages)).toBe('Cluster Investigation');
  });

  it('skips the streaming last assistant message when guarded', () => {
    const messages = [user('hi'), assistant('Partial answer\nCONVERSATION_TITLE: Half Typed Ti')];
    // While streaming, do not derive a (partial) title from the last message.
    expect(getConversationTitle(messages, { skipStreamingLast: true })).toBeUndefined();
    // Once settled, the title is derived.
    expect(getConversationTitle(messages, { skipStreamingLast: false })).toBe('Half Typed Ti');
  });

  it('ignores non-string (multimodal) assistant content', () => {
    const messages = [
      user('hi'),
      { id: 'a', role: 'assistant', content: [{ type: 'text', text: 'hello' }] } as Message,
    ];
    expect(getConversationTitle(messages)).toBeUndefined();
  });
});
