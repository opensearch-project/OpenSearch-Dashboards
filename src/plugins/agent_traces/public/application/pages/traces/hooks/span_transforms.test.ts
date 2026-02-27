/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { formatDuration, traceHitToAgentSpan, AgentSpan } from './span_transforms';

describe('span_transforms', () => {
  describe('formatDuration', () => {
    it('returns dash for zero or negative nanos', () => {
      expect(formatDuration(0)).toBe('—');
      expect(formatDuration(-100)).toBe('—');
    });

    it('formats sub-millisecond precision', () => {
      expect(formatDuration(500_000)).toBe('0.50ms');
    });

    it('formats whole milliseconds without decimals', () => {
      expect(formatDuration(5_000_000)).toBe('5ms');
    });

    it('formats milliseconds with sub-ms precision', () => {
      expect(formatDuration(5_500_000)).toBe('5.50ms');
    });

    it('formats seconds', () => {
      expect(formatDuration(1_500_000_000)).toBe('1.50s');
    });

    it('formats exactly 1 second', () => {
      expect(formatDuration(1_000_000_000)).toBe('1.00s');
    });

    it('returns dash for NaN input', () => {
      expect(formatDuration(NaN)).toBe('—');
    });
  });

  describe('traceHitToAgentSpan', () => {
    const baseHit: any = {
      spanId: 'span-123',
      traceId: 'trace-456',
      parentSpanId: 'parent-789',
      name: 'test-span',
      kind: 'INTERNAL',
      startTime: '2025-01-01 00:00:00',
      endTime: '2025-01-01 00:00:01',
      durationInNanos: 1_000_000_000,
      'status.code': 0,
      status: { message: '' },
      serviceName: 'test-service',
      attributes: {
        gen_ai: {
          operation: { name: 'chat' },
          system: 'openai',
          request: { model: 'gpt-4' },
          usage: { input_tokens: 100, output_tokens: 50, total_tokens: 150 },
          input: { messages: '{"role":"user","content":"hello"}' },
          output: { messages: '{"role":"assistant","content":"hi"}' },
        },
      },
    };

    it('maps all fields from a trace hit', () => {
      const span: AgentSpan = traceHitToAgentSpan(baseHit, 0);

      expect(span.spanId).toBe('span-123');
      expect(span.traceId).toBe('trace-456');
      expect(span.parentSpanId).toBe('parent-789');
      expect(span.name).toBe('test-span');
      expect(span.kind).toBe('INTERNAL');
      expect(span.operationName).toBe('chat');
      expect(span.durationNanos).toBe(1_000_000_000);
      expect(span.statusCode).toBe(0);
      expect(span.serviceName).toBe('test-service');
      expect(span.genAiSystem).toBe('openai');
      expect(span.genAiRequestModel).toBe('gpt-4');
      expect(span.genAiInputTokens).toBe(100);
      expect(span.genAiOutputTokens).toBe(50);
      expect(span.genAiTotalTokens).toBe(150);
      expect(span.input).toBe('{"role":"user","content":"hello"}');
      expect(span.output).toBe('{"role":"assistant","content":"hi"}');
    });

    it('handles missing fields with defaults', () => {
      const minimalHit: any = {};
      const span = traceHitToAgentSpan(minimalHit, 5);

      expect(span.spanId).toBe('span-5');
      expect(span.traceId).toBe('');
      expect(span.parentSpanId).toBeNull();
      expect(span.name).toBe('');
      expect(span.operationName).toBe('');
      expect(span.durationNanos).toBe(0);
      expect(span.genAiInputTokens).toBeNull();
      expect(span.genAiOutputTokens).toBeNull();
      expect(span.input).toBe('—');
      expect(span.output).toBe('—');
    });

    it('falls back through input attribute hierarchy', () => {
      const hitWithPrompt: any = {
        attributes: {
          gen_ai: { prompt: 'test prompt' },
        },
      };
      const span = traceHitToAgentSpan(hitWithPrompt, 0);
      expect(span.input).toBe('test prompt');

      const hitWithInputValue: any = {
        attributes: {
          input: { value: 'input value' },
        },
      };
      const span2 = traceHitToAgentSpan(hitWithInputValue, 0);
      expect(span2.input).toBe('input value');
    });
  });
});
