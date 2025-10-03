/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-console */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { MCPServerConfig } from '../types/mcp_types';
import { Logger } from '../utils/logger';
import { BaseAGUIConfig } from '../ag_ui/base_ag_ui_adapter';

export class ConfigLoader {
  private static logger = new Logger();

  static async loadMCPConfig(): Promise<Record<string, MCPServerConfig>> {
    const configPath = join(__dirname, '../../configuration/mcp_config.json');

    if (existsSync(configPath)) {
      try {
        const configContent = readFileSync(configPath, 'utf-8');
        const configData = JSON.parse(configContent);
        const mcpConfigs = configData.mcpServers || configData;

        this.logger.info(`📋 Loaded MCP config from ${configPath}`, {
          configPath,
          serverCount: Object.keys(mcpConfigs).length,
        });
        console.log(`📋 Loaded MCP config from ${configPath}`);

        return mcpConfigs;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.warn('Failed to load MCP config, using defaults', { error: errorMessage });
        console.warn('Failed to load MCP config, using defaults');
      }
    } else {
      this.logger.warn(`MCP config file not found at ${configPath}`);
    }

    return this.getDefaultMCPConfig();
  }

  static getDefaultMCPConfig(): Record<string, MCPServerConfig> {
    const defaultConfig = {
      filesystem: {
        type: 'local' as const,
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
      },
    };

    this.logger.info('Using default MCP configuration', defaultConfig);
    return defaultConfig;
  }

  static loadServerConfig(): BaseAGUIConfig {
    return {
      port: parseInt(process.env.AG_UI_PORT || '3001', 10),
      host: process.env.AG_UI_HOST || 'localhost',
      cors: {
        origins: process.env.AG_UI_CORS_ORIGINS?.split(',') || ['*'],
        credentials: process.env.AG_UI_CORS_CREDENTIALS === 'true',
      },
    };
  }
}
