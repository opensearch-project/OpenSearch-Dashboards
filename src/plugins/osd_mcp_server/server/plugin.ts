/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import {
  CoreSetup,
  CoreStart,
  Plugin,
  PluginInitializerContext,
  Logger,
} from '../../../../core/server';
import { MCPServer } from './mcp_server';
import { MCPSSEHandler } from './mcp_sse_handler';
import { OsdMcpServerConfig } from '../config';
import { registerReduxBridgeRoutes } from './routes/redux_bridge';

export interface OsdMcpServerPluginSetup {}
export interface OsdMcpServerPluginStart {}

export interface OsdMcpServerPluginSetupDeps {}
export interface OsdMcpServerPluginStartDeps {}

export class OsdMcpServerPlugin
  implements
    Plugin<
      OsdMcpServerPluginSetup,
      OsdMcpServerPluginStart,
      OsdMcpServerPluginSetupDeps,
      OsdMcpServerPluginStartDeps
    > {
  private readonly logger: Logger;
  private readonly config: OsdMcpServerConfig;
  private mcpServer?: MCPServer;
  private sseHandler?: MCPSSEHandler;
  private stdioProcess?: ChildProcess;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
    // Use default config values since config schema might not be available
    this.config = {
      enabled: true,
      stdio: {
        enabled: true,
        autoStart: false, // Default to false for safety
      },
    };

    // Try to get config if available
    try {
      if (initializerContext.config && typeof initializerContext.config.get === 'function') {
        this.config = initializerContext.config.get<OsdMcpServerConfig>();
      }
    } catch (error) {
      this.logger.warn('Could not load config, using defaults:', error);
    }
  }

  public setup(core: CoreSetup): OsdMcpServerPluginSetup {
    this.logger.info('OSD MCP Server plugin: Setup');

    // Initialize MCP Server
    this.mcpServer = new MCPServer(this.logger);
    this.sseHandler = new MCPSSEHandler(this.mcpServer, this.logger);

    // Register HTTP routes for MCP protocol
    const router = core.http.createRouter();

    // MCP Server-Sent Events endpoint (required for AG-UI HTTP MCP client)
    router.get(
      {
        path: '/api/osd-mcp',
        validate: false,
        options: { authRequired: false },
      },
      async (context: any, request: any, response: any) => {
        try {
          this.logger.info('MCP SSE endpoint accessed');

          // Handle CORS preflight requests
          if (request.headers['access-control-request-method']) {
            this.logger.info('Handling CORS preflight request');
            return response.ok({
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Accept, osd-xsrf',
                'Access-Control-Max-Age': '86400',
              },
              body: '',
            });
          }

          // Try a different approach - return a custom response that bypasses OSD's response handling
          const rawResponse = request.raw.res;

          // Set SSE headers directly on the raw response
          rawResponse.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control, Content-Type, osd-xsrf',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          });

          // Send initial SSE message
          rawResponse.write(': MCP SSE connection established\n\n');

          // Send MCP server info
          const serverInfo = {
            jsonrpc: '2.0',
            method: 'notifications/initialized',
            params: {
              protocolVersion: '2024-11-05',
              capabilities: { tools: {} },
              serverInfo: { name: 'osd-mcp-server', version: '1.0.0' },
            },
          };
          rawResponse.write(`data: ${JSON.stringify(serverInfo)}\n\n`);

          // Keep connection alive
          const heartbeat = setInterval(() => {
            try {
              rawResponse.write(': heartbeat\n\n');
            } catch (e) {
              clearInterval(heartbeat);
            }
          }, 30000);

          // Handle disconnect
          request.raw.req.on('close', () => {
            this.logger.info('MCP SSE client disconnected');
            clearInterval(heartbeat);
          });

          // Return a response that doesn't interfere with our raw response
          return response.custom({
            statusCode: 200,
            headers: {},
            body: '',
          });
        } catch (error) {
          this.logger.error('Error in MCP SSE endpoint:', error);
          return response.internalError({
            body: { error: 'Failed to establish SSE connection' },
          });
        }
      }
    );

    // MCP POST endpoint for client requests (required for AG-UI HTTP MCP client)
    router.post(
      {
        path: '/api/osd-mcp',
        validate: {
          body: (value: any, { ok }: any) => ok(value || {}),
        },
        options: { authRequired: false },
      },
      async (context: any, request: any, response: any) => {
        try {
          this.logger.info('MCP POST request received');

          // Handle MCP request from AG-UI
          const mcpRequest = request.body;
          this.logger.info('MCP request body:', JSON.stringify(mcpRequest, null, 2));
          this.logger.info('MCP request method:', mcpRequest?.method);

          // Process the MCP request
          const mcpResponse = await this.processMCPRequest(mcpRequest);

          return response.ok({
            body: mcpResponse,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Content-Type, osd-xsrf',
            },
          });
        } catch (error) {
          this.logger.error('Error in MCP POST endpoint:', error);
          return response.internalError({
            body: {
              jsonrpc: '2.0',
              error: {
                code: -32603,
                message: 'Internal server error',
              },
            },
          });
        }
      }
    );

    // MCP Server info endpoint (for debugging)
    router.get(
      {
        path: '/api/osd-mcp/info',
        validate: false,
      },
      async (context, request, response) => {
        try {
          const info = this.mcpServer!.getServerInfo();
          return response.ok({
            body: info,
          });
        } catch (error) {
          this.logger.error('Error getting MCP server info:', error);
          return response.internalError({
            body: { error: 'Failed to get server info' },
          });
        }
      }
    );

    // MCP tools list endpoint (for debugging)
    router.get(
      {
        path: '/api/osd-mcp/tools',
        validate: false,
      },
      async (context, request, response) => {
        try {
          const tools = this.mcpServer!.getTools();
          return response.ok({
            body: { tools },
          });
        } catch (error) {
          this.logger.error('Error getting MCP tools:', error);
          return response.internalError({
            body: { error: 'Failed to get tools' },
          });
        }
      }
    );

    // MCP tool execution endpoint (for debugging)
    router.post(
      {
        path: '/api/osd-mcp/tools/{toolName}',
        validate: {
          params: (value: any, { ok, badRequest }: any) => {
            if (typeof value?.toolName === 'string') {
              return ok({ toolName: value.toolName });
            }
            return badRequest('toolName must be a string');
          },
          body: (value: any, { ok }: any) => ok(value || {}),
        },
      },
      async (context: any, request: any, response: any) => {
        try {
          const { toolName } = request.params;
          const input = request.body;

          this.logger.info(`Executing MCP tool: ${toolName}`, { input });

          const result = await this.mcpServer!.executeTool(toolName, input);

          return response.ok({
            body: result,
          });
        } catch (error) {
          this.logger.error(`Error executing MCP tool ${request.params.toolName}:`, error);
          return response.internalError({
            body: {
              error: error instanceof Error ? error.message : 'Tool execution failed',
              toolName: request.params.toolName,
            },
          });
        }
      }
    );

    // Register Redux bridge routes
    registerReduxBridgeRoutes(router);

    this.logger.info('OSD MCP Server HTTP routes registered');

    return {};
  }

  private async processMCPRequest(mcpRequest: any): Promise<any> {
    try {
      this.logger.info('Processing MCP request:', mcpRequest.method);

      switch (mcpRequest.method) {
        case 'initialize':
          return {
            jsonrpc: '2.0',
            id: mcpRequest.id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {},
              },
              serverInfo: {
                name: 'osd-mcp-server',
                version: '1.0.0',
              },
            },
          };

        case 'tools/list':
          const tools = this.mcpServer!.getTools();
          return {
            jsonrpc: '2.0',
            id: mcpRequest.id,
            result: {
              tools,
            },
          };

        case 'tools/call':
          const { name: toolName, arguments: toolArgs } = mcpRequest.params;
          const result = await this.mcpServer!.executeTool(toolName, toolArgs);
          return {
            jsonrpc: '2.0',
            id: mcpRequest.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result),
                },
              ],
            },
          };

        default:
          return {
            jsonrpc: '2.0',
            id: mcpRequest.id,
            error: {
              code: -32601,
              message: `Method not found: ${mcpRequest.method}`,
            },
          };
      }
    } catch (error) {
      this.logger.error('Error processing MCP request:', error);
      return {
        jsonrpc: '2.0',
        id: mcpRequest.id,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal error',
        },
      };
    }
  }

  public start(core: CoreStart): OsdMcpServerPluginStart {
    this.logger.info('OSD MCP Server plugin: Start');

    // Initialize the MCP server with core services
    if (this.mcpServer) {
      this.mcpServer.initialize(core);
    }

    // Auto-start stdio MCP server if configured
    if (this.config.stdio?.enabled && this.config.stdio?.autoStart) {
      this.startStdioServer();
    }

    return {};
  }

  private startStdioServer(): void {
    try {
      this.logger.info('Starting MCP stdio server automatically...');

      // Path to the standalone stdio server
      const stdioServerPath = join(__dirname, '..', 'standalone', 'osd-mcp-stdio.js');

      // Spawn the stdio server process
      this.stdioProcess = spawn('node', [stdioServerPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false,
      });

      // Handle stdio server output
      this.stdioProcess.stdout?.on('data', (data) => {
        this.logger.info(`MCP stdio server: ${data.toString().trim()}`);
      });

      this.stdioProcess.stderr?.on('data', (data) => {
        this.logger.info(`MCP stdio server: ${data.toString().trim()}`);
      });

      // Handle stdio server exit
      this.stdioProcess.on('exit', (code, signal) => {
        if (code !== null) {
          this.logger.info(`MCP stdio server exited with code ${code}`);
        } else if (signal !== null) {
          this.logger.info(`MCP stdio server killed with signal ${signal}`);
        }
        this.stdioProcess = undefined;
      });

      // Handle stdio server errors
      this.stdioProcess.on('error', (error) => {
        this.logger.error('Failed to start MCP stdio server:', error);
        this.stdioProcess = undefined;
      });

      this.logger.info('MCP stdio server started successfully');
      this.logger.info('AG-UI can now connect via SSH bridge to this stdio server');
    } catch (error) {
      this.logger.error('Error starting MCP stdio server:', error);
    }
  }

  public stop() {
    this.logger.info('OSD MCP Server plugin: Stop');

    // Clean up MCP server
    if (this.mcpServer) {
      this.mcpServer.cleanup();
    }

    // Clean up stdio server process
    if (this.stdioProcess) {
      this.logger.info('Stopping MCP stdio server...');
      this.stdioProcess.kill('SIGTERM');
      this.stdioProcess = undefined;
    }
  }
}
