/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

// Import interface types from core - these define the structure
export type {
  ToolCall,
  FunctionCall,
  Message,
  DeveloperMessage,
  SystemMessage,
  AssistantMessage,
  UserMessage,
  ToolMessage,
  Role,
} from '../../../core/public/chat';

// Zod schemas for runtime validation - these ensure the core types are followed
export const FunctionCallSchema = z.object({
  name: z.string(),
  arguments: z.string(),
});

export const ToolCallSchema = z.object({
  id: z.string(),
  type: z.literal('function'),
  function: FunctionCallSchema,
});

// AG-UI Protocol: Input content schemas for multimodal content (text + images)
export const TextInputContentSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});

export const BinaryInputContentSchema = z.object({
  type: z.literal('binary'),
  mimeType: z.string(),
  id: z.string().optional(),
  url: z.string().optional(),
  data: z.string().optional(),
  filename: z.string().optional(),
});

export const InputContentSchema = z.union([TextInputContentSchema, BinaryInputContentSchema]);

export const BaseMessageSchema = z.object({
  id: z.string(),
  role: z.string(),
  content: z.string().optional(),
  name: z.string().optional(),
});

export const DeveloperMessageSchema = BaseMessageSchema.extend({
  role: z.literal('developer'),
  content: z.string(),
});

export const SystemMessageSchema = BaseMessageSchema.extend({
  role: z.literal('system'),
  content: z.string(),
});

export const AssistantMessageSchema = BaseMessageSchema.extend({
  role: z.literal('assistant'),
  content: z.string().optional(),
  toolCalls: z.array(ToolCallSchema).optional(),
});

export const UserMessageSchema = BaseMessageSchema.extend({
  role: z.literal('user'),
  content: z.union([z.string(), z.array(InputContentSchema)]),
});

export const ToolMessageSchema = z.object({
  id: z.string(),
  content: z.string(),
  role: z.literal('tool'),
  toolCallId: z.string(),
  error: z.string().optional(),
});

export const MessageSchema = z.discriminatedUnion('role', [
  DeveloperMessageSchema,
  SystemMessageSchema,
  AssistantMessageSchema,
  UserMessageSchema,
  ToolMessageSchema,
]);

export const RoleSchema = z.union([
  z.literal('developer'),
  z.literal('system'),
  z.literal('assistant'),
  z.literal('user'),
  z.literal('tool'),
]);

export const ContextSchema = z.object({
  description: z.string(),
  value: z.string(),
});

export const ToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.any(), // JSON Schema for the tool parameters
});

export const RunAgentInputSchema = z.object({
  threadId: z.string(),
  runId: z.string(),
  state: z.any(),
  messages: z.array(MessageSchema),
  tools: z.array(ToolSchema),
  context: z.array(ContextSchema),
  forwardedProps: z.any(),
});

export const StateSchema = z.any();

// Business logic types - stay in plugin
export type Context = z.infer<typeof ContextSchema>;
export type Tool = z.infer<typeof ToolSchema>;
export type RunAgentInput = z.infer<typeof RunAgentInputSchema>;
export type State = z.infer<typeof StateSchema>;

export class AGUIError extends Error {
  constructor(message: string) {
    super(message);
  }
}
