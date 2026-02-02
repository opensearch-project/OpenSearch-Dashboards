/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { BaseMCPClient } from './base_client';
import { MCPServerConfig } from '../types/mcp_types';
import { Logger } from '../utils/logger';

// HTTP MCP Client using SSE transport (for GitHub MCP and similar)
export class HTTPMCPClient extends BaseMCPClient {
  async connect(): Promise<void> {
    if (!this.config.url) {
      throw new Error('URL is required for HTTP MCP client');
    }

    this.logger.info(`Attempting to connect to HTTP MCP server: ${this.serverName}`, {
      url: this.config.url,
    });

    // Create SSE transport with proper options
    const transport = new SSEClientTransport(new URL(this.config.url), {
      requestInit: {
        headers: {
          'User-Agent': 'ai-agent/1.0.0',
          ...this.config.requestInit?.headers,
        },
        ...this.config.requestInit,
      },
    });

    this.client = new Client(
      {
        name: 'ai-agent',
        version: '1.0.0',
      },
      {
        capabilities: { tools: {}, sampling: {} },
      }
    );

    try {
      await this.client.connect(transport);

      // Send initialized notification as per MCP protocol
      await this.client.notification({
        method: 'notifications/initialized',
        params: {},
      });

      await this.loadTools();

      this.logger.info(`Successfully connected to HTTP MCP server: ${this.serverName}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to connect to HTTP MCP server: ${this.serverName}`, {
        error: errorMessage,
      });
      throw error;
    }
  }

  disconnect(): void {
    this.logger.info(`Disconnecting from HTTP MCP server: ${this.serverName}`);

    if (this.client) {
      this.client.close();
      this.client = null;
    }
  }
}
