/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { injectSystemPrompt } from './index';

describe('injectSystemPrompt', () => {
  it('should prepend system prompt for PROMQL language', () => {
    const messages: unknown[] = [{ id: 'msg-1', role: 'user', content: 'Show CPU usage' }];

    injectSystemPrompt(messages, 'PROMQL');

    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({
      role: 'user',
      content: expect.stringContaining('You are a PromQL expert'),
    });
    expect((messages[0] as any).id).toMatch(/^system-/);
    expect(messages[1]).toEqual({ id: 'msg-1', role: 'user', content: 'Show CPU usage' });
  });

  it('should not modify messages when language is undefined', () => {
    const messages: unknown[] = [{ id: 'msg-1', role: 'user', content: 'Hello' }];
    const originalMessages = [...messages];

    injectSystemPrompt(messages, undefined);

    expect(messages).toEqual(originalMessages);
    expect(messages).toHaveLength(1);
  });
});
