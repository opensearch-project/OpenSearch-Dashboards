/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  parseGenAiMessages,
  previewInputMessages,
  previewMessage,
  previewOutputMessages,
  previewSpanInput,
  previewSpanOutput,
} from './genai_message_preview';

const text = (content: string) => ({ type: 'text', content });

describe('genai_message_preview', () => {
  describe('parseGenAiMessages', () => {
    it('accepts the schema as a JSON string or structured value', () => {
      const messages = [{ role: 'user', parts: [text('hi')] }];
      expect(parseGenAiMessages(JSON.stringify(messages))).toEqual(messages);
      expect(parseGenAiMessages(messages)).toEqual(messages);
    });

    it('rejects values that do not follow the schema', () => {
      expect(parseGenAiMessages('plain text')).toBeNull();
      expect(parseGenAiMessages([])).toBeNull();
      expect(parseGenAiMessages({ role: 'user', parts: [text('x')] })).toBeNull(); // not an array
      expect(parseGenAiMessages([{ role: 'user', content: 'legacy' }])).toBeNull(); // no parts
      expect(parseGenAiMessages([{ role: 'user', parts: [{ content: 'no type' }] }])).toBeNull();
      expect(parseGenAiMessages('[not json')).toBeNull();
    });
  });

  describe('previewMessage', () => {
    it('joins text parts and ignores other parts when text exists', () => {
      expect(
        previewMessage({
          role: 'assistant',
          parts: [
            { type: 'reasoning', content: 'thinking' },
            text('Line 1'),
            { type: 'tool_call', name: 'get_weather' },
            text('Line 2'),
          ],
        })
      ).toBe('Line 1\nLine 2');
    });

    it('uses placeholders when there is no text', () => {
      expect(
        previewMessage({
          role: 'assistant',
          parts: [
            { type: 'tool_call', id: 'c1', name: 'get_weather', arguments: { city: 'Paris' } },
            { type: 'server_tool_call', name: 'code_interpreter', server_tool_call: {} },
          ],
        })
      ).toBe('[tool_call: get_weather] [server_tool_call: code_interpreter]');
      expect(
        previewMessage({ role: 'tool', parts: [{ type: 'tool_call_response', response: {} }] })
      ).toBe('[tool_call_response]');
      expect(
        previewMessage({
          role: 'user',
          parts: [
            { type: 'blob', modality: 'image', content: 'base64' },
            { type: 'uri', modality: 'audio', uri: 's3://a' },
            { type: 'file', modality: 'video', file_id: 'f1' },
          ],
        })
      ).toBe('[image] [audio] [video]');
    });

    it('shows reasoning only when nothing else is present, and skips compaction', () => {
      expect(
        previewMessage({ role: 'assistant', parts: [{ type: 'reasoning', content: 'x' }] })
      ).toBe('[reasoning]');
      expect(previewMessage({ role: 'assistant', parts: [{ type: 'compaction' }] })).toBe('');
      expect(previewMessage({ role: 'assistant', parts: [{ type: 'custom_part' }] })).toBe(
        '[custom_part]'
      );
    });
  });

  describe('previewInputMessages', () => {
    it('previews the last user message of the chat history', () => {
      const history = JSON.stringify([
        { role: 'system', parts: [text('You are a travel agent')] },
        { role: 'user', parts: [text('Plan a trip to Paris')] },
        { role: 'assistant', parts: [text('Sure, when?')] },
        { role: 'user', parts: [text('Next weekend')] },
      ]);
      expect(previewInputMessages(history)).toBe('Next weekend');
    });

    it('falls back to the last message when there is no user message', () => {
      const value = [
        { role: 'assistant', parts: [{ type: 'tool_call', name: 'search' }] },
        { role: 'tool', parts: [{ type: 'tool_call_response', response: 'ok' }] },
      ];
      expect(previewInputMessages(value)).toBe('[tool_call_response]');
    });

    it('tolerates non-conforming values', () => {
      expect(
        previewInputMessages(
          JSON.stringify([
            { role: 'user', content: 'first' },
            { role: 'user', content: 'legacy last' },
          ])
        )
      ).toBe('legacy last');
      expect(previewInputMessages('just text')).toBe('just text');
      expect(previewInputMessages('[not json')).toBe('[not json');
      expect(previewInputMessages(undefined)).toBe('');
      expect(previewInputMessages('—')).toBe('');
    });
  });

  describe('previewOutputMessages', () => {
    it('joins one line per generation', () => {
      const value = JSON.stringify([
        { role: 'assistant', parts: [text('Choice A')], finish_reason: 'stop' },
        { role: 'assistant', parts: [text('Choice B')], finish_reason: 'stop' },
      ]);
      expect(previewOutputMessages(value)).toBe('Choice A\nChoice B');
    });

    it('shows a tool call when the model only called a tool', () => {
      const value = [
        {
          role: 'assistant',
          parts: [{ type: 'tool_call', name: 'get_weather' }],
          finish_reason: 'tool_call',
        },
      ];
      expect(previewOutputMessages(value)).toBe('[tool_call: get_weather]');
    });
  });

  describe('previewSpanInput / previewSpanOutput', () => {
    it('prefers message previews', () => {
      const row = {
        input: JSON.stringify([{ role: 'user', parts: [text('hello')] }]),
        output: JSON.stringify([{ role: 'assistant', parts: [text('hi there')] }]),
        rawDocument: { attributes: { 'gen_ai.tool.call.arguments': '{"x":1}' } },
      };
      expect(previewSpanInput(row)).toBe('hello');
      expect(previewSpanOutput(row)).toBe('hi there');
    });

    it('falls back to tool call arguments/result on execute_tool spans', () => {
      const flat = {
        input: '—',
        output: '—',
        rawDocument: {
          attributes: {
            'gen_ai.tool.call.arguments': '{"city": "Paris"}',
            'gen_ai.tool.call.result': { temp: 20 },
          },
        },
      };
      expect(previewSpanInput(flat)).toBe('{"city": "Paris"}');
      expect(previewSpanOutput(flat)).toBe('{"temp":20}');

      const nested = {
        rawDocument: { attributes: { gen_ai: { tool: { call: { arguments: '{"q":"x"}' } } } } },
      };
      expect(previewSpanInput(nested)).toBe('{"q":"x"}');
      expect(previewSpanOutput(nested)).toBe('');
    });
  });
});
