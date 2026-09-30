/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { errorSpanCount, turnRole } from './session_details_flyout';

const msgs = (...roles: string[]) =>
  JSON.stringify(roles.map((role) => ({ role, parts: [{ type: 'text', content: role }] })));

describe('turnRole', () => {
  it('uses the last user message role for input and the first generation for output', () => {
    expect(turnRole(msgs('system', 'user', 'assistant', 'user'), 'input')).toBe('user');
    expect(turnRole(msgs('system', 'tool'), 'input')).toBe('tool');
    expect(turnRole(msgs('assistant'), 'output')).toBe('assistant');
  });

  it('falls back to user/assistant for non-schema values', () => {
    expect(turnRole('plain text', 'input')).toBe('user');
    expect(turnRole(undefined, 'output')).toBe('assistant');
  });
});

describe('errorSpanCount', () => {
  it('counts error spans in a trace', () => {
    const trace = {
      traceId: 't1',
      root: { status: 'success' },
      tree: [],
      spans: [{ status: 'success' }, { status: 'error' }, { status: 'error' }],
    } as any;
    expect(errorSpanCount(trace)).toBe(2);
    expect(errorSpanCount({ ...trace, spans: [{ status: 'success' }] })).toBe(0);
  });
});
