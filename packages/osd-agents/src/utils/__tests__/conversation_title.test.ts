/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  countGenuineHumanMessages,
  hasAssistantMessage,
  isFirstHumanTurn,
  isFirstRunOfTurn,
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
