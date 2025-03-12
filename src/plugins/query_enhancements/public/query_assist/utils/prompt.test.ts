/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { appendQueryPrompt } from './prompt';
import { APPENDED_QUERY_PROMPT } from './constant';

describe('appendQueryPrompt', () => {
  it('should return the original query when it does not include "fail" or "error"', () => {
    const query = 'show me logs from yesterday';
    const result = appendQueryPrompt(query);
    expect(result).toEqual(query);
  });

  it('should append the prompt when query includes "fail"', () => {
    const query = 'show me failed requests';
    const result = appendQueryPrompt(query);
    expect(result).toEqual(query + APPENDED_QUERY_PROMPT);
  });

  it('should append the prompt when query includes "error"', () => {
    const query = 'find error logs';
    const result = appendQueryPrompt(query);
    expect(result).toEqual(query + APPENDED_QUERY_PROMPT);
  });

  it('should be case-insensitive when checking for "fail"', () => {
    const query = 'Show me FAILED requests';
    const result = appendQueryPrompt(query);
    expect(result).toEqual(query + APPENDED_QUERY_PROMPT);
  });

  it('should be case-insensitive when checking for "error"', () => {
    const query = 'Find ERROR logs';
    const result = appendQueryPrompt(query);
    expect(result).toEqual(query + APPENDED_QUERY_PROMPT);
  });

  it('should append the prompt when query includes both "fail" and "error"', () => {
    const query = 'show me failed requests with errors';
    const result = appendQueryPrompt(query);
    expect(result).toEqual(query + APPENDED_QUERY_PROMPT);
  });
});
