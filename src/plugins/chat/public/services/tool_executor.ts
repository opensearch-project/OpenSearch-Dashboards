/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AssistantActionService } from '../../../context_provider/public';

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  source?: 'registered_action' | 'agent_tool';
  waitingForAgentResponse?: boolean;
}

interface PendingToolCall {
  id: string;
  name: string;
  args: any;
}

/**
 * Service to handle tool execution for both registered actions and agent-only tools
 */
export class ToolExecutor {
  private pendingAgentTools = new Map<string, PendingToolCall>();

  constructor(private assistantActionService: AssistantActionService) {}

  /**
   * Execute a tool by name and arguments
   * First checks registered actions, then agent-only tools
   */
  async executeTool(toolName: string, toolArgs: any): Promise<ToolResult> {
    try {
      // First, check if this is a registered assistant action
      const registeredAction = await this.tryExecuteRegisteredAction(toolName, toolArgs);
      if (registeredAction.handled) {
        return registeredAction.result;
      }

      // Otherwise, handle as agent-only tool
      return await this.executeAgentTool(toolName, toolArgs);
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        data: null,
      };
    }
  }

  /**
   * Try to execute a tool as a registered action
   */
  private async tryExecuteRegisteredAction(
    toolName: string,
    toolArgs: any
  ): Promise<{ handled: boolean; result?: ToolResult }> {
    try {
      // Use the assistantActionService to execute the action
      const result = await this.assistantActionService.executeAction(toolName, toolArgs);

      return {
        handled: true,
        result: {
          success: true,
          data: result,
          source: 'registered_action',
        },
      };
    } catch (error: any) {
      // If the action is not found or fails, it's not a registered action
      if (error.message?.includes('not found') || error.message?.includes('not registered')) {
        return { handled: false };
      }

      // If it's a registered action but failed for another reason, return the error
      return {
        handled: true,
        result: {
          success: false,
          error: error.message,
          source: 'registered_action',
        },
      };
    }
  }

  /**
   * Execute agent-only tools that report results back via AG-UI events
   */
  private async executeAgentTool(_toolName: string, _toolArgs: any): Promise<ToolResult> {
    // Any tool that reaches here is assumed to be handled by the agent
    // The agent will send the results back via TOOL_CALL_RESULT events
    return {
      success: true,
      data: { acknowledged: true },
      source: 'agent_tool',
      // Signal that we're waiting for agent to process and send results
      waitingForAgentResponse: true,
    };
  }

  /**
   * Mark a tool as pending (waiting for agent response)
   */
  markToolPending(toolCallId: string, toolCall: PendingToolCall): void {
    this.pendingAgentTools.set(toolCallId, toolCall);
  }

  /**
   * Check if a tool is pending agent response
   */
  isPendingAgentResponse(toolCallId: string): boolean {
    return this.pendingAgentTools.has(toolCallId);
  }

  /**
   * Get pending tool information
   */
  getPendingTool(toolCallId: string): PendingToolCall | undefined {
    return this.pendingAgentTools.get(toolCallId);
  }

  /**
   * Clear pending tool
   */
  clearPendingTool(toolCallId: string): void {
    this.pendingAgentTools.delete(toolCallId);
  }

  /**
   * Clear all pending tools
   */
  clearAllPendingTools(): void {
    this.pendingAgentTools.clear();
  }
}
