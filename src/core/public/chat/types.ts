/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable } from 'rxjs';

interface TextInputContent {
  type: 'text';
  text: string;
}

interface BinaryInputContent {
  type: 'binary';
  mimeType: string;
  id?: string;
  url?: string;
  data?: string;
  filename?: string;
}

type InputContent = TextInputContent | BinaryInputContent;

/**
 * Function call interface
 */
export interface FunctionCall {
  name: string;
  arguments: string;
}

/**
 * Tool call interface for ML interactions
 */
export interface ToolCall {
  id: string;
  type: 'function';
  function: FunctionCall;
}

/**
 * Base message interface
 */
export interface BaseMessage {
  id: string;
  role: string;
  content?: string | InputContent[];
  name?: string;
}

/**
 * Developer message type
 */
export interface DeveloperMessage extends BaseMessage {
  role: 'developer';
  content: string;
}

/**
 * System message type
 */
export interface SystemMessage extends BaseMessage {
  role: 'system';
  content: string;
}

/**
 * Assistant message type with optional tool calls
 */
export interface AssistantMessage extends BaseMessage {
  role: 'assistant';
  content?: string;
  toolCalls?: ToolCall[];
}

/**
 * User message type
 */
export interface UserMessage extends BaseMessage {
  role: 'user';
  content: string | InputContent[]; // Message sent to LLM (raw message or processed for slash commands)
  rawMessage?: string; // Original message typed by user (always shown in UI)
}

/**
 * Tool message type for tool execution results
 */
export interface ToolMessage {
  id: string;
  content: string;
  role: 'tool';
  toolCallId: string;
  error?: string;
}

/**
 * Discriminated union of all message types
 */
export type Message =
  | DeveloperMessage
  | SystemMessage
  | AssistantMessage
  | UserMessage
  | ToolMessage;

/**
 * Valid message role types
 */
export type Role = 'developer' | 'system' | 'assistant' | 'user' | 'tool';

/**
 * Chat window state
 */
export interface ChatWindowState {
  isWindowOpen: boolean;
  windowMode: 'sidecar' | 'fullscreen';
  paddingSize: number;
}

/**
 * Chat service interface - state managed by core, operations delegated to plugin
 */
export interface ChatServiceInterface {
  /**
   * Check if chat service is available
   */
  isAvailable(): boolean;

  /**
   * Thread management - managed by core
   */
  getThreadId$(): Observable<string>;
  getThreadId(): string;
  setThreadId(threadId: string): void;
  newThread(): void;

  /**
   * Window state management - managed by core
   */
  isWindowOpen(): boolean;
  getWindowState(): ChatWindowState;
  getWindowState$(): Observable<ChatWindowState>;
  setWindowState(state: Partial<ChatWindowState>): void;
  onWindowOpen(callback: () => void): () => void;
  onWindowClose(callback: () => void): () => void;

  /**
   * Operations - delegated to plugin (throws error if unavailable)
   */
  openWindow(): Promise<void>;
  closeWindow(): Promise<void>;
  sendMessage(
    content: string,
    messages: Message[]
  ): Promise<{ observable: any; userMessage: UserMessage }>;
  sendMessageWithWindow(
    content: string,
    messages: Message[],
    options?: { clearConversation?: boolean }
  ): Promise<{ observable: any; userMessage: UserMessage }>;
}

/**
 * Implementation functions provided by the chat plugin - simplified to business logic only
 */
export interface ChatImplementationFunctions {
  // Message operations
  sendMessage: (
    content: string,
    messages: Message[]
  ) => Promise<{ observable: any; userMessage: UserMessage }>;

  sendMessageWithWindow: (
    content: string,
    messages: Message[],
    options?: { clearConversation?: boolean }
  ) => Promise<{ observable: any; userMessage: UserMessage }>;

  // Window operations
  openWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
}

/**
 * Chat service setup interface
 */
export interface ChatServiceSetup {
  /**
   * Set the implementation functions for chat messaging
   * This will be called by the chat plugin
   */
  setImplementation(implementation: ChatImplementationFunctions): void;

  /**
   * Set the suggested actions service
   * This will be called by the chat plugin
   */
  setSuggestedActionsService(service: { registerProvider(provider: any): void }): void;

  /**
   * Suggested actions service for registering providers
   * This will be set by the chat plugin and accessed by other plugins
   */
  suggestedActionsService?: {
    registerProvider(provider: any): void;
  };
}

/**
 * Chat service start interface
 */
export interface ChatServiceStart extends ChatServiceInterface {
  /**
   * Suggested actions service for registering providers
   * Available at runtime after chat plugin has registered it
   */
  suggestedActionsService?: {
    registerProvider(provider: any): void;
  };
}
