/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { BaseMCPClient } from './base_client';
import { MCPServerConfig } from '../types/mcp_types';
import { Logger } from '../utils/logger';

// Local MCP Client (stdio communication)
export class LocalMCPClient extends BaseMCPClient {
  async connect(): Promise<void> {
    if (!this.config.command) {
      throw new Error('Command is required for local MCP client');
    }

    this.logger.info(`Attempting to connect to local MCP server: ${this.serverName}`, {
      command: this.config.command,
      args: this.config.args,
      env: this.config.env,
    });

    const transport = new StdioClientTransport({
      command: this.config.command,
      args: this.config.args || [],
      env: Object.fromEntries(
        Object.entries({ ...process.env, ...this.config.env }).filter(
          (entry): entry is [string, string] => entry[1] !== undefined
        )
      ),
    });

    this.client = new Client(
      {
        name: 'ai-agent',
        version: '1.0.0',
      },
      {
        capabilities: { sampling: {} },
      }
    );

    await this.client.connect(transport);
    await this.loadTools();

    this.logger.info(`Successfully connected to local MCP server: ${this.serverName}`);
  }

  disconnect(): void {
    this.logger.info(`Disconnecting from local MCP server: ${this.serverName}`);

    if (this.client) {
      this.client.close();
      this.client = null;
    }
  }
}
