/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BedrockRuntimeClient, ConverseStreamCommand } from '@aws-sdk/client-bedrock-runtime';
import { Logger } from '../../utils/logger';
import { getPrometheusMetricsEmitter } from '../../utils/metrics_emitter';
import { StreamingCallbacks } from '../base_agent';

export interface BedrockRequest {
  modelId: string;
  messages: any[];
  systemPrompt: string;
  toolConfig?: any;
  inferenceConfig: {
    maxTokens: number;
    temperature: number;
  };
}

export interface BedrockResponse {
  message: {
    role: string;
    content: any[];
    textContent: string;
  };
  toolCalls: any[];
  stopReason?: string;
}

export class BedrockClient {
  private client: BedrockRuntimeClient;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    const region = process.env.AWS_REGION || 'us-east-1';

    this.client = new BedrockRuntimeClient({
      region,
      // Let our custom retry logic handle throttling with better logging
      maxAttempts: 1, // Disable SDK retries, use our callBedrockWithRetry instead
    });

    this.logger.info('BedrockClient initialized', {
      region,
      hasAwsAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasAwsSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      hasAwsProfile: !!process.env.AWS_PROFILE,
      hasAwsSessionToken: !!process.env.AWS_SESSION_TOKEN,
    });
  }

  /**
   * Implements exponential backoff retry for AWS Bedrock API calls
   * Helps handle ThrottlingException (429) errors gracefully
   */
  private async callBedrockWithRetry(
    command: ConverseStreamCommand,
    retries: number = 5, // Increased from 3 to 5 for better resilience
    baseDelay: number = 2000 // Increased from 1000ms to 2000ms base delay
  ): Promise<any> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        // Log retry attempts in a friendly way
        if (attempt > 0) {
          this.logger.info(`🔄 Retry attempt ${attempt}/${retries - 1}`, {
            attempt: attempt + 1,
            maxRetries: retries,
          });
        }

        return await this.client.send(command);
      } catch (error: any) {
        const isThrottling =
          error?.name === 'ThrottlingException' ||
          error?.$metadata?.httpStatusCode === 429 ||
          error?.message?.includes('Too many tokens');

        if (isThrottling && attempt < retries - 1) {
          // Enhanced exponential backoff with jitter
          // Delays: ~2-3s, ~4-5s, ~8-9s, ~16-17s, ~32-33s
          const exponentialDelay = baseDelay * Math.pow(2, attempt);
          const jitter = Math.random() * 1000;
          const delay = exponentialDelay + jitter;

          // Friendly short info about retry
          this.logger.info(
            `⏳ Rate limited - waiting ${Math.round(delay / 1000)}s before retry ${attempt + 1}/${
              retries - 1
            }`,
            {
              delaySeconds: Math.round(delay / 1000),
            }
          );

          // Emit metric for throttling
          const metricsEmitter = getPrometheusMetricsEmitter();
          metricsEmitter.emitCounter('react_agent_throttling_retries_total', 1, {
            agent_type: 'react',
            attempt: (attempt + 1).toString(),
          });

          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // Log the final error if all retries are exhausted
        if (isThrottling) {
          this.logger.error('All retry attempts exhausted for throttling error', {
            attempts: retries,
            errorMessage: error?.message,
            requestId: error?.$metadata?.requestId,
          });
        }

        throw error;
      }
    }
    throw new Error('Failed after all retry attempts');
  }

  /**
   * Process streaming response from Bedrock and emit callbacks
   */
  async processStreamingResponse(
    response: any,
    callbacks?: StreamingCallbacks
  ): Promise<BedrockResponse> {
    // We need to preserve the complete message structure including content blocks
    const result: BedrockResponse = {
      message: {
        role: 'assistant',
        content: [], // This will hold all content blocks (text and toolUse)
        textContent: '', // Keep text separately for convenience
      },
      toolCalls: [], // Keep this for backward compatibility
    };

    let currentTextBlock = '';
    let currentToolUseBlock: any = null;
    let hasAnyContent = false; // Track if we have any content at all

    if (response.stream) {
      for await (const chunk of response.stream) {
        if (chunk.contentBlockStart) {
          const start = chunk.contentBlockStart.start;
          if (start?.text) {
            // Start a new text block
            currentTextBlock = start.text;
            callbacks?.onTextStart?.(start.text);
            result.message.textContent += start.text;
            hasAnyContent = true;
          } else if (start?.toolUse) {
            // Start a new tool use block
            currentToolUseBlock = {
              toolUse: {
                toolUseId: start.toolUse.toolUseId,
                name: start.toolUse.name,
                input: {},
              },
              inputBuffer: '',
            };

            // Also track in toolCalls for backward compatibility
            const toolCall = {
              toolName: start.toolUse.name,
              toolUseId: start.toolUse.toolUseId,
              input: {},
            };
            result.toolCalls.push(toolCall);
            hasAnyContent = true;
          }
        }

        if (chunk.contentBlockDelta) {
          const delta = chunk.contentBlockDelta.delta;
          if (delta?.text) {
            currentTextBlock += delta.text;
            callbacks?.onTextDelta?.(delta.text);
            result.message.textContent += delta.text;
          } else if (delta?.toolUse && currentToolUseBlock && result.toolCalls.length > 0) {
            const lastToolCall = result.toolCalls[result.toolCalls.length - 1];
            try {
              // Handle streaming JSON input - may be incomplete
              if (delta.toolUse.input) {
                // Accumulate input
                currentToolUseBlock.inputBuffer += delta.toolUse.input;

                // Try to parse the accumulated input
                try {
                  const parsedInput = JSON.parse(currentToolUseBlock.inputBuffer);
                  currentToolUseBlock.toolUse.input = parsedInput;
                  lastToolCall.input = parsedInput;
                } catch (parseError) {
                  // JSON is incomplete, continue accumulating
                }
              }
            } catch (error) {
              this.logger.warn('Error processing tool use delta', {
                error: error instanceof Error ? error.message : String(error),
                input: delta.toolUse.input,
              });
            }
          }
        }

        if (chunk.contentBlockStop) {
          // Finalize the current block and add it to content
          if (currentTextBlock) {
            result.message.content.push({ text: currentTextBlock });
            currentTextBlock = '';
          } else if (currentToolUseBlock) {
            // Remove the inputBuffer before adding to content
            const { inputBuffer, ...toolUseBlock } = currentToolUseBlock;
            result.message.content.push(toolUseBlock);
            currentToolUseBlock = null;
          }
        }
      }
    }

    // CRITICAL: If we have no content blocks at all (shouldn't happen but handle it),
    // log a warning but don't add empty text block to avoid ValidationException
    if (result.message.content.length === 0 && !hasAnyContent) {
      this.logger.warn(
        'No content blocks received from Bedrock - this may indicate an issue with the response'
      );
    }

    // Final cleanup - ensure all tool inputs are properly parsed
    for (const toolCall of result.toolCalls) {
      if ((toolCall as any).inputBuffer && !toolCall.input) {
        try {
          toolCall.input = JSON.parse((toolCall as any).inputBuffer);
        } catch (error) {
          this.logger.error('Failed to parse final tool input', {
            error: error instanceof Error ? error.message : String(error),
            buffer: (toolCall as any).inputBuffer,
            toolCall: toolCall.toolName,
          });
          toolCall.input = {}; // Fallback to empty object
        }
      }
      // Clean up the buffer
      delete (toolCall as any).inputBuffer;
    }

    return result;
  }

  /**
   * Make a request to Bedrock with streaming response
   */
  async makeRequest(
    request: BedrockRequest,
    callbacks?: StreamingCallbacks
  ): Promise<BedrockResponse> {
    // Create the command for Bedrock ConverseStream
    const command = new ConverseStreamCommand({
      modelId: request.modelId,
      messages: request.messages,
      system: [{ text: request.systemPrompt }],
      toolConfig: request.toolConfig,
      inferenceConfig: request.inferenceConfig || {
        maxTokens: 4096,
        temperature: 0,
      },
    });

    try {
      // Log the actual messages being sent with full detail
      this.logger.info('LLM Request Messages', {
        messageCount: request.messages.length,
        messages: request.messages,
      });

      // Capture start time for duration calculation
      const startTime = Date.now();

      const response = await this.callBedrockWithRetry(command);
      const processedResponse = await this.processStreamingResponse(response, callbacks);

      // Calculate duration
      const duration = Date.now() - startTime;

      this.logger.info('📤 LLM Response from Bedrock', {
        contentBlocksCount: processedResponse.message.content.length,
        contentBlocks: processedResponse,
        durationMs: duration,
      });

      return processedResponse;
    } catch (error) {
      // Enhanced error logging to capture all error details
      this.logger.error('Error calling Bedrock', {
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
        callbacks?.onError?.(
          'AWS credentials expired. Please refresh your credentials and try again.'
        );
        throw new Error('AWS credentials expired');
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

      callbacks?.onError?.(userErrorMessage);
      throw error;
    }
  }
}
