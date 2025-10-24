/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';
import { MCPTool, MCPServerConfig } from '../types/mcp_types';
import { Logger } from '../utils/logger';

// Circuit breaker for tracking repeated failures
interface FailedToolCall {
  toolName: string;
  inputHash: string;
  attemptCount: number;
  lastAttemptTime: number;
}

// Base MCP Client interface
export abstract class BaseMCPClient {
  protected client: Client | null = null;
  protected tools: MCPTool[] = [];
  protected config: MCPServerConfig;
  protected logger: Logger;
  protected serverName: string;

  // Circuit breaker: Track failed tool calls to prevent infinite loops
  private failedToolCalls: Map<string, FailedToolCall> = new Map();
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly CIRCUIT_BREAKER_RESET_TIME = 300000; // 5 minutes

  constructor(config: MCPServerConfig, serverName: string, logger: Logger) {
    this.config = config;
    this.serverName = serverName;
    this.logger = logger;
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): void;

  getTools(): MCPTool[] {
    return this.tools;
  }

  getConfig(): MCPServerConfig {
    return this.config;
  }

  async executeTool(name: string, input: any): Promise<any> {
    if (!this.client) {
      throw new Error('Client not connected');
    }

    // Auto-inject OpenSearch cluster parameter if needed
    input = this.enhanceInputWithClusterConfig(name, input);

    // Validate OpenSearch cluster name if provided
    if (this.serverName === 'opensearch-mcp-server' && input?.opensearch_cluster_name) {
      const availableClusters = this.getAvailableOpenSearchClusters();
      if (
        availableClusters.length > 0 &&
        !availableClusters.includes(input.opensearch_cluster_name)
      ) {
        const errorMessage = `INVALID OPENSEARCH CLUSTER NAME: "${input.opensearch_cluster_name}"

📌 AVAILABLE OPENSEARCH CLUSTERS:
${availableClusters.map((c) => `  - "${c}"`).join('\n')}

Please use one of the available cluster names listed above.`;

        this.logger.error(`Invalid OpenSearch cluster name`, {
          provided: input.opensearch_cluster_name,
          available: availableClusters,
        });
        throw new Error(errorMessage);
      }
    }

    this.logger.debug(`Executing tool ${name} on ${this.serverName}`, { input });

    // Validate tool exists and get its schema
    const tool = this.tools.find((t) => t.name === name);
    if (!tool) {
      const error = new Error(`Tool ${name} not found`);
      this.logger.error(`Tool not found: ${name} on ${this.serverName}`);
      throw error;
    }

    // Circuit breaker: Check if this exact tool call has failed repeatedly
    const inputHash = this.generateInputHash(input);
    const failureKey = `${name}:${inputHash}`;
    const existingFailure = this.failedToolCalls.get(failureKey);
    const currentTime = Date.now();

    if (existingFailure) {
      // Reset circuit breaker after timeout
      if (currentTime - existingFailure.lastAttemptTime > this.CIRCUIT_BREAKER_RESET_TIME) {
        this.failedToolCalls.delete(failureKey);
        this.logger.debug(`Circuit breaker reset for ${name}`, { failureKey });
      } else if (existingFailure.attemptCount >= this.MAX_RETRY_ATTEMPTS) {
        const errorMessage = `CIRCUIT BREAKER ACTIVATED for tool "${name}":

This exact tool call has failed ${existingFailure.attemptCount} times with identical parameters.
To prevent infinite loops, this combination is temporarily blocked.

Parameters attempted: ${JSON.stringify(input, null, 2)}

RECOVERY OPTIONS:
1. Modify the parameters (different values, additional context)
2. Ask the user for clarification on the correct parameter values
3. Wait ${Math.round(
          (this.CIRCUIT_BREAKER_RESET_TIME - (currentTime - existingFailure.lastAttemptTime)) /
            60000
        )} minutes for automatic reset

The system is preventing repeated identical failures to avoid infinite loops.`;

        this.logger.toolParameterDebug('CIRCUIT_BREAKER_ACTIVATED', name, {
          attemptCount: existingFailure.attemptCount,
          inputHash,
          lastAttemptTime: existingFailure.lastAttemptTime,
          timeSinceLastAttempt: currentTime - existingFailure.lastAttemptTime,
          providedInput: input,
          maxAttempts: this.MAX_RETRY_ATTEMPTS,
        });

        throw new Error(errorMessage);
      }
    }

    // Validate required parameters
    if (tool.inputSchema.required) {
      const missingParams: string[] = [];
      for (const requiredParam of tool.inputSchema.required) {
        if (
          !(requiredParam in input) ||
          input[requiredParam] === undefined ||
          input[requiredParam] === null
        ) {
          missingParams.push(requiredParam);
        }
      }

      if (missingParams.length > 0) {
        // Record this failure for circuit breaker
        this.recordToolFailure(name, inputHash, currentTime);

        // Special handling for OpenSearch cluster parameter
        let clusterSuggestion = '';
        if (
          this.serverName === 'opensearch-mcp-server' &&
          missingParams.includes('opensearch_cluster_name')
        ) {
          const availableClusters = this.getAvailableOpenSearchClusters();
          if (availableClusters.length > 0) {
            clusterSuggestion = `\n\n📌 AVAILABLE OPENSEARCH CLUSTERS:\n${availableClusters
              .map((c) => `  - "${c}"`)
              .join('\n')}\n\nExample: opensearch_cluster_name: "${availableClusters[0]}"`;
          }
        }

        const errorMessage = `PARAMETER VALIDATION FAILED for tool "${name}":

Missing required parameters: ${missingParams.join(', ')}

Tool schema shows these are required: ${tool.inputSchema.required.join(', ')}
You provided: ${Object.keys(input || {}).join(', ') || 'no parameters'}${clusterSuggestion}

SELF-CORRECTION NEEDED:
1. Review the tool description for parameter requirements
2. Identify the missing parameter values from context or ask the user
3. Retry the tool call with ALL required parameters

Example correct usage would include: ${missingParams
          .map((p) => `${p}: "appropriate_value"`)
          .join(', ')}

WARNING: This failure has been recorded. After ${
          this.MAX_RETRY_ATTEMPTS
        } identical failures, this parameter combination will be temporarily blocked.`;

        this.logger.toolParameterDebug('VALIDATION_FAILED', name, {
          missingParams,
          providedInput: input,
          requiredParams: tool.inputSchema.required,
          inputHash,
          circuitBreakerStatus: {
            failureCount: (existingFailure?.attemptCount || 0) + 1,
            maxAttempts: this.MAX_RETRY_ATTEMPTS,
          },
        });
        throw new Error(errorMessage);
      }
    }

    try {
      const result = await this.client.callTool({ name, arguments: input || {} });

      // Success: Clear any previous failures for this combination
      if (existingFailure) {
        this.failedToolCalls.delete(failureKey);
        this.logger.debug(
          `Tool ${name} succeeded after previous failures - circuit breaker cleared`,
          {
            previousFailures: existingFailure.attemptCount,
          }
        );
      }

      this.logger.debug(`Tool ${name} executed successfully on ${this.serverName}`, { result });
      return result;
    } catch (error) {
      // Record this failure for circuit breaker
      this.recordToolFailure(name, inputHash, currentTime);

      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Tool execution failed for ${name} on ${this.serverName}`, {
        error: errorMessage,
        input,
        circuitBreakerStatus: {
          failureCount: (existingFailure?.attemptCount || 0) + 1,
          maxAttempts: this.MAX_RETRY_ATTEMPTS,
        },
      });
      throw new Error(`MCP tool execution failed: ${errorMessage}`);
    }
  }

  // Circuit breaker helper methods
  private generateInputHash(input: any): string {
    // Create a consistent hash of the input parameters for circuit breaker tracking
    const normalizedInput = JSON.stringify(input || {}, Object.keys(input || {}).sort());
    // Simple hash function - for production, consider using crypto.createHash
    let hash = 0;
    for (let i = 0; i < normalizedInput.length; i++) {
      const char = normalizedInput.charCodeAt(i);
      // eslint-disable-next-line no-bitwise
      hash = (hash << 5) - hash + char;
      // eslint-disable-next-line no-bitwise
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  private recordToolFailure(toolName: string, inputHash: string, currentTime: number): void {
    const failureKey = `${toolName}:${inputHash}`;
    const existingFailure = this.failedToolCalls.get(failureKey);

    if (existingFailure) {
      existingFailure.attemptCount++;
      existingFailure.lastAttemptTime = currentTime;
    } else {
      this.failedToolCalls.set(failureKey, {
        toolName,
        inputHash,
        attemptCount: 1,
        lastAttemptTime: currentTime,
      });
    }

    this.logger.debug(`Recorded tool failure`, {
      toolName,
      inputHash,
      attemptCount: this.failedToolCalls.get(failureKey)?.attemptCount,
      maxAttempts: this.MAX_RETRY_ATTEMPTS,
    });
  }

  protected async loadTools(): Promise<void> {
    if (!this.client) {
      throw new Error('Client not connected');
    }

    try {
      const toolsResult = await this.client.listTools();
      // Convert SDK tool format to our MCPTool interface
      this.tools = (toolsResult.tools || []).map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      }));
      this.logger.debug(`Loaded ${this.tools.length} tools from ${this.serverName}`);
    } catch (error) {
      this.logger.error(`Failed to load tools from ${this.serverName}`, { error });
      throw error;
    }
  }

  /**
   * Enhance input parameters with OpenSearch cluster configuration if needed
   */
  private enhanceInputWithClusterConfig(toolName: string, input: any): any {
    // Only apply to OpenSearch MCP server
    if (this.serverName !== 'opensearch-mcp-server') {
      return input;
    }

    // If cluster name is already provided, don't override
    if (input?.opensearch_cluster_name) {
      return input;
    }

    // Auto-inject cluster for OpenSearch tools
    const enhancedInput = { ...input };

    try {
      // Failsafe: Fall back to default cluster from OpenSearch config
      const defaultCluster = this.getDefaultOpenSearchCluster();
      if (defaultCluster) {
        enhancedInput.opensearch_cluster_name = defaultCluster;
        this.logger.debug(`Auto-injected default OpenSearch cluster parameter (failsafe)`, {
          toolName,
          clusterName: defaultCluster,
        });
      }
    } catch (error) {
      this.logger.warn(`Could not auto-inject OpenSearch cluster parameter`, {
        toolName,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return enhancedInput;
  }

  /**
   * Get available OpenSearch clusters from configuration
   */
  private getAvailableOpenSearchClusters(): string[] {
    try {
      const configPath = this.getOpenSearchConfigPath();
      if (!configPath) {
        return [];
      }

      if (!existsSync(configPath)) {
        return [];
      }

      const configContent = readFileSync(configPath, 'utf8');
      const config = yaml.load(configContent) as any;

      if (config?.clusters && typeof config.clusters === 'object') {
        return Object.keys(config.clusters);
      }

      return [];
    } catch (error) {
      this.logger.debug('Error reading OpenSearch clusters', { error });
      return [];
    }
  }

  /**
   * Get OpenSearch config path from MCP server args
   */
  private getOpenSearchConfigPath(): string | null {
    try {
      // Extract config path from MCP server args
      if (this.config.args) {
        const configIndex = this.config.args.findIndex((arg) => arg === '--config');
        if (configIndex !== -1 && configIndex + 1 < this.config.args.length) {
          const rawPath = this.config.args[configIndex + 1];
          // Resolve relative paths from project root
          return join(process.cwd(), rawPath);
        }
      }

      return null;
    } catch (error) {
      this.logger.debug('Error getting OpenSearch config path', { error });
      return null;
    }
  }

  /**
   * Get the default OpenSearch cluster name from configuration
   */
  private getDefaultOpenSearchCluster(): string | null {
    try {
      const clusters = this.getAvailableOpenSearchClusters();
      // Return the first cluster name as default
      return clusters.length > 0 ? clusters[0] : null;
    } catch (error) {
      this.logger.debug(`Error getting default OpenSearch cluster`, { error });
      return null;
    }
  }
}
