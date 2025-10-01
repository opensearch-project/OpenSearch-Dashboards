/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-console */

import readline from 'readline';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { StateGraph } from '@langchain/langgraph';
import { BaseMCPClient, LocalMCPClient, HTTPMCPClient } from '../../mcp/index';
import { MCPServerConfig } from '../../types/mcp_types';
import { Logger } from '../../utils/logger';
import { BaseAgent, StreamingCallbacks } from '../base_agent';
import { LLMRequestLogger } from '../../utils/llm_request_logger';
import { BedrockClient } from './bedrock_client';
import { PromptManager } from './prompt_manager';
import { ReactGraphBuilder } from './react_graph_builder';
import { ToolExecutor } from './tool_executor';
import { ReactGraphNodes } from './react_graph_nodes';

// Configuration constants
const REACT_MAX_ITERATIONS = 10; // Maximum tool execution cycles before forcing final response

// StateGraph state interface
export interface ReactAgentState {
  messages: any[];
  currentStep: string;
  toolCalls: any[];
  toolResults: Record<string, any>;
  iterations: number;
  maxIterations: number;
  shouldContinue: boolean;
  streamingCallbacks?: StreamingCallbacks;
  lastToolExecution?: number; // Timestamp of last tool execution
  // Client-provided inputs from AG UI
  clientState?: any; // Store client's state object
  clientContext?: any[]; // Store client's context array
  clientTools?: any[]; // Store client's tools (AG UI tools)
  threadId?: string; // Store thread identifier
  runId?: string; // Store run identifier
  modelId?: string; // Store model identifier from forwardedProps for dynamic model selection
}

/**
 * ReAct Agent Implementation
 *
 * This agent implements the ReAct (Reasoning + Acting) pattern using LangGraph's StateGraph:
 * - AWS Bedrock ConverseStream API (same as Jarvis Agent)
 * - MCP tool infrastructure
 * - System prompts
 * - Streaming callbacks
 *
 * The key difference is the graph-based state management and workflow orchestration
 */
export class ReactAgent implements BaseAgent {
  private mcpClients: Record<string, BaseMCPClient> = {};
  private logger: Logger;
  private llmLogger: LLMRequestLogger;
  private compiledGraph?: any;
  private rl?: readline.Interface;

  // Component instances
  private bedrockClient: BedrockClient;
  private promptManager: PromptManager;
  private graphBuilder: ReactGraphBuilder;
  private toolExecutor: ToolExecutor;
  private graphNodes: ReactGraphNodes;

  constructor(logger?: Logger) {
    this.logger = logger || new Logger();
    this.llmLogger = LLMRequestLogger.getInstance();

    // Initialize components
    this.bedrockClient = new BedrockClient(this.logger);
    this.promptManager = new PromptManager(this.logger, this.mcpClients);
    this.graphBuilder = new ReactGraphBuilder(this.logger);
    this.toolExecutor = new ToolExecutor(this.logger, this.mcpClients, this.llmLogger);
    this.graphNodes = new ReactGraphNodes(
      this.logger,
      this.llmLogger,
      this.bedrockClient,
      this.promptManager,
      this.toolExecutor
    );

    this.logger.info('ReAct Agent initialized with component architecture');
  }

  getAgentType(): string {
    return 'react';
  }

  async initialize(
    configs: Record<string, MCPServerConfig>,
    customSystemPrompt?: string
  ): Promise<void> {
    this.logger.info('Initializing ReAct Agent', {
      serverCount: Object.keys(configs).length,
      servers: Object.keys(configs),
    });

    // Connect to all MCP servers (reuse existing infrastructure)
    for (const [name, config] of Object.entries(configs)) {
      this.logger.info(`Connecting to MCP server: ${name}`);

      // Create appropriate client based on config type
      let client: BaseMCPClient;
      if (config.type === 'http') {
        client = new HTTPMCPClient(config, name, this.logger);
      } else {
        client = new LocalMCPClient(config, name, this.logger);
      }

      await client.connect();
      this.mcpClients[name] = client;

      const tools = client.getTools();
      this.logger.info(`Connected to ${name}, available tools: ${tools.length}`);
    }

    // Update prompt manager with connected MCP clients
    this.promptManager = new PromptManager(this.logger, this.mcpClients);
    this.toolExecutor = new ToolExecutor(this.logger, this.mcpClients, this.llmLogger);

    // Update graph nodes with new tool executor
    this.graphNodes = new ReactGraphNodes(
      this.logger,
      this.llmLogger,
      this.bedrockClient,
      this.promptManager,
      this.toolExecutor
    );

    // Load system prompt - now that MCP clients are connected, we can generate dynamic prompt
    this.promptManager.loadSystemPrompt(customSystemPrompt);

    this.buildStateGraph();

    this.logger.info('ReAct Agent initialization complete', {
      totalTools: this.getAllTools().length,
    });
  }

  private buildStateGraph(): void {
    this.compiledGraph = this.graphBuilder.buildStateGraph(
      this.graphNodes.processInputNode.bind(this.graphNodes),
      this.graphNodes.callModelNode.bind(this.graphNodes),
      this.graphNodes.executeToolsNode.bind(this.graphNodes),
      this.graphNodes.generateResponseNode.bind(this.graphNodes)
    );
  }

  async processMessageWithCallbacks(
    messages: any[], // Full conversation history from UI
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
  ): Promise<void> {
    try {
      // Set logger context for correlation with AG UI audits
      if (additionalInputs?.threadId || additionalInputs?.runId || additionalInputs?.requestId) {
        this.logger.setContext(
          additionalInputs.threadId,
          additionalInputs.runId,
          additionalInputs.requestId
        );
      }

      // Always initialize LLM logger for this run (even without IDs)
      this.llmLogger.startRun(
        additionalInputs?.runId || 'unknown-run',
        additionalInputs?.threadId || 'unknown-thread'
      );

      // Create initial state with the full conversation history
      const initialState: ReactAgentState = {
        messages, // Use the messages directly from UI
        currentStep: 'processInput',
        toolCalls: [],
        toolResults: {},
        iterations: 0,
        maxIterations: REACT_MAX_ITERATIONS,
        shouldContinue: true,
        streamingCallbacks: callbacks,
        // Add client inputs to initial state
        clientState: additionalInputs?.state,
        clientContext: additionalInputs?.context,
        clientTools: additionalInputs?.tools,
        threadId: additionalInputs?.threadId,
        runId: additionalInputs?.runId,
        modelId: additionalInputs?.modelId,
      };

      // Run the graph - unique config per request for stateless operation
      const config = {
        configurable: {
          thread_id: `${additionalInputs?.threadId || 'session'}_${
            additionalInputs?.runId || Date.now()
          }`,
        },
      };
      await this.compiledGraph.invoke(initialState, config);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Error processing message with callbacks', {
        error: errorMessage,
      });
      callbacks.onError?.(errorMessage);
    }
  }

  async sendMessage(message: string): Promise<void> {
    // For CLI mode - create a simple message array with just the user message
    // In CLI mode, we don't maintain conversation history (stateless)
    const messages = [{ role: 'user', content: [{ text: message }] }];

    const callbacks: StreamingCallbacks = {
      onTextStart: (text: string) => {
        process.stdout.write(text);
      },
      onTextDelta: (delta: string) => {
        process.stdout.write(delta);
      },
      onToolUseStart: (toolName: string, _toolUseId: string, input: any) => {
        console.log(`\n🔧 Using tool: ${toolName.split('__').pop() || toolName}`);
        console.log(`   Input: ${JSON.stringify(input, null, 2)}`);
      },
      onToolResult: (toolName: string, _toolUseId: string, result: any) => {
        console.log(`✅ Tool result:`, JSON.stringify(result, null, 2).substring(0, 500));
      },
      onToolError: (toolName: string, _toolUseId: string, error: string) => {
        console.log(`❌ Tool error:`, error);
      },
      onTurnComplete: () => {
        console.log('\n');
      },
      onError: (error: string) => {
        console.error('Error:', error);
      },
    };

    await this.processMessageWithCallbacks(messages, callbacks);
  }

  getAllTools(includeClientTools: boolean = false, clientTools?: any[]): any[] {
    return this.toolExecutor.getAllTools(includeClientTools, clientTools);
  }

  async startInteractiveMode(): Promise<void> {
    console.log('🤖 ReAct Agent Ready!');
    console.log('📊 Using ReAct pattern (Reasoning + Acting) with MCP tools');
    console.log('💡 Type your message or "exit" to quit\n');

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '> ',
    });

    // Return a Promise that resolves only when user quits
    return new Promise<void>((resolve) => {
      this.rl!.prompt();

      this.rl!.on('line', async (line) => {
        const input = line.trim();

        if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
          console.log('👋 Goodbye!');
          this.cleanup();
          resolve(); // Resolve the Promise instead of calling process.exit(0)
          return;
        }

        if (input) {
          await this.sendMessage(input);
        }

        this.rl!.prompt();
      });

      this.rl!.on('close', () => {
        console.log('\n👋 Goodbye!');
        this.cleanup();
        resolve(); // Resolve the Promise instead of calling process.exit(0)
      });
    });
  }

  public get systemPrompt(): string {
    return this.promptManager.getBaseSystemPrompt();
  }

  cleanup(): void {
    if (this.rl) {
      this.rl.close();
    }

    // Disconnect all MCP clients
    for (const client of Object.values(this.mcpClients)) {
      client.disconnect();
    }

    this.logger.info('ReAct Agent cleanup completed');
  }
}
