/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  buildChatFixContext,
  buildChatFixMessage,
  capLength,
  hashPPLLintFixSource,
  BuildChatFixMessageInput,
  MAX_QUERY_CHARS,
} from '../build_chat_fix_message';

describe('capLength', () => {
  it('returns short text unchanged', () => {
    expect(capLength('short', 100)).toBe('short');
  });

  it('truncates and marks overlong text', () => {
    const out = capLength('x'.repeat(50), 10);
    expect(out.startsWith('xxxxxxxxxx')).toBe(true);
    expect(out).toContain('[truncated]');
    expect(out.length).toBeLessThan(50);
  });

  it('defaults to MAX_QUERY_CHARS', () => {
    const big = 'a'.repeat(MAX_QUERY_CHARS + 100);
    expect(capLength(big)).toContain('[truncated]');
  });
});

describe('buildChatFixMessage', () => {
  const request: BuildChatFixMessageInput = {
    requestId: 'req-1',
    sourceQueryHash: 'abcd1234',
    toolName: 'apply_ppl_lint_fix_data',
    modelUri: 'inmemory://m.ppl',
    query: 'source=accounts | where age = "thirty"',
    diagnostic: {
      message: 'Comparing numeric field to a string.',
      ruleId: 'type-mismatch-numeric',
    },
    datasetTitle: 'accounts',
    dataSourceId: 'mds-1',
  };

  it('keeps machine plumbing out of the visible message', () => {
    const message = buildChatFixMessage(request);
    expect(message).toContain('Please fix this query.');
    expect(message).toContain('Comparing numeric field');
    expect(message).toContain('```ppl');
    expect(message).toContain(request.query);
    expect(message).not.toContain('type-mismatch-numeric');
    expect(message).not.toContain('req-1');
    expect(message).not.toContain('abcd1234');
    expect(message).not.toContain('apply_ppl_lint_fix_data');
    expect(message).not.toContain('execute_ppl_query');
  });

  it('puts tool instructions and precise target context out of band', () => {
    const context = buildChatFixContext({
      ...request,
      diagnostic: {
        ...request.diagnostic,
        targetText: 'age = "thirty"',
        relatedTexts: ['eval age = raw_age'],
      },
    });
    const message = buildChatFixMessage({
      ...request,
      diagnostic: {
        ...request.diagnostic,
        targetText: 'age = "thirty"',
        relatedTexts: ['eval age = raw_age'],
      },
    });
    expect(message).toContain('Part to fix: `age = "thirty"`');
    expect(message).not.toContain('Attributed target');
    expect(context).toContain('apply_ppl_lint_fix_data');
    expect(context).toContain('age = "thirty"');
    expect(context).toContain('eval age = raw_age');
    // Generic (no-contract) branch scopes the edit hard: change ONLY the
    // attributed slice, copy every other stage character-for-character, and
    // never drop an unrelated stage (e.g. the time-range WHERE). Guards the
    // "model removed the @timestamp filter" case.
    expect(context).toContain('Change ONLY that attributed slice');
    expect(context).toContain('character-for-character');
    expect(context).toContain('time-range filter');
    expect(context).toContain('one short sentence in plain language');
  });

  it('instructs the model to verify candidates silently before proposing a fix', () => {
    const context = buildChatFixContext(request);
    // The silent test tool name is derived from the apply tool name.
    expect(context).toContain('test_ppl_lint_fix_data');
    // Test-first, propose-only-if-ok, and give-up-without-a-fix are all present.
    expect(context).toContain('ok:true');
    expect(context).toContain('cannot be automatically fixed');
    // On ok:true the model must call the apply tool immediately, not pause to ask
    // (the Apply/Dismiss card is the approval step). Guards the "why is there no
    // fix box?" case where the model validated then asked in text instead.
    expect(context).toContain('immediately call');
    expect(context).toContain('Do NOT stop to ask the user');
    // The apply tool is only mentioned as the gated, user-visible step.
    const applyIdx = context.indexOf('apply_ppl_lint_fix_data');
    const testIdx = context.indexOf('test_ppl_lint_fix_data');
    expect(testIdx).toBeGreaterThanOrEqual(0);
    expect(testIdx).toBeLessThan(applyIdx);
  });

  it('makes a rule-specific rewrite contract literal and limits the available tools', () => {
    const context = buildChatFixContext({
      ...request,
      diagnostic: {
        ...request.diagnostic,
        targetText: 'rex field=body "logtype=(?<logtype>.*)"',
        fixInstructions:
          "Insert exactly one `WHERE LIKE(body, '%logtype=%')` stage immediately before rex.",
      },
    });

    expect(context).toContain('MANDATORY rule-specific rewrite contract');
    expect(context).toContain("WHERE LIKE(body, '%logtype=%')");
    expect(context).toContain('FIRST candidate MUST implement that contract literally');
    expect(context).toContain('character-for-character');
    expect(context).toContain('call only test_ppl_lint_fix_data and apply_ppl_lint_fix_data');
    expect(context).toContain('Never call a query execution');
    expect(context).toContain('correct only transcription or placement mistakes');
    // When a rewrite contract is present, the generic "change ONLY that slice"
    // scoping must NOT also appear — the contract governs instead.
    expect(context).not.toContain('Change ONLY that attributed slice');
  });

  it('caps long queries before embedding them in the chat prompt', () => {
    const message = buildChatFixMessage({
      ...request,
      query: 'a'.repeat(MAX_QUERY_CHARS + 20),
    });
    expect(message).toContain('[truncated]');
    expect(message).not.toContain('a'.repeat(MAX_QUERY_CHARS + 1));
  });
});

describe('hashPPLLintFixSource', () => {
  it('is stable and changes when the source query changes', () => {
    expect(hashPPLLintFixSource('source=accounts')).toBe(hashPPLLintFixSource('source=accounts'));
    expect(hashPPLLintFixSource('source=accounts')).not.toBe(hashPPLLintFixSource('source=orders'));
  });
});
