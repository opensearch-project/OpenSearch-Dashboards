/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';
import { MessageSchema, StateSchema } from './types';

// Import and re-export core event types
import {
  EventType,
  BaseEvent,
  Event,
  RunStartedEvent,
  RunFinishedEvent,
  RunErrorEvent,
  MessagesSnapshotEvent,
  TextMessageStartEvent,
  TextMessageContentEvent,
  TextMessageEndEvent,
  TextMessageChunkEvent,
  ThinkingTextMessageStartEvent,
  ThinkingTextMessageContentEvent,
  ThinkingTextMessageEndEvent,
  ThinkingStartEvent,
  ThinkingEndEvent,
  ToolCallStartEvent,
  ToolCallArgsEvent,
  ToolCallEndEvent,
  ToolCallResultEvent,
  ToolCallChunkEvent,
  StateSnapshotEvent,
  StateDeltaEvent,
  StepStartedEvent,
  StepFinishedEvent,
  RawEvent,
  CustomEvent,
} from '../../../core/public';

// Re-export for backward compatibility
export {
  EventType,
  BaseEvent,
  Event,
  RunStartedEvent,
  RunFinishedEvent,
  RunErrorEvent,
  MessagesSnapshotEvent,
  TextMessageStartEvent,
  TextMessageContentEvent,
  TextMessageEndEvent,
  TextMessageChunkEvent,
  ThinkingTextMessageStartEvent,
  ThinkingTextMessageContentEvent,
  ThinkingTextMessageEndEvent,
  ThinkingStartEvent,
  ThinkingEndEvent,
  ToolCallStartEvent,
  ToolCallArgsEvent,
  ToolCallEndEvent,
  ToolCallResultEvent,
  ToolCallChunkEvent,
  StateSnapshotEvent,
  StateDeltaEvent,
  StepStartedEvent,
  StepFinishedEvent,
  RawEvent,
  CustomEvent,
};

// Text messages can have any role except "tool"
const TextMessageRoleSchema = z.union([
  z.literal('developer'),
  z.literal('system'),
  z.literal('assistant'),
  z.literal('user'),
]);

export const BaseEventSchema = z.object({
  type: z.nativeEnum(EventType),
  timestamp: z.number().optional(),
  rawEvent: z.any().optional(),
});

export const TextMessageStartEventSchema = BaseEventSchema.extend({
  type: z.literal(EventType.TEXT_MESSAGE_START),
  messageId: z.string(),
  role: TextMessageRoleSchema.default('assistant'),
});

export const TextMessageContentEventSchema = BaseEventSchema.extend({
  type: z.literal(EventType.TEXT_MESSAGE_CONTENT),
  messageId: z.string(),
  delta: z.string().refine((s) => s.length > 0, 'Delta must not be an empty string'),
});

export const TextMessageEndEventSchema = BaseEventSchema.extend({
  type: z.literal(EventType.TEXT_MESSAGE_END),
  messageId: z.string(),
});

export const TextMessageChunkEventSchema = BaseEventSchema.extend({
  type: z.literal(EventType.TEXT_MESSAGE_CHUNK),
  messageId: z.string().optional(),
  role: TextMessageRoleSchema.optional(),
  delta: z.string().optional(),
});

export const ThinkingTextMessageStartEventSchema = BaseEventSchema.extend({
  type: z.literal(EventType.THINKING_TEXT_MESSAGE_START),
});

export const ThinkingTextMessageContentEventSchema = TextMessageContentEventSchema.omit({
  messageId: true,
  type: true,
}).extend({
  type: z.literal(EventType.THINKING_TEXT_MESSAGE_CONTENT),
});

export const ThinkingTextMessageEndEventSchema = BaseEventSchema.extend({
  type: z.literal(EventType.THINKING_TEXT_MESSAGE_END),
});

export const ToolCallStartEventSchema = BaseEventSchema.extend({
  type: z.literal(EventType.TOOL_CALL_START),
  toolCallId: z.string(),
  toolCallName: z.string(),
  parentMessageId: z.string().optional(),
});

export const ToolCallArgsEventSchema = BaseEventSchema.extend({
  type: z.literal(EventType.TOOL_CALL_ARGS),
  toolCallId: z.string(),
  delta: z.string(),
});

export const ToolCallEndEventSchema = BaseEventSchema.extend({
  type: z.literal(EventType.TOOL_CALL_END),
  toolCallId: z.string(),
});

export const ToolCallResultEventSchema = BaseEventSchema.extend({
  messageId: z.string(),
  type: z.literal(EventType.TOOL_CALL_RESULT),
  toolCallId: z.string(),
  content: z.string(),
  role: z.literal('tool').optional(),
});

export const ToolCallChunkEventSchema = BaseEventSchema.extend({
  type: z.literal(EventType.TOOL_CALL_CHUNK),
  toolCallId: z.string().optional(),
  toolCallName: z.string().optional(),
  parentMessageId: z.string().optional(),
  delta: z.string().optional(),
});

export const ThinkingStartEventSchema = BaseEventSchema.extend({
  type: z.literal(EventType.THINKING_START),
  title: z.string().optional(),
});

export const ThinkingEndEventSchema = BaseEventSchema.extend({
  type: z.literal(EventType.THINKING_END),
});

export const StateSnapshotEventSchema = BaseEventSchema.extend({
  type: z.literal(EventType.STATE_SNAPSHOT),
  snapshot: StateSchema,
});

export const StateDeltaEventSchema = BaseEventSchema.extend({
  type: z.literal(EventType.STATE_DELTA),
  delta: z.array(z.any()), // JSON Patch (RFC 6902)
});

export const MessagesSnapshotEventSchema = BaseEventSchema.extend({
  type: z.literal(EventType.MESSAGES_SNAPSHOT),
  messages: z.array(MessageSchema),
});

export const RawEventSchema = BaseEventSchema.extend({
  type: z.literal(EventType.RAW),
  event: z.any(),
  source: z.string().optional(),
});

export const CustomEventSchema = BaseEventSchema.extend({
  type: z.literal(EventType.CUSTOM),
  name: z.string(),
  value: z.any(),
});

export const RunStartedEventSchema = BaseEventSchema.extend({
  type: z.literal(EventType.RUN_STARTED),
  threadId: z.string(),
  runId: z.string(),
});

export const RunFinishedEventSchema = BaseEventSchema.extend({
  type: z.literal(EventType.RUN_FINISHED),
  threadId: z.string(),
  runId: z.string(),
  result: z.any().optional(),
});

export const RunErrorEventSchema = BaseEventSchema.extend({
  type: z.literal(EventType.RUN_ERROR),
  message: z.string(),
  code: z.string().optional(),
});

export const StepStartedEventSchema = BaseEventSchema.extend({
  type: z.literal(EventType.STEP_STARTED),
  stepName: z.string(),
});

export const StepFinishedEventSchema = BaseEventSchema.extend({
  type: z.literal(EventType.STEP_FINISHED),
  stepName: z.string(),
});

export const EventSchemas = z.discriminatedUnion('type', [
  TextMessageStartEventSchema,
  TextMessageContentEventSchema,
  TextMessageEndEventSchema,
  TextMessageChunkEventSchema,
  ThinkingStartEventSchema,
  ThinkingEndEventSchema,
  ThinkingTextMessageStartEventSchema,
  ThinkingTextMessageContentEventSchema,
  ThinkingTextMessageEndEventSchema,
  ToolCallStartEventSchema,
  ToolCallArgsEventSchema,
  ToolCallEndEventSchema,
  ToolCallChunkEventSchema,
  ToolCallResultEventSchema,
  StateSnapshotEventSchema,
  StateDeltaEventSchema,
  MessagesSnapshotEventSchema,
  RawEventSchema,
  CustomEventSchema,
  RunStartedEventSchema,
  RunFinishedEventSchema,
  RunErrorEventSchema,
  StepStartedEventSchema,
  StepFinishedEventSchema,
]);

// Note: Event type interfaces are now imported from core and re-exported above.
// Zod schemas below are kept for runtime validation only.
