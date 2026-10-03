/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  countGenuineHumanMessages,
  hasAssistantMessage,
  isFirstHumanTurn,
  isFirstRunOfTurn,
  parseTitleLine,
  createLeadingTitleScanner,
} from '../conversation_title';

const human = (text: string) => ({ role: 'user', content: [{ text }] });
const bedrockToolResult = () => ({
  role: 'user',
  content: [{ toolResult: { toolUseId: 't1', content: [{ text: '{}' }] } }],
});
const assistantToolUse = () => ({
  role: 'assistant',
  content: [{ toolUse: { toolUseId: 't1', name: 'ListIndexTool', input: {} } }],
});
const frontendToolResult = () => ({ role: 'tool', content: '{}', toolCallId: 't1' });

describe('countGenuineHumanMessages', () => {
  it('returns 0 for non-array input', () => {
    expect(countGenuineHumanMessages(undefined as any)).toBe(0);
  });

  it('excludes Bedrock tool-result user messages', () => {
    const messages = [human('list my indices'), assistantToolUse(), bedrockToolResult()];
    expect(countGenuineHumanMessages(messages)).toBe(1);
  });

  it('counts string-content user messages', () => {
    expect(countGenuineHumanMessages([{ role: 'user', content: 'hi' }])).toBe(1);
  });

  it('does not count frontend tool results', () => {
    const messages = [human('show errors'), assistantToolUse(), frontendToolResult()];
    expect(countGenuineHumanMessages(messages)).toBe(1);
  });
});

describe('isFirstHumanTurn', () => {
  it('is true for a single human message', () => {
    expect(isFirstHumanTurn([human('hi')])).toBe(true);
  });

  it('stays true across a backend tool round', () => {
    expect(isFirstHumanTurn([human('q'), assistantToolUse(), bedrockToolResult()])).toBe(true);
  });

  it('is false on a genuine second human turn', () => {
    const messages = [human('q1'), { role: 'assistant', content: [{ text: 'a1' }] }, human('q2')];
    expect(isFirstHumanTurn(messages)).toBe(false);
  });
});

describe('hasAssistantMessage', () => {
  it('detects an assistant message', () => {
    expect(hasAssistantMessage([human('q'), assistantToolUse()])).toBe(true);
    expect(hasAssistantMessage([human('q')])).toBe(false);
    expect(hasAssistantMessage(undefined as any)).toBe(false);
  });
});

describe('isFirstRunOfTurn', () => {
  it('is true on the initial request of the first turn', () => {
    expect(isFirstRunOfTurn([human('q')])).toBe(true);
  });

  it('is false on a frontend-tool continuation request', () => {
    expect(isFirstRunOfTurn([human('q'), assistantToolUse(), frontendToolResult()])).toBe(false);
  });

  it('is false on a second human turn', () => {
    const messages = [human('q1'), { role: 'assistant', content: [{ text: 'a1' }] }, human('q2')];
    expect(isFirstRunOfTurn(messages)).toBe(false);
  });
});

describe('parseTitleLine', () => {
  it('parses a well-formed title line', () => {
    expect(parseTitleLine('CONVERSATION_TITLE: Yellow Cluster Status')).toBe(
      'Yellow Cluster Status'
    );
  });

  it('is case-insensitive and tolerates leading/inner whitespace', () => {
    expect(parseTitleLine('  conversation_title:   Trimmed Title  ')).toBe('Trimmed Title');
  });

  it('returns null for a non-title line', () => {
    expect(parseTitleLine('Here are your indices.')).toBeNull();
  });

  it('returns null for an empty title value', () => {
    expect(parseTitleLine('CONVERSATION_TITLE:   ')).toBeNull();
  });

  it('returns null for a title longer than 100 chars', () => {
    expect(parseTitleLine(`CONVERSATION_TITLE: ${'x'.repeat(101)}`)).toBeNull();
  });
});

describe('createLeadingTitleScanner', () => {
  it('fires once when the leading line is a title, then ignores the rest', () => {
    const onTitle = jest.fn();
    const scan = createLeadingTitleScanner(onTitle);
    // Title streamed split across deltas, then the answer body.
    scan('CONVERSATI');
    scan('ON_TITLE: List Cluster Indices\nHere are ');
    scan('your indices.\nCONVERSATION_TITLE: A Later Stray Title\n');
    expect(onTitle).toHaveBeenCalledTimes(1);
    expect(onTitle).toHaveBeenCalledWith('List Cluster Indices');
  });

  it('skips leading blank lines before the title', () => {
    const onTitle = jest.fn();
    const scan = createLeadingTitleScanner(onTitle);
    scan('\n\nCONVERSATION_TITLE: After Blanks\nbody');
    expect(onTitle).toHaveBeenCalledWith('After Blanks');
  });

  it('fires on an injected newline when the title block has no trailing newline', () => {
    // Mirrors the tool-call boundary: the model streams the title with no
    // trailing newline, then the adapter feeds a '\n' at onToolUseStart.
    const onTitle = jest.fn();
    const scan = createLeadingTitleScanner(onTitle);
    scan('CONVERSATION_TITLE: List All Cluster Indices');
    expect(onTitle).not.toHaveBeenCalled(); // no newline yet
    scan('\n'); // block boundary
    expect(onTitle).toHaveBeenCalledWith('List All Cluster Indices');
  });

  it('does not fire when the first non-blank line is not a title', () => {
    const onTitle = jest.fn();
    const scan = createLeadingTitleScanner(onTitle);
    scan('Here are your indices.\nCONVERSATION_TITLE: Too Late\n');
    expect(onTitle).not.toHaveBeenCalled();
  });

  it('stops scanning once the leading line runs past the cap without a newline', () => {
    const onTitle = jest.fn();
    const scan = createLeadingTitleScanner(onTitle);
    scan('x'.repeat(600));
    // A newline arrives only after the cap was exceeded; scanner already gave up.
    scan('\nCONVERSATION_TITLE: Ignored\n');
    expect(onTitle).not.toHaveBeenCalled();
  });
});
