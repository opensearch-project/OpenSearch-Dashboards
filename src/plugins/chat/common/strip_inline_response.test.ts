/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { stripAdditionalTextFromResponse, isBlankAfterStrip } from './strip_inline_response';

describe('stripAdditionalTextFromResponse', () => {
  it('strips a leading title and a trailing suggestions line', () => {
    const content = 'CONVERSATION_TITLE: Greeting\nHello world\nSUGGESTIONS:["Say more"]';
    expect(stripAdditionalTextFromResponse(content)).toBe('Hello world');
  });

  it('leaves no blank line where the leading title was', () => {
    const content = 'CONVERSATION_TITLE: Yellow Status\n\nYour cluster is yellow.';
    expect(stripAdditionalTextFromResponse(content)).toBe('Your cluster is yellow.');
  });

  it('preserves indentation on the first line after the title', () => {
    const content = 'CONVERSATION_TITLE: Code Sample\n\n    indented code';
    expect(stripAdditionalTextFromResponse(content)).toBe('    indented code');
  });

  it('strips a title that sits before the suggestions line', () => {
    const content = 'Hello world\nCONVERSATION_TITLE: Greeting\nSUGGESTIONS:["Say more"]';
    expect(stripAdditionalTextFromResponse(content)).toBe('Hello world');
  });

  it('strips an incomplete title while it streams', () => {
    expect(stripAdditionalTextFromResponse('Answer text\nCONVERSATION_TITLE: Partial ti')).toBe(
      'Answer text'
    );
  });

  it('leaves plain text unchanged', () => {
    expect(stripAdditionalTextFromResponse('CONVERSATION is fine')).toBe('CONVERSATION is fine');
  });
});

describe('isBlankAfterStrip', () => {
  it('is true for empty/undefined/whitespace content', () => {
    expect(isBlankAfterStrip('')).toBe(true);
    expect(isBlankAfterStrip(undefined)).toBe(true);
    expect(isBlankAfterStrip(null)).toBe(true);
    expect(isBlankAfterStrip('   \n  ')).toBe(true);
  });

  it('is true while a leading title prefix is streaming before its colon', () => {
    expect(isBlankAfterStrip('CONVERSATI')).toBe(true);
    expect(isBlankAfterStrip('CONVERSATION_TITLE')).toBe(true);
  });

  it('is true when the only content is a CONVERSATION_TITLE line (tool-call round)', () => {
    expect(isBlankAfterStrip('CONVERSATION_TITLE: Apply PPL Query for 404s')).toBe(true);
  });

  it('is true when only a title and suggestions remain', () => {
    expect(isBlankAfterStrip('CONVERSATION_TITLE: Greeting\nSUGGESTIONS:["Say more"]')).toBe(true);
  });

  it('is false when real answer text remains after stripping', () => {
    expect(isBlankAfterStrip('CONVERSATION_TITLE: Yellow Status\n\nYour cluster is yellow.')).toBe(
      false
    );
  });
});
