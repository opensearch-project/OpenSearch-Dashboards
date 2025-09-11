/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AgentRequest {
  message: string;
  conversationId?: string;
  contexts?: AgentContext[];
  tools?: AgentTool[];
  stream?: boolean;
  sessionId?: string;
}

export interface AgentResponse {
  id: string;
  message: string;
  conversationId: string;
  toolCalls?: AgentToolCall[];
  contexts?: AgentContext[];
  metadata?: AgentResponseMetadata;
}

export interface AgentContext {
  type: string;
  name: string;
  data: Record<string, unknown>;
  priority?: number;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: AgentToolParameters;
}

export interface AgentToolParameters {
  type: 'object';
  properties: Record<string, AgentToolProperty>;
  required?: string[];
}

export interface AgentToolProperty {
  type: string;
  description?: string;
  enum?: unknown[];
  items?: AgentToolProperty;
  properties?: Record<string, AgentToolProperty>;
}

export interface AgentToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface AgentResponseMetadata {
  model?: string;
  usage?: AgentUsage;
  processingTime?: number;
}

export interface AgentUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface StreamingResponse {
  event: string;
  data: string;
  id?: string;
  retry?: number;
}

export interface AgentStreamEvent {
  type:
    | 'message_start'
    | 'content_block_delta'
    | 'content_block_stop'
    | 'message_delta'
    | 'message_stop'
    | 'error'
    | 'tool_call_start'
    | 'tool_call_delta'
    | 'tool_call_stop';
  index?: number;
  delta?: AgentStreamDelta;
  message?: Partial<AgentResponse>;
  error?: AgentError;
}

export interface AgentStreamDelta {
  text?: string;
  type?: string;
  toolCall?: Partial<AgentToolCall>;
}

export interface AgentError {
  type:
    | 'authentication_error'
    | 'permission_error'
    | 'not_found_error'
    | 'rate_limit_error'
    | 'api_error'
    | 'overloaded_error'
    | 'invalid_request_error';
  message: string;
  details?: Record<string, unknown>;
}

export interface AgentClient {
  chat(request: AgentRequest): Promise<AgentResponse>;
  chatStream(request: AgentRequest): AsyncGenerator<AgentStreamEvent, void, unknown>;
  isHealthy(): Promise<boolean>;
}

export type AgentType = 'jarvis' | 'langgraph';

export interface AgentCapabilities {
  streaming: boolean;
  tools: string[];
  contexts: string[];
  maxTokens: number;
}
