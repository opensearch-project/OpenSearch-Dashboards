/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-console */

import express from 'express';
import cors from 'cors';
import http from 'http';
import { RunAgentInput, BaseEvent, EventType, RunErrorEvent, RunFinishedEvent } from '@ag-ui/core';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Logger } from '../utils/logger';
import { AGUIAuditLogger } from '../utils/ag_ui_audit_logger';
import { BaseAGUIAdapter, BaseAGUIConfig } from '../ag_ui/base_ag_ui_adapter';
import { ModelConfigManager } from '../config/model_config';
import { LLMRequestLogger } from '../utils/llm_request_logger';

export class HTTPServer {
  private app: express.Application;
  private server: http.Server;
  private logger: Logger;
  private auditLogger?: AGUIAuditLogger;
  private config: BaseAGUIConfig;
  private adapter: BaseAGUIAdapter;
  private isShuttingDown: boolean = false;

  constructor(
    config: BaseAGUIConfig,
    adapter: BaseAGUIAdapter,
    logger: Logger,
    auditLogger?: AGUIAuditLogger
  ) {
    this.config = config;
    this.adapter = adapter;
    this.logger = logger;
    this.auditLogger = auditLogger;
    this.app = express();
    this.server = http.createServer(this.app);
  }

  setupMiddleware(): void {
    // CORS configuration
    if (this.config.cors) {
      this.app.use(
        cors({
          origin: this.config.cors.origins,
          credentials: this.config.cors.credentials,
        })
      );
    } else {
      this.app.use(cors());
    }

    // JSON parsing
    this.app.use(express.json({ limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      this.logger.info(`${req.method} ${req.path}`, {
        method: req.method,
        path: req.path,
        userAgent: req.get('User-Agent'),
      });
      next();
    });
  }

  setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      });
    });

    // AG UI protocol info endpoint
    this.app.get('/api/info', (req, res) => {
      res.json({
        name: 'AI Agent AG UI Server',
        version: '1.0.0',
        protocol: 'ag-ui',
        capabilities: {
          streaming: false, // HTTP-only, no WebSocket streaming
          tools: true,
          conversations: true,
          contextWindow: 200000,
          maxTokens: 4000,
          supportedModels: ['claude-sonnet-4'],
        },
      });
    });

    // Get available tools
    this.app.get('/api/tools', async (req, res) => {
      try {
        const tools = await this.adapter.getTools();
        res.json({ tools });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error('Error getting tools', { error: errorMessage });
        res.status(500).json({ error: errorMessage });
      }
    });

    // Debug route - HTML viewer for LLM logs
    this.app.get('/debug', (req, res) => {
      try {
        const logFile = join(__dirname, '../../logs/last-run-llm.json');
        let logData = null;

        if (existsSync(logFile)) {
          const fileContent = readFileSync(logFile, 'utf-8');
          try {
            logData = JSON.parse(fileContent);
          } catch (parseError) {
            this.logger.error('Failed to parse log file', { error: parseError });
          }
        }

        const html = this.generateDebugHTML(logData);
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error('Error serving debug page', { error: errorMessage });
        res.status(500).send(`<html><body><h1>Error</h1><pre>${errorMessage}</pre></body></html>`);
      }
    });

    // Debug route - JSON endpoint for raw data
    this.app.get('/debug/json', (req, res) => {
      try {
        const logFile = join(__dirname, '../../logs/last-run-llm.json');

        if (!existsSync(logFile)) {
          res.status(404).json({ error: 'No log file found' });
          return;
        }

        const fileContent = readFileSync(logFile, 'utf-8');
        const logData = JSON.parse(fileContent);
        res.json(logData);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error('Error serving debug JSON', { error: errorMessage });
        res.status(500).json({ error: errorMessage });
      }
    });

    // Model configuration endpoints
    this.app.get('/api/model/default', (req, res) => {
      try {
        const modelConfig = ModelConfigManager.getDefaultModel();
        res.json(modelConfig);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error('Error getting default model', { error: errorMessage });
        res.status(500).json({ error: errorMessage });
      }
    });

    this.app.put('/api/model/default', (req, res) => {
      try {
        const { modelId } = req.body;

        if (!modelId || typeof modelId !== 'string') {
          res.status(400).json({ error: 'modelId must be a non-empty string' });
          return;
        }

        ModelConfigManager.setDefaultModel(modelId);
        res.json({ modelId, message: 'Default model updated successfully' });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error('Error setting default model', { error: errorMessage });
        res.status(500).json({ error: errorMessage });
      }
    });

    // Run agent endpoint (SSE streaming)
    this.app.post('/', async (req, res) => {
      // Check if server is shutting down
      if (this.isShuttingDown) {
        res.status(503).json({ error: 'Server is shutting down' });
        return;
      }

      const input: RunAgentInput = req.body;

      try {
        // Validate input
        const validationResult = this.validateRunAgentInput(input);
        if (!validationResult.isValid) {
          this.handleValidationError(res, validationResult.errors, input.threadId, input.runId);
          return;
        }

        // Logger context will be set by base_ag_ui_adapter with request ID

        this.logger.info('Running agent via SSE streaming', {
          threadId: input.threadId,
          runId: input.runId,
          messageCount: input.messages.length,
          input,
        });

        // Log HTTP request details for audit
        this.auditLogger?.logHttpRequest(input.threadId, input.runId, {
          method: req.method,
          path: req.path,
          userAgent: req.get('User-Agent'),
          contentLength: req.get('Content-Length')
            ? parseInt(req.get('Content-Length')!, 10)
            : undefined,
          messageCount: input.messages.length,
          toolCount: input.tools?.length || 0,
        });

        // Set SSE headers
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Cache-Control',
        });

        // Stream events in real-time
        const eventStream = await this.adapter.runAgent(input);

        // Declare subscription variable to track the observable subscription
        let subscription: any = null;

        subscription = eventStream.subscribe({
          next: (event) => {
            // Send event as SSE format
            res.write(`data: ${JSON.stringify(event)}\n\n`);
          },
          error: (error) => {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error('Error in event stream', {
              error: errorMessage,
              stack: errorStack,
              threadId: input.threadId,
              runId: input.runId,
            });
            // Send error event and close connection
            const errorEvent: RunErrorEvent = {
              type: EventType.RUN_ERROR,
              message: errorMessage,
              code: 'STREAM_ERROR',
              timestamp: Date.now(),
            };
            res.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
            res.end();
          },
          complete: () => {
            // Stream already sends RUN_FINISHED event, just close connection
            res.end();
          },
        });

        // Handle client disconnect - use once to avoid multiple listeners
        const handleClientDisconnect = () => {
          this.logger.info('Client disconnected from SSE stream', {
            threadId: input.threadId,
            runId: input.runId,
          });
          // Clean up the event stream subscription
          if (subscription && typeof subscription.unsubscribe === 'function') {
            subscription.unsubscribe();
          }
        };

        req.once('close', handleClientDisconnect);
        req.once('error', handleClientDisconnect);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        this.logger.error('Error running agent', {
          error: errorMessage,
          stack: errorStack,
          threadId: input.threadId,
          runId: input.runId,
        });

        if (!res.headersSent) {
          res.status(500).json({ error: errorMessage });
        } else {
          const errorEvent: RunErrorEvent = {
            type: EventType.RUN_ERROR,
            message: errorMessage,
            code: 'AGENT_ERROR',
            timestamp: Date.now(),
          };
          res.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
          res.end();
        }
      }
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.config.port, this.config.host, () => {
        this.logger.info('AI Agent AG UI HTTP Server started', {
          host: this.config.host,
          port: this.config.port,
          httpEndpoint: `http://${this.config.host}:${this.config.port}`,
        });
        console.log(
          `🚀 AI Agent AG UI Server running at http://${this.config.host}:${this.config.port}`
        );
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    this.isShuttingDown = true;

    return new Promise((resolve, reject) => {
      // Close all active connections first
      this.server.closeAllConnections?.();

      // Remove all listeners to prevent memory leaks
      this.server.removeAllListeners();

      this.server.close((error) => {
        if (error) {
          this.logger.error('Error stopping HTTP server', { error: error.message });
          reject(error);
        } else {
          this.logger.info('AI Agent AG UI HTTP Server stopped');
          resolve();
        }
      });
    });
  }

  /**
   * Validate RunAgentInput structure and required fields
   */
  private validateRunAgentInput(input: RunAgentInput): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required string fields
    if (!input.threadId || typeof input.threadId !== 'string') {
      errors.push('threadId must be a non-empty string');
    }

    if (!input.runId || typeof input.runId !== 'string') {
      errors.push('runId must be a non-empty string');
    }

    // Validate messages array
    if (!input.messages || !Array.isArray(input.messages) || input.messages.length === 0) {
      errors.push('messages must be a non-empty array');
    } else {
      // Validate individual message structure
      input.messages.forEach((msg, index) => {
        if (!msg.role || typeof msg.role !== 'string') {
          errors.push(`messages[${index}].role must be a string`);
        }

        // Assistant messages with toolCalls may not have content
        const isAssistantWithTools = msg.role === 'assistant' && msg.toolCalls;

        // Content is required unless it's an assistant message with tool calls
        if (!isAssistantWithTools) {
          if (!msg.content || (typeof msg.content !== 'string' && !Array.isArray(msg.content))) {
            errors.push(`messages[${index}].content must be a string or array`);
            // Log the problematic message for debugging
            this.logger.warn(`Invalid message content at index ${index}`, {
              index,
              role: msg.role,
              contentType: typeof msg.content,
              contentValue: msg.content,
              isNull: msg.content === null,
              isUndefined: msg.content === undefined,
              messageKeys: Object.keys(msg),
            });
          }
        } else if (msg.content && typeof msg.content !== 'string' && !Array.isArray(msg.content)) {
          // If content is provided for assistant with tools, it must be valid
          errors.push(`messages[${index}].content must be a string or array when provided`);
        }
      });
    }

    // Validate optional fields
    if (input.tools && !Array.isArray(input.tools)) {
      errors.push('tools must be an array if provided');
    }

    if (input.context && !Array.isArray(input.context)) {
      errors.push('context must be an array if provided');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Handle validation errors with appropriate response format
   */
  private handleValidationError(
    res: express.Response,
    errors: string[],
    threadId?: string,
    runId?: string
  ): void {
    this.logger.warn('Input validation failed', {
      errors,
      threadId,
      runId,
    });

    // Log validation error for audit
    if (threadId && runId) {
      this.auditLogger?.logValidationError(threadId, runId, errors);
    }

    const errorResponse: RunErrorEvent = {
      type: EventType.RUN_ERROR,
      message: `Input validation failed: ${errors.join(', ')}`,
      code: 'VALIDATION_ERROR',
      timestamp: Date.now(),
    };

    if (!res.headersSent) {
      res.status(400).json(errorResponse);
    } else {
      res.write(`data: ${JSON.stringify(errorResponse)}\n\n`);
      res.end();
    }
  }

  /**
   * Generate interactive HTML viewer for LLM request/response logs
   */
  private generateDebugHTML(logData: any): string {
    const title = logData
      ? `LLM Debug Viewer - ${logData.runId || 'Unknown Run'}`
      : 'LLM Debug Viewer - No Data';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
        }

        .header {
            background: white;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }

        .header h1 {
            color: #333;
            margin-bottom: 20px;
            font-size: 2rem;
        }

        .metadata {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .metadata-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }

        .metadata-label {
            font-size: 0.85rem;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
        }

        .metadata-value {
            font-size: 1.1rem;
            color: #333;
            font-weight: 600;
        }

        .iteration-container {
            margin-bottom: 20px;
        }

        .iteration-header {
            background: white;
            padding: 20px;
            border-radius: 12px 12px 0 0;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }

        .iteration-header:hover {
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }

        .iteration-header.collapsed {
            border-radius: 12px;
            margin-bottom: 20px;
        }

        .iteration-title {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .iteration-number {
            font-size: 1.3rem;
            font-weight: 700;
            color: #333;
        }

        .iteration-stats {
            display: flex;
            gap: 20px;
            margin-top: 10px;
            flex-wrap: wrap;
        }

        .stat-badge {
            background: #f0f0f0;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.9rem;
            color: #555;
        }

        .stat-badge.duration {
            background: #e8f5e9;
            color: #2e7d32;
        }

        .stat-badge.tools {
            background: #fff3e0;
            color: #ef6c00;
        }

        .iteration-content {
            background: #f8f9fa;
            border-radius: 0 0 12px 12px;
            overflow: hidden;
            transition: max-height 0.5s ease;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }

        .iteration-content.collapsed {
            max-height: 0;
        }

        .section {
            padding: 20px;
            border-bottom: 1px solid #e0e0e0;
        }

        .section:last-child {
            border-bottom: none;
        }

        .section-title {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 15px;
            color: #444;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .section-icon {
            width: 24px;
            height: 24px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: #667eea;
            color: white;
            border-radius: 50%;
            font-size: 0.8rem;
        }

        .code-block {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.9rem;
            line-height: 1.5;
            max-height: 500px;
            overflow-y: auto;
        }

        .json-viewer {
            white-space: pre-wrap;
            word-wrap: break-word;
        }

        .message-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 10px;
            border-left: 3px solid #667eea;
        }

        .message-role {
            font-weight: 600;
            color: #667eea;
            margin-bottom: 10px;
            text-transform: uppercase;
            font-size: 0.85rem;
            letter-spacing: 1px;
        }

        .tool-execution {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 10px;
            border-left: 3px solid #ff9800;
        }

        .tool-name {
            font-weight: 600;
            color: #ff9800;
            margin-bottom: 10px;
        }

        .tool-status {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.85rem;
            margin-left: 10px;
        }

        .tool-status.success {
            background: #4caf50;
            color: white;
        }

        .tool-status.error {
            background: #f44336;
            color: white;
        }

        .expand-icon {
            transition: transform 0.3s ease;
            display: inline-block;
        }

        .collapsed .expand-icon {
            transform: rotate(-90deg);
        }

        .no-data {
            background: white;
            padding: 60px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }

        .no-data-icon {
            font-size: 4rem;
            margin-bottom: 20px;
        }

        .no-data-text {
            font-size: 1.2rem;
            color: #666;
            margin-bottom: 10px;
        }

        .no-data-hint {
            color: #999;
            font-size: 0.95rem;
        }

        .json-toggle {
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: background 0.3s ease;
        }

        .json-toggle:hover {
            background: #5a67d8;
        }

        @media (max-width: 768px) {
            .metadata {
                grid-template-columns: 1fr;
            }

            .iteration-stats {
                flex-direction: column;
                gap: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        ${logData ? this.generateLogContent(logData) : this.generateNoDataContent()}
    </div>

    <script>
        function toggleIteration(iterationNum) {
            const header = document.getElementById('iteration-header-' + iterationNum);
            const content = document.getElementById('iteration-content-' + iterationNum);

            header.classList.toggle('collapsed');
            content.classList.toggle('collapsed');
        }

        function formatJSON(elementId) {
            const element = document.getElementById(elementId);
            const data = element.getAttribute('data-json');
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    element.textContent = JSON.stringify(parsed, null, 2);
                } catch (e) {
                    console.error('Failed to parse JSON:', e);
                }
            }
        }

        // Format all JSON blocks on load
        document.addEventListener('DOMContentLoaded', function() {
            document.querySelectorAll('.json-viewer').forEach(element => {
                if (element.id) {
                    formatJSON(element.id);
                }
            });
        });
    </script>
</body>
</html>`;
  }

  /**
   * Generate the main content for log data
   */
  private generateLogContent(logData: any): string {
    const totalDuration = logData.totalMetrics?.totalDuration || 0;
    const formattedDuration =
      totalDuration > 1000 ? `${(totalDuration / 1000).toFixed(2)}s` : `${totalDuration}ms`;

    return `
        <div class="header">
            <h1>🔍 LLM Request/Response Debug Viewer</h1>
            <div class="metadata">
                <div class="metadata-item">
                    <div class="metadata-label">Run ID</div>
                    <div class="metadata-value">${logData.runId || 'N/A'}</div>
                </div>
                <div class="metadata-item">
                    <div class="metadata-label">Thread ID</div>
                    <div class="metadata-value">${logData.threadId || 'N/A'}</div>
                </div>
                <div class="metadata-item">
                    <div class="metadata-label">Timestamp</div>
                    <div class="metadata-value">${new Date(
                      logData.timestamp
                    ).toLocaleString()}</div>
                </div>
                <div class="metadata-item">
                    <div class="metadata-label">Total Duration</div>
                    <div class="metadata-value">${formattedDuration}</div>
                </div>
                <div class="metadata-item">
                    <div class="metadata-label">Total Iterations</div>
                    <div class="metadata-value">${logData.totalMetrics?.totalIterations || 0}</div>
                </div>
                <div class="metadata-item">
                    <div class="metadata-label">Total Tool Calls</div>
                    <div class="metadata-value">${logData.totalMetrics?.totalToolCalls || 0}</div>
                </div>
            </div>
        </div>

        ${(logData.iterations || [])
          .map((iteration: any, index: number) => this.generateIterationHTML(iteration, index))
          .join('')}

        ${
          logData.errors && logData.errors.length > 0 ? this.generateErrorsHTML(logData.errors) : ''
        }
    `;
  }

  /**
   * Generate HTML for a single iteration
   */
  private generateIterationHTML(iteration: any, index: number): string {
    const duration = iteration.duration || 0;
    const formattedDuration =
      duration > 1000 ? `${(duration / 1000).toFixed(2)}s` : `${duration}ms`;

    const toolCount = iteration.toolExecutions?.length || 0;

    return `
        <div class="iteration-container">
            <div class="iteration-header ${index > 0 ? 'collapsed' : ''}"
                 id="iteration-header-${index}"
                 onclick="toggleIteration(${index})">
                <div class="iteration-title">
                    <div class="iteration-number">
                        <span class="expand-icon">▼</span> Iteration ${iteration.iterationNumber}
                    </div>
                    <button class="json-toggle" onclick="window.open('/debug/json', '_blank'); event.stopPropagation();">
                        View Raw JSON
                    </button>
                </div>
                <div class="iteration-stats">
                    <span class="stat-badge duration">⏱️ ${formattedDuration}</span>
                    <span class="stat-badge tools">🔧 ${toolCount} tool${
      toolCount !== 1 ? 's' : ''
    }</span>
                    <span class="stat-badge">📝 ${
                      iteration.request?.messages?.length || 0
                    } messages</span>
                </div>
            </div>

            <div class="iteration-content ${index > 0 ? 'collapsed' : ''}"
                 id="iteration-content-${index}">

                <!-- Request Section -->
                <div class="section">
                    <div class="section-title">
                        <span class="section-icon">📤</span>
                        Request Parameters
                    </div>
                    <div class="code-block">
                        <div class="json-viewer" id="request-${index}"
                             data-json='${JSON.stringify({
                               modelId: iteration.request?.modelId,
                               temperature: iteration.request?.inferenceConfig?.temperature,
                               maxTokens: iteration.request?.inferenceConfig?.maxTokens,
                               timestamp: iteration.request?.timestamp,
                               hasTools: !!iteration.request?.toolConfig,
                               toolCount: iteration.request?.toolConfig?.tools?.length || 0,
                             })}'></div>
                    </div>
                </div>

                <!-- Messages Section -->
                <div class="section">
                    <div class="section-title">
                        <span class="section-icon">💬</span>
                        Conversation Messages
                    </div>
                    ${this.generateMessagesHTML(iteration.request?.messages || [])}
                </div>

                <!-- Response Section -->
                <div class="section">
                    <div class="section-title">
                        <span class="section-icon">📥</span>
                        Response
                    </div>
                    <div class="code-block">
                        <div class="json-viewer" id="response-${index}"
                             data-json='${JSON.stringify(iteration.response)}'></div>
                    </div>
                </div>

                <!-- Tool Executions Section -->
                ${
                  toolCount > 0
                    ? `
                <div class="section">
                    <div class="section-title">
                        <span class="section-icon">🔧</span>
                        Tool Executions
                    </div>
                    ${this.generateToolExecutionsHTML(iteration.toolExecutions || [])}
                </div>
                `
                    : ''
                }
            </div>
        </div>
    `;
  }

  /**
   * Generate HTML for messages
   */
  private generateMessagesHTML(messages: any[]): string {
    return messages
      .map(
        (msg) => `
        <div class="message-item">
            <div class="message-role">${msg.role}</div>
            <div class="code-block">
                <div class="json-viewer">${this.escapeHtml(
                  JSON.stringify(msg.content, null, 2)
                )}</div>
            </div>
        </div>
    `
      )
      .join('');
  }

  /**
   * Generate HTML for tool executions
   */
  private generateToolExecutionsHTML(tools: any[]): string {
    return tools
      .map(
        (tool) => `
        <div class="tool-execution">
            <div class="tool-name">
                ${tool.toolName}
                <span class="tool-status ${tool.success ? 'success' : 'error'}">
                    ${tool.success ? 'SUCCESS' : 'ERROR'}
                </span>
            </div>
            <div class="code-block">
                <div class="json-viewer">${this.escapeHtml(
                  JSON.stringify(
                    {
                      parameters: tool.parameters,
                      result: tool.result,
                      duration: tool.duration,
                      timestamp: tool.timestamp,
                    },
                    null,
                    2
                  )
                )}</div>
            </div>
        </div>
    `
      )
      .join('');
  }

  /**
   * Generate HTML for errors
   */
  private generateErrorsHTML(errors: any[]): string {
    return `
        <div class="iteration-container">
            <div class="iteration-header collapsed" onclick="toggleIteration('errors')">
                <div class="iteration-title">
                    <div class="iteration-number">
                        <span class="expand-icon">▼</span> ⚠️ Errors (${errors.length})
                    </div>
                </div>
            </div>
            <div class="iteration-content collapsed" id="iteration-content-errors">
                <div class="section">
                    ${errors
                      .map(
                        (error) => `
                        <div class="tool-execution">
                            <div class="tool-name">
                                Error at ${new Date(error.timestamp).toLocaleString()}
                            </div>
                            <div class="code-block">
                                <div class="json-viewer">${this.escapeHtml(
                                  JSON.stringify(error.error, null, 2)
                                )}</div>
                            </div>
                        </div>
                    `
                      )
                      .join('')}
                </div>
            </div>
        </div>
    `;
  }

  /**
   * Generate content when no data is available
   */
  private generateNoDataContent(): string {
    return `
        <div class="no-data">
            <div class="no-data-icon">📭</div>
            <div class="no-data-text">No Log Data Available</div>
            <div class="no-data-hint">
                Run an agent request first to generate logs.<br>
                Logs will appear here after the first LLM interaction.
            </div>
        </div>
    `;
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
