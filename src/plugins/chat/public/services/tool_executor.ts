/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AssistantActionService } from '../../../context_provider/public';
import { ConfirmationService } from './confirmation_service';

export interface ToolResult {
  success?: boolean;
  data?: any;
  error?: string;
  source?: 'registered_action' | 'agent_tool';
  waitingForAgentResponse?: boolean;
  userRejected?: boolean;
  cancelled?: boolean;
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
  private confirmationService: ConfirmationService;

  constructor(
    private assistantActionService: AssistantActionService,
    confirmationService: ConfirmationService
  ) {
    this.confirmationService = confirmationService;
  }

  /**
   * Execute a tool by name and arguments
   * First checks registered actions, then agent-only tools
   * Supports user confirmation for tools that require it
   */
  async executeTool(
    toolName: string,
    toolArgs: any,
    toolCallId: string,
    datasourceId?: string
  ): Promise<ToolResult> {
    try {
      // Check if this tool requires confirmation
      const requiresConfirmation = this.assistantActionService.isUserConfirmRequired(toolName);

      if (requiresConfirmation && this.confirmationService && toolCallId) {
        // Request user confirmation
        const response = await this.confirmationService.requestConfirmation(
          toolName,
          toolCallId,
          toolArgs
        );

        // Check if confirmation was cancelled (e.g., due to cleanup)
        if (response.cancelled) {
          return {
            success: false,
            cancelled: true,
          };
        }

        if (!response.approved) {
          return {
            success: false,
            error: 'User rejected the tool execution',
            userRejected: true,
            data: {
              message: 'The user chose not to proceed with this action.',
              toolName,
              args: toolArgs,
            },
          };
        }

        toolArgs = { ...toolArgs, confirmed: true };
      }

      // Include datasourceId in toolArgs if provided
      const enrichedToolArgs = datasourceId ? { ...toolArgs, datasourceId } : toolArgs;

      // First, check if this is a registered assistant action
      const registeredAction = await this.tryExecuteRegisteredAction(toolName, enrichedToolArgs);
      if (registeredAction.handled && registeredAction.result) {
        return registeredAction.result;
      }

      // Otherwise, handle as agent-only tool
      return await this.executeAgentTool(toolName, enrichedToolArgs);
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
