/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable } from 'rxjs';

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
  content?: string;
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
  content: string;
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
 * Chat service interface - provides basic chat functionality
 * without UI dependencies to avoid circular dependencies
 */
export interface ChatServiceInterface {
  /**
   * Check if chat window is currently open
   */
  isWindowOpen(): boolean;

  /**
   * Get the current thread ID as observable
   */
  getThreadId$(): Observable<string>;

  /**
   * Get the current thread ID
   */
  getThreadId(): string;

  /**
   * Open the chat window
   */
  openWindow(): Promise<void>;

  /**
   * Close the chat window
   */
  closeWindow(): Promise<void>;

  /**
   * Send a message through the chat service
   * @param message The message text to send
   * @param history Optional message history for context
   * @param options Optional configuration for the message
   */
  sendMessage(
    content: string,
    messages: Message[]
  ): Promise<{ observable: any; userMessage: UserMessage }>;

  /**
   * Send a message and ensure window is open
   * This is the primary method used by plugins
   */
  sendMessageWithWindow(
    content: string,
    messages: Message[],
    options?: { clearConversation?: boolean }
  ): Promise<{ observable: any; userMessage: UserMessage }>;

  /**
   * Get current window state
   */
  getWindowState(): ChatWindowState;

  /**
   * Get window state observable
   */
  getWindowState$(): Observable<ChatWindowState>;

  /**
   * Register a callback for when window opens
   */
  onWindowOpen(callback: () => void): () => void;

  /**
   * Register a callback for when window closes
   */
  onWindowClose(callback: () => void): () => void;
}

/**
 * Implementation functions provided by the chat plugin
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

  // Thread management
  getThreadId: () => string;
  getThreadId$: () => Observable<string>;

  // Window management
  isWindowOpen: () => boolean;
  openWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  getWindowState: () => ChatWindowState;
  getWindowState$: () => Observable<ChatWindowState>;
  onWindowOpen: (callback: () => void) => () => void;
  onWindowClose: (callback: () => void) => () => void;
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
   * Set the fallback implementation for when chat service is unavailable
   * This allows the chat plugin to control "unavailable" behavior
   * This will be called by the chat plugin
   */
  setFallbackImplementation(fallback: ChatImplementationFunctions): void;

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
   * Whether chat service is available
   */
  isAvailable(): boolean;

  /**
   * Suggested actions service for registering providers
   * Available at runtime after chat plugin has registered it
   */
  suggestedActionsService?: {
    registerProvider(provider: any): void;
  };
}
