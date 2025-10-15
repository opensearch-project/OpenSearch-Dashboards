/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from '../../utils/logger';
import { ReactAgentState } from './react_agent';
import { BedrockClient, BedrockRequest } from './bedrock_client';
import { PromptManager } from './prompt_manager';
import { ToolExecutor } from './tool_executor';
import { ModelConfigManager } from '../../config/model_config';
import { getPrometheusMetricsEmitter } from '../../utils/metrics_emitter';
import { LLMRequestLogger } from '../../utils/llm_request_logger';

export class ReactGraphNodes {
  private logger: Logger;
  private llmLogger: LLMRequestLogger;
  private bedrockClient: BedrockClient;
  private promptManager: PromptManager;
  private toolExecutor: ToolExecutor;

  constructor(
    logger: Logger,
    llmLogger: LLMRequestLogger,
    bedrockClient: BedrockClient,
    promptManager: PromptManager,
    toolExecutor: ToolExecutor
  ) {
    this.logger = logger;
    this.llmLogger = llmLogger;
    this.bedrockClient = bedrockClient;
    this.promptManager = promptManager;
    this.toolExecutor = toolExecutor;
  }

  /**
   * Process input node - prepares state for model call
   */
  async processInputNode(
    state: ReactAgentState
  ): Promise<Partial<ReactAgentState> | Record<string, any>> {
    return {
      currentStep: 'processInput',
      // Preserve client inputs for downstream nodes
      clientState: state.clientState,
      clientContext: state.clientContext,
      threadId: state.threadId,
      runId: state.runId,
      // Don't increment iterations here - only increment after tool execution
    };
  }

  /**
   * Call model node - makes request to Bedrock with retry logic
   */
  async callModelNode(
    state: ReactAgentState
  ): Promise<Partial<ReactAgentState> | Record<string, any>> {
    const {
      messages,
      streamingCallbacks,
      iterations,
      toolResults,
      clientState,
      clientContext,
      clientTools,
      threadId,
      runId,
      modelId,
    } = state;

    // Add progressive delay between iterations to prevent rate limiting
    await this.addIterationDelay(iterations);

    // Log full state including client inputs
    this.logger.info('React agent full state', {
      clientState,
      clientContext,
      threadId,
      runId,
      iterations,
      maxIterations: state.maxIterations,
      messageCount: messages.length,
      hasToolResults: Object.keys(toolResults).length > 0,
    });

    this.logger.info('📥 callModelNode: Starting', {
      iterations,
      maxIterations: state.maxIterations,
      messageCount: messages.length,
      lastMessageRole: messages[messages.length - 1]?.role,
      lastMessageContent: messages[messages.length - 1]?.content
        ? JSON.stringify(messages[messages.length - 1].content).substring(0, 100)
        : 'undefined',
    });

    // Prepare messages for Bedrock (same as Jarvis)
    const bedrockMessages = this.prepareMessagesForBedrock(messages);

    // Get available tools - but don't provide tools if we're at max iterations (to force a final response)
    const tools = this.toolExecutor.getAllTools(true, clientTools);

    // Check if there are tool results in the message history (properly formatted)
    const hasToolResultsInHistory = messages.some(
      (msg) =>
        Array.isArray(msg.content) && msg.content.some((c: any) => c.toolResult !== undefined)
    );

    // Only disable tools if we're at max iterations to force a final response
    // Let the model decide if it needs more tools based on the conversation context
    const atMaxIterations = iterations >= state.maxIterations - 1;
    const shouldDisableTools = atMaxIterations;

    const toolConfig = shouldDisableTools ? undefined : this.toolExecutor.prepareToolConfig(tools);

    // Build enhanced system prompt with all client data
    const enhancedSystemPrompt = this.promptManager.injectClientDataIntoPrompt(
      clientState,
      clientContext,
      clientTools
    );

    // Resolve model ID using priority: request -> default -> hardcoded
    const resolvedModelId = ModelConfigManager.resolveModelId(modelId);

    // Create the request for Bedrock
    const request: BedrockRequest = {
      modelId: resolvedModelId,
      messages: bedrockMessages,
      systemPrompt: enhancedSystemPrompt,
      toolConfig,
      inferenceConfig: {
        maxTokens: 4096,
        temperature: 0,
      },
    };

    try {
      // Emit warning and metric if we're forcing a final response due to max iterations
      if (atMaxIterations) {
        this.logger.warn('MAX_ITERATIONS_REACHED: Forcing final response from LLM', {
          iterations,
          maxIterations: state.maxIterations,
          messageCount: bedrockMessages.length,
        });

        // Emit Prometheus metric
        const metricsEmitter = getPrometheusMetricsEmitter();
        metricsEmitter.emitCounter('react_agent_max_iterations_reached_total', 1, {
          agent_type: 'react',
          max_iterations: state.maxIterations.toString(),
        });
      }

      // Capture start time for duration calculation
      const startTime = Date.now();

      const processedResponse = await this.bedrockClient.makeRequest(request, streamingCallbacks);

      // Calculate duration
      const duration = Date.now() - startTime;

      // Log complete LLM interaction to the LLM logger
      this.llmLogger.logLLMInteraction(
        iterations + 1, // Iteration number (0-based to 1-based)
        request,
        {
          message: processedResponse.message,
          stopReason: processedResponse.stopReason,
        },
        duration
      );

      // Check if the response contains XML tool calls in the text (fallback for when Bedrock doesn't recognize tools)
      let extractedToolCalls = processedResponse.toolCalls || [];
      let assistantMessage = processedResponse.message; // Use the complete message from Bedrock

      if (
        extractedToolCalls.length === 0 &&
        processedResponse.message.textContent.includes('<function_calls>')
      ) {
        this.logger.warn('Tool calls found in text content, attempting to parse XML');
        extractedToolCalls = this.toolExecutor.parseToolCallsFromXML(
          processedResponse.message.textContent
        );

        // For XML tool calls, we need to handle them differently
        // Remove the XML from the text content
        if (extractedToolCalls.length > 0) {
          const xmlStart = processedResponse.message.textContent.indexOf('<function_calls>');
          const xmlEnd =
            processedResponse.message.textContent.indexOf('</function_calls>') +
            '</function_calls>'.length;
          const cleanedText = processedResponse.message.textContent.substring(0, xmlStart).trim();

          // Update the assistant message to remove XML from text blocks
          assistantMessage = {
            role: 'assistant',
            content: cleanedText ? [{ text: cleanedText }] : [],
            textContent: cleanedText,
          };
        }
      }

      // Handle message history properly based on UML diagram flow
      // First iteration: Add assistant message with tool calls
      // Subsequent iterations: Only add assistant message if there are no tool calls (final response)

      const isFirstCallInTurn = iterations === 0;

      if (isFirstCallInTurn) {
        // First call in this turn - add only the new assistant message
        return {
          messages: [assistantMessage], // Only return the new message, StateGraph will append it
          toolCalls: extractedToolCalls,
          currentStep: 'callModel',
        };
      } else if (extractedToolCalls.length === 0) {
        // Subsequent iteration with no tool calls - this is the final response
        this.logger.info('📝 Final response: Adding assistant message without tool calls', {
          previousMessageCount: messages.length,
          iterations,
          hasToolCalls: false,
        });

        return {
          messages: [assistantMessage], // Only return the new message, StateGraph will append it
          toolCalls: extractedToolCalls,
          currentStep: 'callModel',
        };
      } else {
        // Subsequent iteration with tool calls - we MUST add the assistant message
        // Each set of tool calls needs its corresponding assistant message for proper pairing
        this.logger.info(
          '📝 Continuation with tools: Adding assistant message with new tool calls',
          {
            previousMessageCount: messages.length,
            iterations,
            hasToolCalls: true,
            toolCallCount: extractedToolCalls.length,
          }
        );

        return {
          messages: [assistantMessage], // Add the assistant message with tool calls
          toolCalls: extractedToolCalls,
          currentStep: 'callModel',
        };
      }
    } catch (error) {
      // Enhanced error logging to capture all error details
      this.logger.error('Error calling model', {
        error,
        errorName: (error as any)?.name,
        errorMessage: (error as any)?.message,
        errorStack: (error as any)?.stack,
        errorCode: (error as any)?.code,
        errorType: typeof error,
        errorKeys: error ? Object.keys(error) : [],
        errorString: String(error),
      });

      // Handle credential expiration
      if (
        (error as any)?.name === 'ExpiredTokenException' ||
        (error as any)?.name === 'CredentialsProviderError'
      ) {
        streamingCallbacks?.onError?.(
          'AWS credentials expired. Please refresh your credentials and try again.'
        );
        return {
          shouldContinue: false,
          currentStep: 'callModel',
        };
      }

      // Check if this was a throttling error that exhausted all retries
      const isThrottling =
        (error as any)?.name === 'ThrottlingException' ||
        (error as any)?.$metadata?.httpStatusCode === 429 ||
        (error as any)?.message?.includes('Too many tokens');

      // Provide appropriate error message to user
      const userErrorMessage = isThrottling
        ? 'The AI service is currently experiencing high demand. Please wait a moment and try again.'
        : (error as any)?.message ||
          (error as any)?.name ||
          String(error) ||
          'Unknown error occurred';

      streamingCallbacks?.onError?.(userErrorMessage);

      return {
        shouldContinue: false,
        currentStep: 'callModel',
      };
    }
  }

  /**
   * Execute tools node - handles tool execution with client/MCP separation
   */
  async executeToolsNode(
    state: ReactAgentState
  ): Promise<Partial<ReactAgentState> | Record<string, any>> {
    const {
      toolCalls,
      streamingCallbacks,
      messages,
      clientState,
      clientContext,
      threadId,
      runId,
    } = state;

    const result = await this.toolExecutor.executeToolCalls(
      toolCalls,
      messages,
      streamingCallbacks,
      {
        state: clientState,
        context: clientContext,
        threadId,
        runId,
      }
    );

    if (result.isClientTools) {
      // For client tools, we need to return an empty tool result message
      // This signals the completion of this request, client will send results in next request
      return {
        messages: [], // No new messages for client tools
        toolCalls: [],
        currentStep: 'executeTools',
        shouldContinue: false, // Stop here for client execution
        iterations: state.iterations, // Don't increment for client tools
      };
    }

    if (!result.shouldContinue || !result.toolResultMessage) {
      return {
        toolCalls: [],
        currentStep: 'executeTools',
        shouldContinue: false,
      };
    }

    const newIterations = state.iterations + 1;
    const willContinue = newIterations < state.maxIterations && state.shouldContinue;

    // Emit metric for iteration count
    const metricsEmitter = getPrometheusMetricsEmitter();
    metricsEmitter.emitHistogram('react_agent_iterations_per_request', newIterations, {
      agent_type: 'react',
    });

    // Note: The assistant message with toolUse blocks is already in messages from callModelNode
    // We only need to add the toolResult message
    return {
      messages: [result.toolResultMessage], // Only return the new message, StateGraph will append it
      toolResults: { ...state.toolResults, ...result.toolResults },
      toolCalls: [], // Clear tool calls after execution
      currentStep: 'executeTools',
      iterations: newIterations, // Set the new iterations count
      shouldContinue: true, // Keep this true to allow the graph to decide
      lastToolExecution: Date.now(), // Track when tools were last executed
    };
  }

  /**
   * Generate response node - final step that emits completion
   */
  async generateResponseNode(
    state: ReactAgentState
  ): Promise<Partial<ReactAgentState> | Record<string, any>> {
    const { streamingCallbacks } = state;
    streamingCallbacks?.onTurnComplete?.();

    return {
      currentStep: 'generateResponse',
      shouldContinue: false,
    };
  }

  /**
   * Adds progressive delay between iterations to prevent rate limiting
   * Delay increases with iteration count to handle token accumulation
   */
  private async addIterationDelay(iterations: number): Promise<void> {
    if (iterations === 0) return; // No delay on first iteration

    // Progressive delay: 500ms * iteration number, capped at 5 seconds
    // Examples: iter 1: 500ms, iter 5: 2500ms, iter 10: 5000ms
    const delay = Math.min(500 * iterations, 5000);

    this.logger.info(`⏱️ Pacing request (iteration ${iterations})`, {
      delaySeconds: (delay / 1000).toFixed(1),
    });

    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Prepare messages for Bedrock format
   */
  private prepareMessagesForBedrock(messages: any[]): any[] {
    // Convert messages to Bedrock format
    // Keep all messages with valid content
    const prepared = messages
      .filter((msg) => {
        // Keep all messages that have content (including empty arrays for assistant)
        // Bedrock needs to see the full conversation flow including tool use/result pairs
        if (msg.content === undefined || msg.content === null) {
          return false;
        }
        // Keep messages with empty content arrays (assistant messages with only tool calls)
        if (Array.isArray(msg.content) && msg.content.length === 0 && msg.role === 'assistant') {
          return false; // Skip truly empty assistant messages
        }
        return true;
      })
      .map((msg) => ({
        // Convert 'tool' role to 'user' role for Bedrock compatibility
        // Bedrock only accepts 'user' and 'assistant' roles
        role: msg.role === 'tool' ? 'user' : msg.role || 'user',
        // If content is already an array (proper format), use it directly
        // This preserves toolUse and toolResult blocks
        // Filter out empty text blocks to prevent ValidationException
        content: Array.isArray(msg.content)
          ? msg.content.filter((block: any) => !block.text || block.text.trim() !== '')
          : [{ text: msg.content || '' }].filter((block: any) => block.text.trim() !== ''),
      }));

    // Debug logging to catch toolUse/toolResult mismatch
    let toolUseCount = 0;
    let toolResultCount = 0;

    prepared.forEach((msg, index) => {
      if (msg.role === 'assistant' && Array.isArray(msg.content)) {
        const msgToolUses = msg.content.filter((c: any) => c.toolUse).length;
        toolUseCount += msgToolUses;
        if (msgToolUses > 0) {
          this.logger.info(`Message ${index} (assistant): ${msgToolUses} toolUse blocks`);
        }
      }
      if (msg.role === 'user' && Array.isArray(msg.content)) {
        const msgToolResults = msg.content.filter((c: any) => c.toolResult).length;
        toolResultCount += msgToolResults;
        if (msgToolResults > 0) {
          this.logger.info(`Message ${index} (user): ${msgToolResults} toolResult blocks`);
        }
      }
    });

    if (toolUseCount !== toolResultCount) {
      this.logger.warn(`⚠️ Tool use/result mismatch detected!`, {
        toolUseCount,
        toolResultCount,
        messageCount: prepared.length,
        lastMessage: prepared[prepared.length - 1],
      });
    }

    return prepared;
  }
}
