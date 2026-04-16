/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Message, AssistantMessage, UserMessage, ToolMessage } from '../../../common/types';
import {
  collectChatExportData,
  findPrecedingQuestion,
  extractTraces,
  extractTracesFromTurn,
  getToolCallIdsFromTurn,
} from './investigation_export_service';

// Mock html2canvas-pro to avoid DOM dependency in unit tests
jest.mock('html2canvas-pro', () => {
  const fn = jest.fn().mockResolvedValue({
    toDataURL: jest.fn().mockReturnValue('data:image/png;base64,mockBase64'),
  });
  (fn as any).setCspNonce = jest.fn();
  return { __esModule: true, default: fn };
});

describe('findPrecedingQuestion', () => {
  it('should find the preceding user message with string content', () => {
    const timeline: Message[] = [
      { id: 'u1', role: 'user', content: 'What caused the crash?' } as UserMessage,
      { id: 'a1', role: 'assistant', content: 'Found 3,247 crash events.' } as AssistantMessage,
    ];
    expect(findPrecedingQuestion(timeline, 1)).toBe('What caused the crash?');
  });

  it('should find the preceding user message with multimodal content', () => {
    const timeline: Message[] = [
      {
        id: 'u1',
        role: 'user',
        content: [
          { type: 'binary', mimeType: 'image/png', data: 'abc' },
          { type: 'text', text: 'Analyze this chart' },
        ],
      } as UserMessage,
      { id: 'a1', role: 'assistant', content: 'The chart shows...' } as AssistantMessage,
    ];
    expect(findPrecedingQuestion(timeline, 1)).toBe('Analyze this chart');
  });

  it('should return empty string when no preceding user message exists', () => {
    const timeline: Message[] = [
      { id: 'a1', role: 'assistant', content: 'Hello!' } as AssistantMessage,
    ];
    expect(findPrecedingQuestion(timeline, 0)).toBe('');
  });

  it('should skip non-user messages when walking backward', () => {
    const timeline: Message[] = [
      { id: 'u1', role: 'user', content: 'First question' } as UserMessage,
      { id: 'a1', role: 'assistant', content: 'First answer' } as AssistantMessage,
      { id: 't1', role: 'tool', content: 'tool result', toolCallId: 'tc1' } as ToolMessage,
      { id: 'a2', role: 'assistant', content: 'Second answer' } as AssistantMessage,
    ];
    expect(findPrecedingQuestion(timeline, 3)).toBe('First question');
  });

  it('should find the nearest user message in multi-turn conversation', () => {
    const timeline: Message[] = [
      { id: 'u1', role: 'user', content: 'First question' } as UserMessage,
      { id: 'a1', role: 'assistant', content: 'First answer' } as AssistantMessage,
      { id: 'u2', role: 'user', content: 'Second question' } as UserMessage,
      { id: 'a2', role: 'assistant', content: 'Second answer' } as AssistantMessage,
    ];
    expect(findPrecedingQuestion(timeline, 3)).toBe('Second question');
  });

  it('should return empty string for user message with empty array content', () => {
    const timeline: Message[] = [
      ({ id: 'u1', role: 'user', content: [] } as unknown) as UserMessage,
      { id: 'a1', role: 'assistant', content: 'Answer' } as AssistantMessage,
    ];
    expect(findPrecedingQuestion(timeline, 1)).toBe('');
  });
});

describe('extractTraces', () => {
  it('should extract traces from tool calls on the target message', () => {
    const timeline: Message[] = [
      { id: 'u1', role: 'user', content: 'Question' } as UserMessage,
      {
        id: 'a1',
        role: 'assistant',
        content: 'Answer',
        toolCalls: [
          {
            id: 'tc1',
            type: 'function',
            function: { name: 'SearchTool', arguments: '{"q":"test"}' },
          },
        ],
      } as AssistantMessage,
      { id: 'tr1', role: 'tool', content: 'Search results', toolCallId: 'tc1' } as ToolMessage,
    ];
    const traces = extractTraces(timeline, 1);
    expect(traces).toHaveLength(1);
    expect(traces[0].toolName).toBe('SearchTool');
    expect(traces[0].arguments).toBe('{"q":"test"}');
    expect(traces[0].result).toBe('Search results');
  });

  it('should handle tool calls with no matching result', () => {
    const timeline: Message[] = [
      { id: 'u1', role: 'user', content: 'Question' } as UserMessage,
      {
        id: 'a1',
        role: 'assistant',
        content: 'Answer',
        toolCalls: [
          { id: 'tc1', type: 'function', function: { name: 'SearchTool', arguments: '{}' } },
        ],
      } as AssistantMessage,
    ];
    const traces = extractTraces(timeline, 1);
    expect(traces).toHaveLength(1);
    expect(traces[0].result).toBeUndefined();
  });

  it('should handle tool result with error', () => {
    const timeline: Message[] = [
      { id: 'u1', role: 'user', content: 'Question' } as UserMessage,
      {
        id: 'a1',
        role: 'assistant',
        content: 'Answer',
        toolCalls: [
          { id: 'tc1', type: 'function', function: { name: 'FailTool', arguments: '{}' } },
        ],
      } as AssistantMessage,
      {
        id: 'tr1',
        role: 'tool',
        content: 'Error occurred',
        toolCallId: 'tc1',
        error: 'timeout',
      } as ToolMessage,
    ];
    const traces = extractTraces(timeline, 1);
    expect(traces[0].error).toBe('timeout');
  });

  it('should extract multiple tool calls', () => {
    const timeline: Message[] = [
      { id: 'u1', role: 'user', content: 'Question' } as UserMessage,
      {
        id: 'a1',
        role: 'assistant',
        content: 'Answer',
        toolCalls: [
          { id: 'tc1', type: 'function', function: { name: 'ToolA', arguments: '{}' } },
          { id: 'tc2', type: 'function', function: { name: 'ToolB', arguments: '{}' } },
        ],
      } as AssistantMessage,
      { id: 'tr1', role: 'tool', content: 'Result A', toolCallId: 'tc1' } as ToolMessage,
      { id: 'tr2', role: 'tool', content: 'Result B', toolCallId: 'tc2' } as ToolMessage,
    ];
    const traces = extractTraces(timeline, 1);
    expect(traces).toHaveLength(2);
    expect(traces[0].toolName).toBe('ToolA');
    expect(traces[1].toolName).toBe('ToolB');
  });

  it('should fall back to extractTracesFromTurn when no toolCalls on target', () => {
    const timeline: Message[] = [
      { id: 'u1', role: 'user', content: 'Question' } as UserMessage,
      {
        id: 'a1',
        role: 'assistant',
        content: '',
        toolCalls: [{ id: 'tc1', type: 'function', function: { name: 'ToolA', arguments: '{}' } }],
      } as AssistantMessage,
      { id: 'tr1', role: 'tool', content: 'Result A', toolCallId: 'tc1' } as ToolMessage,
      { id: 'a2', role: 'assistant', content: 'Final answer' } as AssistantMessage,
    ];
    const traces = extractTraces(timeline, 3);
    expect(traces).toHaveLength(1);
    expect(traces[0].toolName).toBe('ToolA');
  });
});

describe('extractTracesFromTurn', () => {
  it('should extract traces from the same Q&A turn', () => {
    const timeline: Message[] = [
      { id: 'u1', role: 'user', content: 'Q1' } as UserMessage,
      {
        id: 'a1',
        role: 'assistant',
        toolCalls: [{ id: 'tc1', type: 'function', function: { name: 'Tool1', arguments: '{}' } }],
      } as AssistantMessage,
      { id: 'tr1', role: 'tool', content: 'R1', toolCallId: 'tc1' } as ToolMessage,
      { id: 'a2', role: 'assistant', content: 'Answer' } as AssistantMessage,
      { id: 'u2', role: 'user', content: 'Q2' } as UserMessage,
    ];
    const traces = extractTracesFromTurn(timeline, 3);
    expect(traces).toHaveLength(1);
    expect(traces[0].toolName).toBe('Tool1');
  });

  it('should not include traces from a different Q&A turn', () => {
    const timeline: Message[] = [
      { id: 'u1', role: 'user', content: 'Q1' } as UserMessage,
      {
        id: 'a1',
        role: 'assistant',
        toolCalls: [
          { id: 'tc1', type: 'function', function: { name: 'OldTool', arguments: '{}' } },
        ],
      } as AssistantMessage,
      { id: 'tr1', role: 'tool', content: 'Old result', toolCallId: 'tc1' } as ToolMessage,
      { id: 'u2', role: 'user', content: 'Q2' } as UserMessage,
      {
        id: 'a2',
        role: 'assistant',
        toolCalls: [
          { id: 'tc2', type: 'function', function: { name: 'NewTool', arguments: '{}' } },
        ],
      } as AssistantMessage,
      { id: 'tr2', role: 'tool', content: 'New result', toolCallId: 'tc2' } as ToolMessage,
      { id: 'a3', role: 'assistant', content: 'Final' } as AssistantMessage,
    ];
    const traces = extractTracesFromTurn(timeline, 6);
    expect(traces).toHaveLength(1);
    expect(traces[0].toolName).toBe('NewTool');
  });

  it('should return empty array when no tool calls in turn', () => {
    const timeline: Message[] = [
      { id: 'u1', role: 'user', content: 'Q1' } as UserMessage,
      { id: 'a1', role: 'assistant', content: 'Simple answer' } as AssistantMessage,
    ];
    const traces = extractTracesFromTurn(timeline, 1);
    expect(traces).toHaveLength(0);
  });
});

describe('getToolCallIdsFromTurn', () => {
  it('should return tool call IDs from the same Q&A turn', () => {
    const timeline: Message[] = [
      { id: 'u1', role: 'user', content: 'Q1' } as UserMessage,
      {
        id: 'a1',
        role: 'assistant',
        toolCalls: [
          { id: 'tc1', type: 'function', function: { name: 'ToolA', arguments: '{}' } },
          { id: 'tc2', type: 'function', function: { name: 'ToolB', arguments: '{}' } },
        ],
      } as AssistantMessage,
      { id: 'a2', role: 'assistant', content: 'Answer' } as AssistantMessage,
    ];
    const ids = getToolCallIdsFromTurn(timeline, 2);
    expect(ids).toEqual(['tc1', 'tc2']);
  });

  it('should not include tool call IDs from a different Q&A turn', () => {
    const timeline: Message[] = [
      { id: 'u1', role: 'user', content: 'Q1' } as UserMessage,
      {
        id: 'a1',
        role: 'assistant',
        toolCalls: [
          { id: 'tc-old', type: 'function', function: { name: 'OldTool', arguments: '{}' } },
        ],
      } as AssistantMessage,
      { id: 'u2', role: 'user', content: 'Q2' } as UserMessage,
      {
        id: 'a2',
        role: 'assistant',
        toolCalls: [
          { id: 'tc-new', type: 'function', function: { name: 'NewTool', arguments: '{}' } },
        ],
      } as AssistantMessage,
      { id: 'a3', role: 'assistant', content: 'Final' } as AssistantMessage,
    ];
    const ids = getToolCallIdsFromTurn(timeline, 4);
    expect(ids).toEqual(['tc-new']);
    expect(ids).not.toContain('tc-old');
  });

  it('should return empty array when no tool calls in turn', () => {
    const timeline: Message[] = [
      { id: 'u1', role: 'user', content: 'Q1' } as UserMessage,
      { id: 'a1', role: 'assistant', content: 'Simple answer' } as AssistantMessage,
    ];
    const ids = getToolCallIdsFromTurn(timeline, 1);
    expect(ids).toHaveLength(0);
  });
});

describe('collectChatExportData', () => {
  const baseOptions = {
    includeAISummary: true,
    includeTraces: true,
    includeVisualizations: false,
    includeMetadata: true,
    format: 'pdf' as const,
  };

  it('should collect question, answer, traces, and metadata', async () => {
    const timeline: Message[] = [
      { id: 'u1', role: 'user', content: 'What happened?' } as UserMessage,
      {
        id: 'a1',
        role: 'assistant',
        content: 'Found **issues**.',
        toolCalls: [
          {
            id: 'tc1',
            type: 'function',
            function: { name: 'SearchTool', arguments: '{"q":"logs"}' },
          },
        ],
      } as AssistantMessage,
      { id: 'tr1', role: 'tool', content: 'Log results', toolCallId: 'tc1' } as ToolMessage,
    ];

    const data = await collectChatExportData(
      timeline,
      timeline[1] as AssistantMessage,
      'thread-123',
      baseOptions
    );

    expect(data.question).toBe('What happened?');
    expect(data.answer).toBe('Found **issues**.');
    expect(data.traces).toHaveLength(1);
    expect(data.metadata?.threadId).toBe('thread-123');
    expect(data.visualizations).toHaveLength(0);
  });

  it('should skip traces when includeTraces is false', async () => {
    const timeline: Message[] = [
      { id: 'u1', role: 'user', content: 'Question' } as UserMessage,
      {
        id: 'a1',
        role: 'assistant',
        content: 'Answer',
        toolCalls: [{ id: 'tc1', type: 'function', function: { name: 'Tool', arguments: '{}' } }],
      } as AssistantMessage,
    ];

    const data = await collectChatExportData(
      timeline,
      timeline[1] as AssistantMessage,
      'thread-1',
      { ...baseOptions, includeTraces: false }
    );

    expect(data.traces).toHaveLength(0);
  });

  it('should skip metadata when includeMetadata is false', async () => {
    const timeline: Message[] = [
      { id: 'u1', role: 'user', content: 'Question' } as UserMessage,
      { id: 'a1', role: 'assistant', content: 'Answer' } as AssistantMessage,
    ];

    const data = await collectChatExportData(
      timeline,
      timeline[1] as AssistantMessage,
      'thread-1',
      { ...baseOptions, includeMetadata: false }
    );

    expect(data.metadata).toBeUndefined();
  });

  it('should include note when provided', async () => {
    const timeline: Message[] = [
      { id: 'u1', role: 'user', content: 'Question' } as UserMessage,
      { id: 'a1', role: 'assistant', content: 'Answer' } as AssistantMessage,
    ];

    const data = await collectChatExportData(
      timeline,
      timeline[1] as AssistantMessage,
      'thread-1',
      { ...baseOptions, note: 'Check the v2.1.3 update' }
    );

    expect(data.note).toBe('Check the v2.1.3 update');
  });

  it('should handle empty answer content', async () => {
    const timeline: Message[] = [
      { id: 'u1', role: 'user', content: 'Question' } as UserMessage,
      { id: 'a1', role: 'assistant' } as AssistantMessage,
    ];

    const data = await collectChatExportData(
      timeline,
      timeline[1] as AssistantMessage,
      undefined,
      baseOptions
    );

    expect(data.answer).toBe('');
  });
});
