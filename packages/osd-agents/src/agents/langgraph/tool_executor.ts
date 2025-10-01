/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from '../../utils/logger';
import { BaseMCPClient } from '../../mcp';
import { StreamingCallbacks } from '../base_agent';
import { truncateToolResult } from '../../utils/truncate_tool_result';
import { getPrometheusMetricsEmitter } from '../../utils/metrics_emitter';
import { LLMRequestLogger } from '../../utils/llm_request_logger';

export class ToolExecutor {
  private logger: Logger;
  private llmLogger: LLMRequestLogger;
  private mcpClients: Record<string, BaseMCPClient>;

  constructor(
    logger: Logger,
    mcpClients: Record<string, BaseMCPClient>,
    llmLogger: LLMRequestLogger
  ) {
    this.logger = logger;
    this.mcpClients = mcpClients;
    this.llmLogger = llmLogger;
  }

  /**
   * Get all available tools from MCP clients
   */
  getAllTools(includeClientTools: boolean = false, clientTools?: any[]): any[] {
    // Get all tools from all MCP clients and format for Bedrock
    const allTools: any[] = [];

    // Add MCP server tools
    for (const [serverName, client] of Object.entries(this.mcpClients)) {
      const serverTools = client.getTools();

      for (const tool of serverTools) {
        // Format tool for Bedrock API (matching Jarvis format)
        allTools.push({
          toolSpec: {
            name: `${serverName}__${tool.name}`,
            description: tool.description || `Tool: ${tool.name}`,
            inputSchema: {
              json: tool.inputSchema,
            },
          },
          isClientTool: false, // Mark as MCP tool
        });
      }
    }

    // Add client tools if requested (for dual tool system)
    if (includeClientTools && clientTools) {
      for (const tool of clientTools) {
        allTools.push({
          toolSpec: {
            name: `ag_ui__${tool.name}`, // Prefix with ag_ui to distinguish
            description: tool.description || `Client tool: ${tool.name}`,
            inputSchema: {
              json: tool.parameters || {},
            },
          },
          isClientTool: true, // Mark as client tool
        });
      }
    }

    return allTools;
  }

  /**
   * Prepare tool configuration for Bedrock
   */
  prepareToolConfig(tools: any[]): any {
    // Prepare tool configuration for Bedrock (same as Jarvis)
    if (tools.length === 0) return undefined;

    return {
      tools: tools.map((tool) => ({
        toolSpec: tool.toolSpec,
      })),
    };
  }

  /**
   * Parse tool calls from XML format (fallback for when Bedrock doesn't recognize tools)
   */
  parseToolCallsFromXML(content: string): any[] {
    const toolCalls: any[] = [];

    try {
      // Extract the function_calls block
      const functionCallsMatch = content.match(/<function_calls>([\s\S]*?)<\/function_calls>/);
      if (!functionCallsMatch) return toolCalls;

      const functionCallsXML = functionCallsMatch[1];

      // Find all invoke blocks
      const invokeMatches = functionCallsXML.matchAll(
        /<invoke name="([^"]+)">([\s\S]*?)<\/invoke>/g
      );

      for (const match of invokeMatches) {
        const toolName = match[1];
        const paramsXML = match[2];

        // Parse parameters
        const params: Record<string, any> = {};
        const paramMatches = paramsXML.matchAll(/<parameter name="([^"]+)">([^<]*)<\/parameter>/g);

        for (const paramMatch of paramMatches) {
          const paramName = paramMatch[1];
          const paramValue = paramMatch[2];
          params[paramName] = paramValue;
        }

        // Generate a unique tool use ID
        const toolUseId = `tooluse_${Math.random().toString(36).substring(2, 15)}`;

        toolCalls.push({
          toolName,
          toolUseId,
          input: params,
        });

        this.logger.info('Parsed tool call from XML', {
          toolName,
          toolUseId,
          input: params,
        });
      }
    } catch (error) {
      this.logger.error('Failed to parse tool calls from XML', {
        error: error instanceof Error ? error.message : String(error),
        content: content.substring(0, 500),
      });
    }

    return toolCalls;
  }

  /**
   * Execute tool calls and return results with proper message formatting
   */
  async executeToolCalls(
    toolCalls: any[],
    messages: any[],
    streamingCallbacks?: StreamingCallbacks,
    clientContext?: {
      state?: any;
      context?: any[];
      threadId?: string;
      runId?: string;
    }
  ): Promise<{
    toolResults: Record<string, any>;
    toolResultMessage?: any;
    shouldContinue: boolean;
    isClientTools: boolean;
  }> {
    const toolResults: Record<string, any> = {};

    this.logger.info('Executing tools', {
      toolCallsCount: toolCalls.length,
      toolNames: toolCalls.map((tc) => tc.toolName),
      toolIds: toolCalls.map((tc) => tc.toolUseId),
    });

    // Check if we've already executed these exact tool calls to prevent duplicates
    const toolCallSignatures = toolCalls.map((tc) => tc.toolUseId);

    // Look for tool results in user messages (these indicate executed tools)
    const previouslyExecutedToolIds = messages
      .filter((m) => m.role === 'user')
      .flatMap((m) => (Array.isArray(m.content) ? m.content : []))
      .filter((c: any) => c.toolResult)
      .map((c: any) => c.toolResult.toolUseId);

    const newToolCalls = toolCalls.filter(
      (tc) => !previouslyExecutedToolIds.includes(tc.toolUseId)
    );

    if (newToolCalls.length === 0 && toolCalls.length > 0) {
      this.logger.warn('All tool calls have already been executed, skipping redundant execution', {
        attemptedToolCallIds: toolCallSignatures,
        previouslyExecutedToolIds,
      });

      // Emit Prometheus metric for redundant tool call attempts
      const metricsEmitter = getPrometheusMetricsEmitter();
      metricsEmitter.emitCounter('react_agent_redundant_tool_calls_total', toolCalls.length, {
        agent_type: 'react',
      });

      return {
        toolResults: {},
        shouldContinue: false,
        isClientTools: false,
      };
    }

    // Separate client tools from MCP tools
    const clientToolCalls = newToolCalls.filter((tc) => tc.toolName.startsWith('ag_ui__'));
    const mcpToolCalls = newToolCalls.filter((tc) => !tc.toolName.startsWith('ag_ui__'));

    // Handle AG UI tools (client-executed)
    if (clientToolCalls.length > 0) {
      this.logger.info('Client tools detected - emitting events for client execution', {
        clientToolCount: clientToolCalls.length,
        clientTools: clientToolCalls.map((tc) => tc.toolName),
      });

      // Emit events for client tools but don't wait for results
      for (const toolCall of clientToolCalls) {
        const { toolName, toolUseId, input } = toolCall;
        streamingCallbacks?.onToolUseStart?.(toolName, toolUseId, input);

        // The adapter will handle emitting the proper AG UI events
        // We just need to signal that these are client tools
      }

      // For client tools, we need to return an empty tool result message
      // This signals the completion of this request, client will send results in next request
      return {
        toolResults: {},
        shouldContinue: false, // Stop here for client execution
        isClientTools: true,
      };
    }

    // Execute MCP tools (server-executed)
    for (const toolCall of mcpToolCalls) {
      const { toolName, toolUseId, input } = toolCall;

      this.logger.info('MCP tool execution started', {
        toolName,
        toolUseId,
        input,
      });

      streamingCallbacks?.onToolUseStart?.(toolName, toolUseId, input);

      try {
        // Pass client context along with tool execution
        const enhancedInput = {
          ...input,
          _clientContext: {
            state: clientContext?.state,
            context: clientContext?.context,
            threadId: clientContext?.threadId,
            runId: clientContext?.runId,
          },
        };

        // Track tool execution start time
        const toolStartTime = Date.now();
        const result = await this.executeToolCall(toolName, enhancedInput);
        const toolDuration = Date.now() - toolStartTime;

        toolResults[toolUseId] = result;

        this.logger.info('Tool execution completed', {
          toolName,
          toolUseId,
          resultType: typeof result,
          resultKeys: result && typeof result === 'object' ? Object.keys(result) : [],
          resultLength: typeof result === 'string' ? result.length : undefined,
        });

        // Log tool execution to LLM logger
        this.llmLogger.logToolExecution(
          toolName,
          input,
          result,
          toolDuration,
          true // success
        );

        streamingCallbacks?.onToolResult?.(toolName, toolUseId, result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        this.logger.error('Tool execution failed', {
          toolName,
          toolUseId,
          error: errorMessage,
          input,
        });

        streamingCallbacks?.onToolError?.(toolName, toolUseId, errorMessage);
        toolResults[toolUseId] = { error: errorMessage };
      }
    }

    this.logger.info('All tools executed', {
      toolResultsCount: Object.keys(toolResults).length,
      successfulTools: Object.entries(toolResults).filter(([, result]) => !result.error).length,
      failedTools: Object.entries(toolResults).filter(([, result]) => result.error).length,
    });

    // Create user message with tool result blocks for all executed tools
    // CRITICAL: Ensure content array is not empty
    const toolResultContent = newToolCalls
      .filter((tc) => !tc.toolName.startsWith('ag_ui__')) // Only MCP tools
      .map((tc) => {
        // Truncate tool result to prevent API input size errors
        const truncatedResult = truncateToolResult(
          toolResults[tc.toolUseId] || { error: 'No result found' }
        );
        return {
          toolResult: {
            toolUseId: tc.toolUseId,
            content: [{ text: truncatedResult }],
          },
        };
      });

    // Only create the message if we have tool results
    if (toolResultContent.length === 0) {
      this.logger.warn('No tool results to send back to model');
      return {
        toolResults: {},
        shouldContinue: false,
        isClientTools: false,
      };
    }

    const toolResultMessage = {
      role: 'user' as const,
      content: toolResultContent,
    };

    return {
      toolResults,
      toolResultMessage,
      shouldContinue: true,
      isClientTools: false,
    };
  }

  /**
   * Execute a single tool call
   */
  private async executeToolCall(toolName: string, input: any): Promise<any> {
    // Check if this is a client tool (should not reach here)
    if (toolName.startsWith('ag_ui__')) {
      this.logger.warn('Client tool reached server execution - this should not happen', {
        toolName,
      });
      return {
        error: 'Client tools should be executed by the client, not the server',
        toolName,
      };
    }

    // Execute MCP tool call
    // Tool names come in format: serverName__toolName
    const parts = toolName.split('__');
    const serverName = parts[0];
    const actualToolName = parts.slice(1).join('__');

    const client = this.mcpClients[serverName];
    if (!client) {
      throw new Error(`MCP server ${serverName} not found for tool ${toolName}`);
    }

    const tools = client.getTools();
    const tool = tools.find((t) => t.name === actualToolName);
    if (!tool) {
      throw new Error(`Tool ${actualToolName} not found in server ${serverName}`);
    }

    return await client.executeTool(actualToolName, input);
  }
}
