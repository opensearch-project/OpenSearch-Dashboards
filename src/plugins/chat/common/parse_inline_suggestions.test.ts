/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseInlineSuggestions, stripInlineSuggestions } from './parse_inline_suggestions';

describe('parseInlineSuggestions', () => {
  it('should parse SUGGESTIONS line from end of content', () => {
    const content = 'Here is your answer.\nSUGGESTIONS:["Check health","List indices"]';
    const result = parseInlineSuggestions(content);
    expect(result.cleanContent).toBe('Here is your answer.');
    expect(result.suggestions).toEqual(['Check health', 'List indices']);
  });

  it('should handle SUGGESTIONS with spaces after colon', () => {
    const content = 'Answer text\nSUGGESTIONS: ["One","Two"]';
    const result = parseInlineSuggestions(content);
    expect(result.cleanContent).toBe('Answer text');
    expect(result.suggestions).toEqual(['One', 'Two']);
  });

  it('should return empty suggestions when no SUGGESTIONS line', () => {
    const content = 'Just a normal response with no suggestions';
    const result = parseInlineSuggestions(content);
    expect(result.cleanContent).toBe(content);
    expect(result.suggestions).toEqual([]);
  });

  it('should return empty suggestions for invalid JSON', () => {
    const content = 'Answer\nSUGGESTIONS:[not valid json]';
    const result = parseInlineSuggestions(content);
    expect(result.cleanContent).toBe(content);
    expect(result.suggestions).toEqual([]);
  });

  it('should return empty suggestions when array contains non-strings', () => {
    const content = 'Answer\nSUGGESTIONS:[1, 2, 3]';
    const result = parseInlineSuggestions(content);
    expect(result.cleanContent).toBe(content);
    expect(result.suggestions).toEqual([]);
  });

  it('should handle empty string', () => {
    const result = parseInlineSuggestions('');
    expect(result.cleanContent).toBe('');
    expect(result.suggestions).toEqual([]);
  });

  it('should handle multiline content with SUGGESTIONS at end', () => {
    const content = 'Line 1\nLine 2\nLine 3\nSUGGESTIONS:["A","B","C"]';
    const result = parseInlineSuggestions(content);
    expect(result.cleanContent).toBe('Line 1\nLine 2\nLine 3');
    expect(result.suggestions).toEqual(['A', 'B', 'C']);
  });

  it('should not match SUGGESTIONS in the middle of content', () => {
    const content = 'SUGGESTIONS:["early"]\nMore content after';
    const result = parseInlineSuggestions(content);
    expect(result.cleanContent).toBe(content);
    expect(result.suggestions).toEqual([]);
  });
});

describe('stripInlineSuggestions', () => {
  it('should strip SUGGESTIONS line and return clean content', () => {
    const content = 'Hello world\nSUGGESTIONS:["Do something"]';
    expect(stripInlineSuggestions(content)).toBe('Hello world');
  });

  it('should return content unchanged when no SUGGESTIONS line', () => {
    const content = 'No suggestions here';
    expect(stripInlineSuggestions(content)).toBe('No suggestions here');
  });

  it('should strip incomplete SUGGESTIONS during streaming', () => {
    const content = 'Answer text\n\nSUGGESTIONS:["Show only error';
    expect(stripInlineSuggestions(content)).toBe('Answer text');
  });

  it('should strip SUGGESTIONS:[ with no content yet', () => {
    const content = 'Answer text\n\nSUGGESTIONS:[';
    expect(stripInlineSuggestions(content)).toBe('Answer text');
  });

  it('should not strip text that merely contains the word SUGGESTIONS', () => {
    const content = 'Here are my SUGGESTIONS: use a pie chart';
    expect(stripInlineSuggestions(content)).toBe(content);
  });
});
