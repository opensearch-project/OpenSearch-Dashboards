/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  clearPPLLintFixSession,
  getPPLLintFixSession,
  storePPLLintFixSession,
} from '../../chat_tools/ppl_lint_fix_session';
import {
  PPL_LINT_FIX_DATA_CONTEXT_ID_PREFIX,
  PPL_LINT_FIX_DATA_HOST,
} from '../../chat_tools/ppl_lint_fix_tool_registration';
import {
  addPPLLintFixAssistantContext,
  PPL_LINT_FIX_CHAT_TIMEOUT_ERROR,
  PPLLintFixLifecycle,
} from './ppl_lint_fix_lifecycle';

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

describe('PPLLintFixLifecycle', () => {
  beforeEach(() => {
    clearPPLLintFixSession();
  });

  afterEach(() => {
    clearPPLLintFixSession();
    jest.useRealTimers();
  });

  it('keeps the lint context through clearConversation by adding the page category', () => {
    const contextStore = { addContext: jest.fn() };
    const request = {
      ...createSession('request-a').request,
      chatContext: { requestId: 'request-a' },
    };

    addPPLLintFixAssistantContext(request, contextStore, PPL_LINT_FIX_DATA_HOST);

    expect(contextStore.addContext).toHaveBeenCalledWith(
      expect.objectContaining({
        id: PPL_LINT_FIX_DATA_CONTEXT_ID_PREFIX + 'request-a',
        value: request.chatContext,
        categories: ['page', 'chat', 'ppl-lint-fix'],
      })
    );
  });

  it('cleans the stored session and context when chat is unavailable', () => {
    const removeContextById = jest.fn();
    const lifecycle = new PPLLintFixLifecycle(PPL_LINT_FIX_DATA_HOST, removeContextById);
    lifecycle.beginRequest('request-a');
    storePPLLintFixSession(createSession('request-a'));

    lifecycle.abandonRequest('request-a');

    expect(getPPLLintFixSession()).toBeUndefined();
    expect(removeContextById).toHaveBeenCalledWith(
      PPL_LINT_FIX_DATA_CONTEXT_ID_PREFIX + 'request-a'
    );
  });

  it('cleans the stored session and context when chat launch rejects', async () => {
    const removeContextById = jest.fn();
    const lifecycle = new PPLLintFixLifecycle(PPL_LINT_FIX_DATA_HOST, removeContextById);
    lifecycle.beginRequest('request-a');
    storePPLLintFixSession(createSession('request-a'));

    const failure = await lifecycle.waitForChatLaunch('request-a', () =>
      Promise.reject(new Error('launch rejected'))
    );

    expect(failure).toEqual({
      error: new Error('launch rejected'),
      abandonedOwnedRequest: true,
    });
    expect(getPPLLintFixSession()).toBeUndefined();
    expect(removeContextById).toHaveBeenCalledWith(
      PPL_LINT_FIX_DATA_CONTEXT_ID_PREFIX + 'request-a'
    );
  });

  it('uses the shared timeout and cleans a timed-out launch', async () => {
    jest.useFakeTimers();
    const removeContextById = jest.fn();
    const lifecycle = new PPLLintFixLifecycle(PPL_LINT_FIX_DATA_HOST, removeContextById, 10);
    let resolveLaunch!: () => void;
    const launch = new Promise<void>((resolve) => {
      resolveLaunch = resolve;
    });
    lifecycle.beginRequest('request-a');
    storePPLLintFixSession(createSession('request-a'));

    const failurePromise = lifecycle.waitForChatLaunch('request-a', () => launch);
    await Promise.resolve();
    jest.advanceTimersByTime(10);
    const failure = await failurePromise;

    expect(failure?.error).toEqual(new Error(PPL_LINT_FIX_CHAT_TIMEOUT_ERROR));
    expect(failure?.abandonedOwnedRequest).toBe(true);
    expect(getPPLLintFixSession()).toBeUndefined();
    expect(removeContextById).toHaveBeenCalledWith(
      PPL_LINT_FIX_DATA_CONTEXT_ID_PREFIX + 'request-a'
    );
    resolveLaunch();
    await launch;
    await Promise.resolve();
  });

  it('cleans the previous request before owning a replacement', () => {
    const removeContextById = jest.fn();
    const lifecycle = new PPLLintFixLifecycle(PPL_LINT_FIX_DATA_HOST, removeContextById);
    lifecycle.beginRequest('request-a');
    storePPLLintFixSession(createSession('request-a'));

    lifecycle.beginRequest('request-b');
    const newerSession = createSession('request-b');
    storePPLLintFixSession(newerSession);

    expect(removeContextById).toHaveBeenCalledWith(
      PPL_LINT_FIX_DATA_CONTEXT_ID_PREFIX + 'request-a'
    );
    expect(getPPLLintFixSession()).toBe(newerSession);
  });

  it('does not clear a replacement when the old launch rejects late', async () => {
    const removeContextById = jest.fn();
    const lifecycle = new PPLLintFixLifecycle(PPL_LINT_FIX_DATA_HOST, removeContextById);
    let rejectLaunch!: (error: Error) => void;
    const launch = new Promise((_resolve, reject) => {
      rejectLaunch = reject;
    });
    lifecycle.beginRequest('request-a');
    storePPLLintFixSession(createSession('request-a'));
    const failurePromise = lifecycle.waitForChatLaunch('request-a', () => launch);
    await Promise.resolve();

    lifecycle.beginRequest('request-b');
    const newerSession = createSession('request-b');
    storePPLLintFixSession(newerSession);
    rejectLaunch(new Error('late request A failure'));
    const failure = await failurePromise;

    expect(failure?.abandonedOwnedRequest).toBe(false);
    expect(getPPLLintFixSession()).toBe(newerSession);
    expect(removeContextById).not.toHaveBeenCalledWith(
      PPL_LINT_FIX_DATA_CONTEXT_ID_PREFIX + 'request-b'
    );
  });

  it('serializes replacement launches so an older setup cannot resume after the newer one', async () => {
    const firstLifecycle = new PPLLintFixLifecycle(PPL_LINT_FIX_DATA_HOST, undefined, 1000, 1000);
    const secondLifecycle = new PPLLintFixLifecycle(PPL_LINT_FIX_DATA_HOST, undefined, 1000, 1000);
    let resolveFirstLaunch!: () => void;
    const firstLaunch = new Promise<void>((resolve) => {
      resolveFirstLaunch = resolve;
    });
    const secondLaunch = jest.fn(() => Promise.resolve());

    firstLifecycle.beginRequest('request-a');
    const firstWait = firstLifecycle.waitForChatLaunch('request-a', () => firstLaunch);
    await Promise.resolve();
    secondLifecycle.beginRequest('request-b');
    const secondWait = secondLifecycle.waitForChatLaunch('request-b', secondLaunch);

    await Promise.resolve();
    expect(secondLaunch).not.toHaveBeenCalled();
    expect(firstLifecycle.ownsRequest('request-a')).toBe(false);

    resolveFirstLaunch();
    await Promise.all([firstWait, secondWait]);

    expect(secondLaunch).toHaveBeenCalledTimes(1);
    expect(secondLifecycle.ownsRequest('request-b')).toBe(true);
    secondLifecycle.dispose();
  });

  it('expires a launched request when no tool action arrives', async () => {
    jest.useFakeTimers();
    const removeContextById = jest.fn();
    const lifecycle = new PPLLintFixLifecycle(PPL_LINT_FIX_DATA_HOST, removeContextById, 10, 20);
    lifecycle.beginRequest('request-a');

    await lifecycle.waitForChatLaunch('request-a', () => Promise.resolve());
    storePPLLintFixSession(createSession('request-a'));
    jest.advanceTimersByTime(20);

    expect(lifecycle.ownsRequest('request-a')).toBe(false);
    expect(getPPLLintFixSession()).toBeUndefined();
    expect(removeContextById).toHaveBeenCalledWith(
      PPL_LINT_FIX_DATA_CONTEXT_ID_PREFIX + 'request-a'
    );
  });

  it('cleans the owned request on editor unmount', () => {
    const removeContextById = jest.fn();
    const lifecycle = new PPLLintFixLifecycle(PPL_LINT_FIX_DATA_HOST, removeContextById);
    lifecycle.beginRequest('request-a');
    storePPLLintFixSession(createSession('request-a'));

    lifecycle.dispose();

    expect(getPPLLintFixSession()).toBeUndefined();
    expect(removeContextById).toHaveBeenCalledWith(
      PPL_LINT_FIX_DATA_CONTEXT_ID_PREFIX + 'request-a'
    );
  });

  describe('host parameterization', () => {
    // A second host with a distinct context-id prefix, standing in for Explore's
    // PPL_LINT_FIX_EXPLORE_HOST. The lifecycle must key cleanup and the context
    // entry on the host it was built with, not a hard-coded data prefix.
    const OTHER_HOST = {
      applyToolName: 'apply_ppl_lint_fix_other',
      testToolName: 'test_ppl_lint_fix_other',
      contextIdPrefix: 'ppl-lint-fix-other-',
      surfaceLabel: 'other panel',
    };

    it("removes the context under the host's own prefix on abandon", () => {
      const removeContextById = jest.fn();
      const lifecycle = new PPLLintFixLifecycle(OTHER_HOST, removeContextById);
      lifecycle.beginRequest('request-a');
      storePPLLintFixSession(createSession('request-a'));

      lifecycle.abandonRequest('request-a');

      expect(removeContextById).toHaveBeenCalledWith(OTHER_HOST.contextIdPrefix + 'request-a');
      expect(removeContextById).not.toHaveBeenCalledWith(
        PPL_LINT_FIX_DATA_CONTEXT_ID_PREFIX + 'request-a'
      );
      expect(getPPLLintFixSession()).toBeUndefined();
    });

    it("adds the context entry keyed on the host's prefix", () => {
      const contextStore = { addContext: jest.fn() };
      const request = {
        ...createSession('request-a').request,
        chatContext: { requestId: 'request-a' },
      };

      addPPLLintFixAssistantContext(request, contextStore, OTHER_HOST);

      expect(contextStore.addContext).toHaveBeenCalledWith(
        expect.objectContaining({
          id: OTHER_HOST.contextIdPrefix + 'request-a',
          categories: ['page', 'chat', 'ppl-lint-fix'],
        })
      );
    });

    it('supersedes a prior owned request on a different host and expires via TTL', async () => {
      jest.useFakeTimers();
      const removeContextById = jest.fn();
      const lifecycle = new PPLLintFixLifecycle(OTHER_HOST, removeContextById, 10, 20);
      lifecycle.beginRequest('request-a');
      storePPLLintFixSession(createSession('request-a'));
      // Supersede A with B: A's context is cleaned under OTHER_HOST's prefix.
      lifecycle.beginRequest('request-b');
      expect(removeContextById).toHaveBeenCalledWith(OTHER_HOST.contextIdPrefix + 'request-a');

      await lifecycle.waitForChatLaunch('request-b', () => Promise.resolve());
      storePPLLintFixSession(createSession('request-b'));
      jest.advanceTimersByTime(20);

      expect(lifecycle.ownsRequest('request-b')).toBe(false);
      expect(getPPLLintFixSession()).toBeUndefined();
      expect(removeContextById).toHaveBeenCalledWith(OTHER_HOST.contextIdPrefix + 'request-b');
    });
  });
});
