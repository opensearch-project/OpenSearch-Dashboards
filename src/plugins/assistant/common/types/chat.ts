/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  conversationId: string;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  contexts?: ContextReference[];
  toolCalls?: ToolCall[];
  streaming?: boolean;
  error?: string;
}

export interface ContextReference {
  type: string;
  id: string;
  name: string;
  data?: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  metadata?: ConversationMetadata;
}

export interface ConversationMetadata {
  contexts?: ContextReference[];
  tags?: string[];
  pinned?: boolean;
}

export interface ChatSession {
  id: string;
  conversationId: string;
  isActive: boolean;
  isStreaming: boolean;
  error?: string;
}

export interface StreamingEvent {
  type:
    | 'message_start'
    | 'content_block_delta'
    | 'content_block_stop'
    | 'message_delta'
    | 'message_stop'
    | 'error';
  data: unknown;
}

export interface ChatState {
  conversations: Record<string, Conversation>;
  activeConversationId: string | null;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
}
