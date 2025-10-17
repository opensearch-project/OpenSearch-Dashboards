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
   * Generate a stable signature for a tool call based on its name and parameters
   * Used for semantic duplicate detection
   */
  private generateToolCallSignature(toolName: string, input: any): string {
    try {
      // Create a stable string representation by sorting keys
      const sortedInput = JSON.stringify(input, Object.keys(input || {}).sort());
      return `${toolName}::${sortedInput}`;
    } catch (error) {
      this.logger.error('Failed to generate tool call signature', {
        error: error instanceof Error ? error.message : String(error),
        toolName,
      });
      // Fallback to basic signature
      return `${toolName}::${JSON.stringify(input)}`;
    }
  }

  /**
   * Check if a tool call is a duplicate of recent calls
   * Returns the count of consecutive duplicates (0 if not a duplicate)
   */
  private checkForDuplicate(
    toolCall: any,
    recentSignatures: string[]
  ): { isDuplicate: boolean; consecutiveCount: number } {
    const newSignature = this.generateToolCallSignature(toolCall.toolName, toolCall.input);

    // Check if the most recent signature matches (consecutive duplicate)
    if (recentSignatures.length > 0 && recentSignatures[0] === newSignature) {
      // Count how many times this same signature appears consecutively
      let consecutiveCount = 0;
      for (const sig of recentSignatures) {
        if (sig === newSignature) {
          consecutiveCount++;
        } else {
          break; // Stop at first non-matching signature
        }
      }

      return { isDuplicate: true, consecutiveCount };
    }

    return { isDuplicate: false, consecutiveCount: 0 };
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
    },
    recentToolSignatures?: string[]
  ): Promise<{
    toolResults: Record<string, any>;
    toolResultMessage?: any;
    shouldContinue: boolean;
    isClientTools: boolean;
    updatedSignatures?: string[];
    duplicateDetected?: boolean;
  }> {
    const toolResults: Record<string, any> = {};
    const signatures = recentToolSignatures || [];

    this.logger.info('Executing tools', {
      toolCallsCount: toolCalls.length,
      toolNames: toolCalls.map((tc) => tc.toolName),
      toolIds: toolCalls.map((tc) => tc.toolUseId),
      recentSignaturesCount: signatures.length,
    });

    // Check for duplicates in the first tool call
    // Only check the first one since that's what matters for the loop detection
    if (toolCalls.length > 0 && signatures.length > 0) {
      const firstToolCall = toolCalls[0];
      const duplicateCheck = this.checkForDuplicate(firstToolCall, signatures);

      if (duplicateCheck.isDuplicate) {
        const duplicateCount = duplicateCheck.consecutiveCount + 1; // +1 for this call
        this.logger.warn('Duplicate tool call detected', {
          toolName: firstToolCall.toolName,
          consecutiveCount: duplicateCount,
          toolUseId: firstToolCall.toolUseId,
        });

        // If we've hit the threshold (3 consecutive duplicates), warn the LLM
        if (duplicateCount >= 3) {
          this.logger.warn('Duplicate threshold reached - injecting warning to LLM', {
            duplicateCount,
            toolName: firstToolCall.toolName,
          });

          // Emit Prometheus metric
          const metricsEmitter = getPrometheusMetricsEmitter();
          metricsEmitter.emitCounter('react_agent_duplicate_tool_calls_total', 1, {
            agent_type: 'react',
            tool_name: firstToolCall.toolName,
          });

          // Create a warning message for the LLM
          const warningResult = {
            duplicate_detected: true,
            consecutive_count: duplicateCount,
            message: `⚠️ You have called the tool "${firstToolCall.toolName}" with identical parameters ${duplicateCount} times in a row. The results are not changing.`,
            suggestion:
              'Please synthesize the information from your previous tool calls to provide a final answer, or try using different parameters if you need additional information.',
            note:
              'Repeatedly calling the same tool with the same parameters will not yield different results.',
          };

          toolResults[firstToolCall.toolUseId] = warningResult;

          // Still create the tool result message for proper conversation flow
          const toolResultMessage = {
            role: 'user' as const,
            content: [
              {
                toolResult: {
                  toolUseId: firstToolCall.toolUseId,
                  content: [{ text: JSON.stringify(warningResult, null, 2) }],
                },
              },
            ],
          };

          // Update signatures with this duplicate
          const newSignature = this.generateToolCallSignature(
            firstToolCall.toolName,
            firstToolCall.input
          );
          const updatedSignatures = [newSignature, ...signatures].slice(0, 10); // Keep last 10

          // Emergency stop if we've hit 10 consecutive duplicates
          if (duplicateCount >= 10) {
            this.logger.error('Emergency stop: 10+ consecutive duplicate tool calls', {
              toolName: firstToolCall.toolName,
            });

            streamingCallbacks?.onError?.(
              'The agent appears stuck in a loop. Ending conversation for safety.'
            );

            return {
              toolResults,
              toolResultMessage,
              shouldContinue: false, // Force stop
              isClientTools: false,
              updatedSignatures,
              duplicateDetected: true,
            };
          }

          // Return with warning but keep conversation alive
          return {
            toolResults,
            toolResultMessage,
            shouldContinue: true, // Let LLM handle it
            isClientTools: false,
            updatedSignatures,
            duplicateDetected: true,
          };
        }
      }
    }

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
        updatedSignatures: signatures,
        duplicateDetected: false,
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

      // Update signatures even for client tools
      const newSignatures = clientToolCalls.map((tc) =>
        this.generateToolCallSignature(tc.toolName, tc.input)
      );
      const updatedSignatures = [...newSignatures, ...signatures].slice(0, 10);

      return {
        toolResults: {},
        shouldContinue: false, // Stop here for client execution
        isClientTools: true,
        updatedSignatures,
        duplicateDetected: false,
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
        updatedSignatures: signatures,
        duplicateDetected: false,
      };
    }

    const toolResultMessage = {
      role: 'user' as const,
      content: toolResultContent,
    };

    // Update signatures with executed tool calls
    const newSignatures = mcpToolCalls.map((tc) =>
      this.generateToolCallSignature(tc.toolName, tc.input)
    );
    const updatedSignatures = [...newSignatures, ...signatures].slice(0, 10); // Keep last 10

    return {
      toolResults,
      toolResultMessage,
      shouldContinue: true,
      isClientTools: false,
      updatedSignatures,
      duplicateDetected: false,
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
