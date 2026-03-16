/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-console */

import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';

interface LLMRequest {
  modelId: string;
  systemPrompt: string;
  messages: any[];
  toolConfig?: any;
  inferenceConfig: {
    temperature: number;
    maxTokens: number;
  };
  timestamp: string;
}

interface LLMResponse {
  message: {
    role: string;
    content: any;
    toolCalls?: any[];
  };
  stopReason?: string;
  timestamp: string;
  duration?: number;
}

interface ToolExecution {
  toolName: string;
  parameters: any;
  result: any;
  duration: number;
  success: boolean;
  timestamp: string;
}

interface Iteration {
  iterationNumber: number;
  request: LLMRequest;
  response: LLMResponse;
  toolExecutions: ToolExecution[];
  duration: number;
}

interface LastRunData {
  runId: string;
  threadId: string;
  timestamp: string;
  iterations: Iteration[];
  totalMetrics: {
    totalDuration: number;
    totalIterations: number;
    totalToolCalls: number;
    totalTokens?: number;
    promptTokens?: number;
    completionTokens?: number;
  };
  errors?: any[];
}

/**
 * Singleton logger for LLM request/response tracking
 */
export class LLMRequestLogger {
  private static instance: LLMRequestLogger;
  private lastRunData: LastRunData | null = null;
  private currentIteration: Iteration | null = null;
  private logDir: string;
  private logFile: string;

  private constructor() {
    this.logDir = join(__dirname, '../../logs');
    this.logFile = join(this.logDir, 'last-run-llm.json');

    // Ensure log directory exists
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  public static getInstance(): LLMRequestLogger {
    if (!LLMRequestLogger.instance) {
      LLMRequestLogger.instance = new LLMRequestLogger();
    }
    return LLMRequestLogger.instance;
  }

  /**
   * Start a new run
   */
  public startRun(runId: string, threadId: string): void {
    this.lastRunData = {
      runId,
      threadId,
      timestamp: new Date().toISOString(),
      iterations: [],
      totalMetrics: {
        totalDuration: 0,
        totalIterations: 0,
        totalToolCalls: 0,
      },
    };
    this.currentIteration = null;
  }

  /**
   * Log a complete LLM interaction (request + response)
   */
  public logLLMInteraction(
    iterationNumber: number,
    request: {
      modelId: string;
      systemPrompt: string;
      messages: any[];
      toolConfig?: any;
      inferenceConfig: any;
    },
    response: {
      message: any;
      stopReason?: string;
    },
    duration: number
  ): void {
    if (!this.lastRunData) {
      // Auto-start a run if not started
      this.startRun('unknown-run', 'unknown-thread');
    }

    const iteration: Iteration = {
      iterationNumber,
      request: {
        ...request,
        timestamp: new Date().toISOString(),
      },
      response: {
        ...response,
        timestamp: new Date().toISOString(),
        duration,
      },
      toolExecutions: [],
      duration,
    };

    this.currentIteration = iteration;
    this.lastRunData!.iterations.push(iteration);
    this.lastRunData!.totalMetrics.totalIterations = iterationNumber;

    // Count tool calls in response
    if (response.message.toolCalls) {
      this.lastRunData!.totalMetrics.totalToolCalls += response.message.toolCalls.length;
    }

    this.saveToFile();
  }

  /**
   * Log a tool execution
   */
  public logToolExecution(
    toolName: string,
    parameters: any,
    result: any,
    duration: number,
    success: boolean = true
  ): void {
    if (!this.currentIteration) {
      console.warn('No current iteration to log tool execution to');
      return;
    }

    const toolExecution: ToolExecution = {
      toolName,
      parameters,
      result,
      duration,
      success,
      timestamp: new Date().toISOString(),
    };

    this.currentIteration.toolExecutions.push(toolExecution);
    this.saveToFile();
  }

  /**
   * Complete the current run
   */
  public completeRun(totalDuration: number, metrics?: any): void {
    if (!this.lastRunData) {
      return;
    }

    this.lastRunData.totalMetrics.totalDuration = totalDuration;

    // Add token metrics if available
    if (metrics) {
      if (metrics.totalTokens) this.lastRunData.totalMetrics.totalTokens = metrics.totalTokens;
      if (metrics.promptTokens) this.lastRunData.totalMetrics.promptTokens = metrics.promptTokens;
      if (metrics.completionTokens)
        this.lastRunData.totalMetrics.completionTokens = metrics.completionTokens;
    }

    this.saveToFile();
  }

  /**
   * Log an error
   */
  public logError(error: any): void {
    if (!this.lastRunData) {
      return;
    }

    if (!this.lastRunData.errors) {
      this.lastRunData.errors = [];
    }

    this.lastRunData.errors.push({
      timestamp: new Date().toISOString(),
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : error,
    });

    this.saveToFile();
  }

  /**
   * Get the last run data
   */
  public getLastRunData(): LastRunData | null {
    return this.lastRunData;
  }

  /**
   * Clear the last run data
   */
  public clearLastRun(): void {
    this.lastRunData = null;
    this.currentIteration = null;

    // Also clear the file
    if (existsSync(this.logFile)) {
      writeFileSync(
        this.logFile,
        JSON.stringify({ cleared: true, timestamp: new Date().toISOString() }, null, 2)
      );
    }
  }

  /**
   * Save current data to file
   */
  private saveToFile(): void {
    if (!this.lastRunData) {
      return;
    }

    try {
      writeFileSync(this.logFile, JSON.stringify(this.lastRunData, null, 2));
    } catch (error) {
      console.error('Failed to save LLM request log to file:', error);
    }
  }

  /**
   * Load last run data from file (if exists)
   */
  public loadFromFile(): LastRunData | null {
    if (!existsSync(this.logFile)) {
      return null;
    }

    try {
      const content = readFileSync(this.logFile, 'utf8');
      const data = JSON.parse(content);
      if (data && !data.cleared) {
        this.lastRunData = data;
        return data;
      }
    } catch (error) {
      console.error('Failed to load LLM request log from file:', error);
    }

    return null;
  }
}
