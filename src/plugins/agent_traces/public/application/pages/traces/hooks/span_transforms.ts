/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TraceHit } from '../trace_details/traces/ppl_to_trace_hits';

export interface AgentSpan {
  spanId: string;
  traceId: string;
  parentSpanId: string | null;
  name: string;
  kind: string;
  operationName: string;
  startTime: string;
  endTime: string;
  durationNanos: number;
  statusCode: number;
  statusMessage: string;
  serviceName: string;
  genAiSystem: string;
  genAiRequestModel: string;
  genAiInputTokens: number | null;
  genAiOutputTokens: number | null;
  genAiTotalTokens: number | null;
  input: string;
  output: string;
  rawDocument: Record<string, unknown>;
}

export const formatDuration = (nanos: number): string => {
  if (!nanos || nanos <= 0) return '—';

  const ms = nanos / 1_000_000;
  if (ms < 1000) {
    const hasSubMsPrecision = nanos % 1_000_000 !== 0;
    return hasSubMsPrecision ? `${ms.toFixed(2)}ms` : `${Math.round(ms)}ms`;
  }
  const seconds = ms / 1000;
  return `${seconds.toFixed(2)}s`;
};

/**
 * Unflatten a flat dotted-key _source object into a nested structure.
 * OpenSearch _source documents use flat keys like "attributes.gen_ai.operation.name"
 * while TraceHit expects nested objects like { attributes: { gen_ai: { operation: { name } } } }.
 * Top-level keys that already exist as non-primitive values (objects) are preserved.
 */
export const unflattenSource = (source: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};

  for (const key of Object.keys(source)) {
    const parts = key.split('.');
    if (parts.length === 1) {
      // Top-level key — preserve as-is
      result[key] = source[key];
    } else {
      // Dotted key — build nested structure
      let current = result;
      let reachable = true;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (current[part] === undefined || current[part] === null) {
          current[part] = {};
        } else if (typeof current[part] !== 'object' || Array.isArray(current[part])) {
          // Don't overwrite existing primitive or array values
          reachable = false;
          break;
        }
        current = current[part];
      }
      if (reachable) {
        const lastPart = parts[parts.length - 1];
        if (current[lastPart] === undefined) {
          current[lastPart] = source[key];
        }
      }
    }
  }

  return result;
};

export const traceHitToAgentSpan = (hit: TraceHit, index: number): AgentSpan => ({
  spanId: hit.spanId || `span-${index}`,
  traceId: hit.traceId || '',
  parentSpanId: hit.parentSpanId || null,
  name: hit.name || '',
  kind: hit.kind || '',
  operationName: hit.attributes?.gen_ai?.operation?.name || '',
  startTime: hit.startTime || '',
  endTime: hit.endTime || '',
  durationNanos: hit.durationInNanos || 0,
  statusCode: hit['status.code'] ?? hit.status?.code ?? 0,
  statusMessage: hit.status?.message || '',
  serviceName: hit.serviceName || '',
  genAiSystem: hit.attributes?.gen_ai?.system || '',
  genAiRequestModel: hit.attributes?.gen_ai?.request?.model || '',
  genAiInputTokens: hit.attributes?.gen_ai?.usage?.input_tokens || null,
  genAiOutputTokens: hit.attributes?.gen_ai?.usage?.output_tokens || null,
  genAiTotalTokens: hit.attributes?.gen_ai?.usage?.total_tokens || null,
  input:
    hit.attributes?.gen_ai?.input?.messages ||
    hit.attributes?.gen_ai?.prompt ||
    hit.attributes?.input?.value ||
    '—',
  output:
    hit.attributes?.gen_ai?.output?.messages ||
    hit.attributes?.gen_ai?.completion ||
    hit.attributes?.output?.value ||
    '—',
  rawDocument: hit as Record<string, unknown>,
});
