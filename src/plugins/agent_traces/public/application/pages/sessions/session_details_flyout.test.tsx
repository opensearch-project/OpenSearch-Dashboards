/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { turnRole } from './session_details_flyout';

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
