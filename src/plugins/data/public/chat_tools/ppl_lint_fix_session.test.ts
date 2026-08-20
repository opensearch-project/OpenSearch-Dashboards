/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  cleanupPPLLintFixRequest,
  clearPPLLintFixSession,
  getPPLLintFixOutcome,
  getPPLLintFixSession,
  markPPLLintFixApplied,
  markPPLLintFixDismissed,
  storePPLLintFixSession,
} from './ppl_lint_fix_session';
import { PPL_LINT_FIX_DATA_HOST } from './ppl_lint_fix_tool_registration';

const PREFIX = PPL_LINT_FIX_DATA_HOST.contextIdPrefix;

const createSession = (requestId: string) => ({
  host: PPL_LINT_FIX_DATA_HOST,
  request: {
    requestId,
    query: 'source=logs',
    diagnostic: { message: 'Test diagnostic', ruleId: 'test-rule' },
    chatMessage: 'Fix this query',
  } as any,
  getCurrentQuery: jest.fn(() => 'source=logs'),
  getCurrentQueryState: jest.fn(() => ({ query: 'source=logs', language: 'PPL' }) as any),
  getLintContext: jest.fn(() => ({}) as any),
});

describe('PPL lint fix session', () => {
  beforeEach(() => {
    clearPPLLintFixSession();
  });

  afterEach(() => {
    clearPPLLintFixSession();
  });

  it('clears only the session matching the supplied request id', () => {
    const session = createSession('request-a');
    storePPLLintFixSession(session);

    clearPPLLintFixSession('request-b');
    expect(getPPLLintFixSession()).toBe(session);

    clearPPLLintFixSession('request-a');
    expect(getPPLLintFixSession()).toBeUndefined();
  });

  it('removes the exact prefixed context without clearing a newer session', () => {
    const removeContextById = jest.fn();
    const newerSession = createSession('request-b');
    storePPLLintFixSession(newerSession);

    cleanupPPLLintFixRequest('request-a', PREFIX, removeContextById);

    expect(removeContextById).toHaveBeenCalledWith(PREFIX + 'request-a');
    expect(getPPLLintFixSession()).toBe(newerSession);
  });

  it('clears the matching session even when context removal throws', () => {
    storePPLLintFixSession(createSession('request-a'));

    expect(() =>
      cleanupPPLLintFixRequest('request-a', PREFIX, () => {
        throw new Error('context store unavailable');
      })
    ).toThrow('context store unavailable');
    expect(getPPLLintFixSession()).toBeUndefined();
  });

  it('keeps outcomes scoped to their originating request', () => {
    storePPLLintFixSession(createSession('request-a'));
    markPPLLintFixApplied('request-a');
    expect(getPPLLintFixOutcome('request-a')).toEqual({ kind: 'applied' });

    storePPLLintFixSession(createSession('request-b'));
    markPPLLintFixApplied('request-b');
    markPPLLintFixDismissed('request-a');

    expect(getPPLLintFixOutcome('request-a')).toEqual({ kind: 'dismissed' });
    expect(getPPLLintFixOutcome('request-b')).toEqual({ kind: 'applied' });
  });
});
