/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * One-line previews of OTel GenAI message attributes for table cells and the session
 * conversation.
 *
 * Per the GenAI semantic conventions (`model/gen-ai/gen-ai-input-messages.json`,
 * `gen-ai-output-messages.json`), `gen_ai.input.messages` and `gen_ai.output.messages`
 * MUST be an array of `{ role, parts[], name? }` messages (output messages add
 * `finish_reason`). On spans the value MAY be a JSON string. Input messages are the full
 * chat history in send order, so the input preview is the last `user` message.
 */

export type GenAiRole = 'system' | 'user' | 'assistant' | 'tool' | string;

export interface GenAiMessagePart {
  type: string;
  [key: string]: unknown;
}

export interface GenAiMessage {
  role: GenAiRole;
  parts: GenAiMessagePart[];
  name?: string;
  finish_reason?: string;
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isConformingMessage = (v: unknown): v is GenAiMessage =>
  isObject(v) &&
  typeof v.role === 'string' &&
  Array.isArray(v.parts) &&
  v.parts.every((p) => isObject(p) && typeof p.type === 'string');

/** Decode the attribute value (JSON string or structured) without validating its shape. */
const decode = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
};

/**
 * Parse a message attribute that conforms to the semconv schema.
 * Returns null when the value is missing or does not conform (callers fall back).
 */
export const parseGenAiMessages = (value: unknown): GenAiMessage[] | null => {
  const decoded = decode(value);
  if (!Array.isArray(decoded) || decoded.length === 0) return null;
  return decoded.every(isConformingMessage) ? (decoded as GenAiMessage[]) : null;
};

/** Short placeholder for a non-text part, e.g. `[tool_call: get_weather]` or `[image]`. */
const partPlaceholder = (part: GenAiMessagePart): string | null => {
  switch (part.type) {
    case 'text':
      return null;
    case 'tool_call':
    case 'server_tool_call':
      return `[${part.type}${typeof part.name === 'string' ? `: ${part.name}` : ''}]`;
    case 'tool_call_response':
    case 'server_tool_call_response':
      return `[${part.type}]`;
    case 'blob':
    case 'uri':
    case 'file':
      return `[${typeof part.modality === 'string' ? part.modality : part.type}]`;
    case 'compaction':
      return null; // context-management marker, not user-visible content
    default:
      return `[${part.type}]`;
  }
};

/**
 * Preview one message: its text parts if any; otherwise placeholders for the other parts.
 * Reasoning is only shown when there is nothing else.
 */
export const previewMessage = (message: GenAiMessage): string => {
  const text = message.parts
    .filter((p) => p.type === 'text' && typeof p.content === 'string')
    .map((p) => p.content as string)
    .join('\n')
    .trim();
  if (text) return text;

  const placeholders = message.parts
    .filter((p) => p.type !== 'reasoning')
    .map(partPlaceholder)
    .filter((p): p is string => p !== null);
  if (placeholders.length) return placeholders.join(' ');

  return message.parts.some((p) => p.type === 'reasoning') ? '[reasoning]' : '';
};

/** Fallback for values that do not follow the schema (legacy `{role, content}`, plain text). */
const legacyPreview = (value: unknown, pick: 'lastUser' | 'all'): string => {
  const decoded = decode(value);
  if (typeof decoded === 'string') return decoded === '—' ? '' : decoded.trim();
  const list = Array.isArray(decoded) ? decoded : [decoded];
  const messages = list.filter(isObject);
  const candidates =
    pick === 'lastUser'
      ? messages.filter((m) => m.role === 'user').slice(-1)
      : messages.filter((m) => m.role !== 'system');
  const chosen = candidates.length ? candidates : messages.slice(-1);
  return chosen
    .map((m) => {
      if (typeof m.content === 'string') return m.content;
      if (Array.isArray(m.content)) {
        return m.content
          .map((c) => (isObject(c) && typeof c.text === 'string' ? c.text : ''))
          .join('');
      }
      return '';
    })
    .join('\n')
    .trim();
};

/** Input preview: the last `user` message (input messages carry the full chat history). */
export const previewInputMessages = (value: unknown): string => {
  if (value === null || value === undefined || value === '' || value === '—') return '';
  const messages = parseGenAiMessages(value);
  if (!messages) return legacyPreview(value, 'lastUser');
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  return previewMessage(lastUser ?? messages[messages.length - 1]);
};

/** Output preview: each output message is one generation (choice); join them. */
export const previewOutputMessages = (value: unknown): string => {
  if (value === null || value === undefined || value === '' || value === '—') return '';
  const messages = parseGenAiMessages(value);
  if (!messages) return legacyPreview(value, 'all');
  return messages.map(previewMessage).filter(Boolean).join('\n').trim();
};

/** A span attribute from nested (`attributes.a.b`), dotted-key or flattened documents. */
export const readAttribute = (doc: Record<string, unknown> | undefined, key: string): unknown => {
  if (!doc) return undefined;
  const attrs = doc.attributes;
  if (isObject(attrs)) {
    if (key in attrs) return attrs[key];
    let cur: unknown = attrs;
    for (const part of key.split('.')) {
      if (!isObject(cur)) return undefined;
      cur = cur[part];
    }
    if (cur !== undefined) return cur;
  }
  return doc[`attributes.${key}`];
};

/** Tool call arguments/results may be JSON strings or structured values. */
const previewToolValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'string') return value.trim();
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

interface SpanLike {
  input?: unknown;
  output?: unknown;
  rawDocument?: Record<string, unknown>;
}

/**
 * Input preview for any span row: message preview first, then (for `execute_tool` spans,
 * per semconv) `gen_ai.tool.call.arguments`.
 */
export const previewSpanInput = (row: SpanLike): string =>
  previewInputMessages(row.input) ||
  previewToolValue(readAttribute(row.rawDocument, 'gen_ai.tool.call.arguments'));

/** Output preview for any span row: message preview first, then `gen_ai.tool.call.result`. */
export const previewSpanOutput = (row: SpanLike): string =>
  previewOutputMessages(row.output) ||
  previewToolValue(readAttribute(row.rawDocument, 'gen_ai.tool.call.result'));
