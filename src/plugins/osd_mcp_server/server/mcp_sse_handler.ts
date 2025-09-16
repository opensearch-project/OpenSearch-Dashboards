/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * Copyright OpenSearch Dashboards MCP Server
 * SPDX-License-Identifier: Apache-2.0
 */

import { MCPServer } from './mcp_server';

export class MCPSSEHandler {
  private mcpServer: MCPServer;
  private logger: any;

  constructor(mcpServer: MCPServer, logger: any) {
    this.mcpServer = mcpServer;
    this.logger = logger;
  }

  async handleSSEConnection(request: any, response: any): Promise<any> {
    this.logger.info('MCP SSE connection established');

    try {
      // For AG-UI HTTP MCP client, we need a simple SSE endpoint that just stays alive
      // The actual MCP communication happens via POST requests

      // Set proper SSE headers
      response.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control, Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      });

      // Send initial SSE comment (required for SSE format)
      response.write(': MCP SSE ready\n\n');

      // Keep connection alive with periodic heartbeat
      const heartbeat = setInterval(() => {
        try {
          response.write(': heartbeat\n\n');
        } catch (error) {
          this.logger.info('SSE connection closed');
          clearInterval(heartbeat);
        }
      }, 30000);

      // Handle client disconnect
      request.on('close', () => {
        this.logger.info('MCP SSE client disconnected');
        clearInterval(heartbeat);
      });

      request.on('error', (error: any) => {
        this.logger.error('MCP SSE connection error:', error);
        clearInterval(heartbeat);
      });

      // Keep the connection alive - don't return a resolved promise
      return new Promise(() => {}); // Never resolves
    } catch (error) {
      this.logger.error('Error in MCP SSE handler:', error);
      throw error;
    }
  }
}
