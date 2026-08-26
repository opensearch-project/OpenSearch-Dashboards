/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  armPPLLintFixRequest,
  cleanupPPLLintFixRequest,
  clearPPLLintFixSession,
  getPPLLintFixOutcome,
  getPPLLintFixSession,
  isPPLLintFixFlowActive,
  markPPLLintFixApplied,
  markPPLLintFixDismissed,
  storePPLLintFixSession,
  subscribePPLLintFixOutcome,
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

describe('PPL lint fix flow-active gate', () => {
  const REQ = 'flow-req';

  // No public "disarm all"; reset the id these tests use, then the session.
  const reset = () => {
    cleanupPPLLintFixRequest(REQ, PREFIX);
    clearPPLLintFixSession();
  };
  beforeEach(reset);
  afterEach(reset);

  it('is inactive when nothing is armed and no session exists', () => {
    expect(isPPLLintFixFlowActive()).toBe(false);
  });

  it('becomes active once a request is armed, before any session is stored', () => {
    armPPLLintFixRequest(REQ);
    expect(isPPLLintFixFlowActive()).toBe(true);
    expect(getPPLLintFixSession()).toBeUndefined();
  });

  it('stays active after the session is stored', () => {
    armPPLLintFixRequest(REQ);
    storePPLLintFixSession(createSession(REQ));
    expect(isPPLLintFixFlowActive()).toBe(true);
  });

  it('is active from a stored session even without an explicit arm', () => {
    storePPLLintFixSession(createSession(REQ));
    expect(isPPLLintFixFlowActive()).toBe(true);
  });

  it('goes inactive after cleanup disarms and clears the request', () => {
    armPPLLintFixRequest(REQ);
    storePPLLintFixSession(createSession(REQ));
    cleanupPPLLintFixRequest(REQ, PREFIX);
    expect(isPPLLintFixFlowActive()).toBe(false);
  });

  it('disarms even when the request never reached a stored session', () => {
    armPPLLintFixRequest(REQ);
    expect(isPPLLintFixFlowActive()).toBe(true);
    cleanupPPLLintFixRequest(REQ, PREFIX);
    expect(isPPLLintFixFlowActive()).toBe(false);
  });

  it('notifies subscribers on arm and on cleanup', () => {
    const callback = jest.fn();
    const unsubscribe = subscribePPLLintFixOutcome(callback);
    armPPLLintFixRequest(REQ);
    expect(callback).toHaveBeenCalledTimes(1);
    cleanupPPLLintFixRequest(REQ, PREFIX);
    expect(callback).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it('arming the same request twice notifies only once', () => {
    const callback = jest.fn();
    const unsubscribe = subscribePPLLintFixOutcome(callback);
    armPPLLintFixRequest(REQ);
    armPPLLintFixRequest(REQ);
    expect(callback).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
