/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Message } from './types';

/**
 * AG-UI Event Types
 * These follow the AG-UI event protocol for conversation management and streaming
 */
export enum EventType {
  TEXT_MESSAGE_START = 'TEXT_MESSAGE_START',
  TEXT_MESSAGE_CONTENT = 'TEXT_MESSAGE_CONTENT',
  TEXT_MESSAGE_END = 'TEXT_MESSAGE_END',
  TEXT_MESSAGE_CHUNK = 'TEXT_MESSAGE_CHUNK',
  THINKING_TEXT_MESSAGE_START = 'THINKING_TEXT_MESSAGE_START',
  THINKING_TEXT_MESSAGE_CONTENT = 'THINKING_TEXT_MESSAGE_CONTENT',
  THINKING_TEXT_MESSAGE_END = 'THINKING_TEXT_MESSAGE_END',
  TOOL_CALL_START = 'TOOL_CALL_START',
  TOOL_CALL_ARGS = 'TOOL_CALL_ARGS',
  TOOL_CALL_END = 'TOOL_CALL_END',
  TOOL_CALL_CHUNK = 'TOOL_CALL_CHUNK',
  TOOL_CALL_RESULT = 'TOOL_CALL_RESULT',
  THINKING_START = 'THINKING_START',
  THINKING_END = 'THINKING_END',
  STATE_SNAPSHOT = 'STATE_SNAPSHOT',
  STATE_DELTA = 'STATE_DELTA',
  MESSAGES_SNAPSHOT = 'MESSAGES_SNAPSHOT',
  RAW = 'RAW',
  CUSTOM = 'CUSTOM',
  RUN_STARTED = 'RUN_STARTED',
  RUN_FINISHED = 'RUN_FINISHED',
  RUN_ERROR = 'RUN_ERROR',
  STEP_STARTED = 'STEP_STARTED',
  STEP_FINISHED = 'STEP_FINISHED',
}

/**
 * Base event interface
 */
export interface BaseEvent {
  type: EventType;
  timestamp?: number;
  rawEvent?: unknown;
}

/**
 * Run Started Event
 * Signals the start of an AG-UI conversation run
 */
export interface RunStartedEvent extends BaseEvent {
  type: EventType.RUN_STARTED;
  threadId: string;
  runId: string;
}

/**
 * Run Finished Event
 * Signals the completion of an AG-UI conversation run
 */
export interface RunFinishedEvent extends BaseEvent {
  type: EventType.RUN_FINISHED;
  threadId: string;
  runId: string;
  result?: unknown;
}

/**
 * Run Error Event
 * Signals an error during an AG-UI conversation run
 */
export interface RunErrorEvent extends BaseEvent {
  type: EventType.RUN_ERROR;
  message: string;
  code?: string;
}

/**
 * Messages Snapshot Event
 * Used to restore conversation state from saved messages
 */
export interface MessagesSnapshotEvent extends BaseEvent {
  type: EventType.MESSAGES_SNAPSHOT;
  messages: Message[];
}

/**
 * Text Message Start Event
 */
export interface TextMessageStartEvent extends BaseEvent {
  type: EventType.TEXT_MESSAGE_START;
  messageId: string;
  role: 'developer' | 'system' | 'assistant' | 'user';
}

/**
 * Text Message Content Event
 */
export interface TextMessageContentEvent extends BaseEvent {
  type: EventType.TEXT_MESSAGE_CONTENT;
  messageId: string;
  delta: string;
}

/**
 * Text Message End Event
 */
export interface TextMessageEndEvent extends BaseEvent {
  type: EventType.TEXT_MESSAGE_END;
  messageId: string;
}

/**
 * Tool Call Start Event
 */
export interface ToolCallStartEvent extends BaseEvent {
  type: EventType.TOOL_CALL_START;
  toolCallId: string;
  toolCallName: string;
  parentMessageId?: string;
}

/**
 * Tool Call Args Event
 */
export interface ToolCallArgsEvent extends BaseEvent {
  type: EventType.TOOL_CALL_ARGS;
  toolCallId: string;
  delta: string;
}

/**
 * Tool Call End Event
 */
export interface ToolCallEndEvent extends BaseEvent {
  type: EventType.TOOL_CALL_END;
  toolCallId: string;
}

/**
 * Tool Call Result Event
 */
export interface ToolCallResultEvent extends BaseEvent {
  type: EventType.TOOL_CALL_RESULT;
  messageId: string;
  toolCallId: string;
  content: string;
  role?: 'tool';
}

/**
 * Text Message Chunk Event (plugin-specific, for streaming)
 */
export interface TextMessageChunkEvent extends BaseEvent {
  type: EventType.TEXT_MESSAGE_CHUNK;
  messageId: string;
  delta: string;
}

/**
 * Tool Call Chunk Event (plugin-specific, for streaming)
 */
export interface ToolCallChunkEvent extends BaseEvent {
  type: EventType.TOOL_CALL_CHUNK;
  toolCallId: string;
  delta: string;
}

/**
 * Thinking Text Message Start Event (plugin-specific)
 */
export interface ThinkingTextMessageStartEvent extends BaseEvent {
  type: EventType.THINKING_TEXT_MESSAGE_START;
  messageId: string;
}

/**
 * Thinking Text Message Content Event (plugin-specific)
 */
export interface ThinkingTextMessageContentEvent extends BaseEvent {
  type: EventType.THINKING_TEXT_MESSAGE_CONTENT;
  messageId: string;
  delta: string;
}

/**
 * Thinking Text Message End Event (plugin-specific)
 */
export interface ThinkingTextMessageEndEvent extends BaseEvent {
  type: EventType.THINKING_TEXT_MESSAGE_END;
  messageId: string;
}

/**
 * Thinking Start Event (plugin-specific)
 */
export interface ThinkingStartEvent extends BaseEvent {
  type: EventType.THINKING_START;
  messageId?: string;
}

/**
 * Thinking End Event (plugin-specific)
 */
export interface ThinkingEndEvent extends BaseEvent {
  type: EventType.THINKING_END;
  messageId?: string;
}

/**
 * State Snapshot Event (plugin-specific)
 */
export interface StateSnapshotEvent extends BaseEvent {
  type: EventType.STATE_SNAPSHOT;
  state: unknown;
}

/**
 * State Delta Event (plugin-specific)
 */
export interface StateDeltaEvent extends BaseEvent {
  type: EventType.STATE_DELTA;
  delta: unknown;
}

/**
 * Step Started Event (plugin-specific)
 */
export interface StepStartedEvent extends BaseEvent {
  type: EventType.STEP_STARTED;
  stepId: string;
}

/**
 * Step Finished Event (plugin-specific)
 */
export interface StepFinishedEvent extends BaseEvent {
  type: EventType.STEP_FINISHED;
  stepId: string;
}

/**
 * Raw Event (for extensibility)
 */
export interface RawEvent extends BaseEvent {
  type: EventType.RAW;
  data: unknown;
}

/**
 * Custom Event (for extensibility)
 */
export interface CustomEvent extends BaseEvent {
  type: EventType.CUSTOM;
  name: string;
  data: unknown;
}

/**
 * Union type of all AG-UI events
 */
export type Event =
  | RunStartedEvent
  | RunFinishedEvent
  | RunErrorEvent
  | MessagesSnapshotEvent
  | TextMessageStartEvent
  | TextMessageContentEvent
  | TextMessageEndEvent
  | TextMessageChunkEvent
  | ThinkingTextMessageStartEvent
  | ThinkingTextMessageContentEvent
  | ThinkingTextMessageEndEvent
  | ThinkingStartEvent
  | ThinkingEndEvent
  | ToolCallStartEvent
  | ToolCallArgsEvent
  | ToolCallEndEvent
  | ToolCallResultEvent
  | ToolCallChunkEvent
  | StateSnapshotEvent
  | StateDeltaEvent
  | StepStartedEvent
  | StepFinishedEvent
  | RawEvent
  | CustomEvent;
