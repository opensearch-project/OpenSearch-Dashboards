/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MCPServerConfig } from '../types/mcp_types';

export interface StreamingCallbacks {
  onTextStart?: (text: string) => void;
  onTextDelta?: (delta: string) => void;
  onToolUseStart?: (toolName: string, toolUseId: string, input: any) => void;
  onToolResult?: (toolName: string, toolUseId: string, result: any) => void;
  onToolError?: (toolName: string, toolUseId: string, error: string) => void;
  onTurnComplete?: () => void;
  onError?: (error: string) => void;
}

export interface BaseAgent {
  /**
   * Initialize the agent with MCP server configurations
   */
  initialize(configs: Record<string, MCPServerConfig>, customSystemPrompt?: string): Promise<void>;

  /**
   * Process messages with streaming callbacks
   * @param messages Full conversation history from UI
   * @param callbacks Streaming callbacks for real-time updates
   * @param additionalInputs Optional client state and context
   */
  processMessageWithCallbacks(
    messages: any[], // Changed from string to array - full conversation history
    callbacks: StreamingCallbacks,
    additionalInputs?: {
      state?: any;
      context?: any[];
      tools?: any[];
      threadId?: string;
      runId?: string;
      requestId?: string;
      modelId?: string;
    }
  ): Promise<void>;

  /**
   * Send a message and process response (for CLI mode)
   */
  sendMessage(message: string): Promise<void>;

  /**
   * Get all available tools from connected MCP servers
   */
  getAllTools(): any[];

  /**
   * Get the agent type identifier
   */
  getAgentType(): string;

  /**
   * Start interactive CLI mode
   */
  startInteractiveMode(): Promise<void>;

  /**
   * Clean up connections and resources
   */
  cleanup(): void;
}
