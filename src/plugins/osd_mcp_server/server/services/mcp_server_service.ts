/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from '../../../../core/server';

export class McpServerService {
  private logger: Logger;
  private isRunning = false;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  public start(): void {
    if (this.isRunning) {
      this.logger.warn('MCP Server is already running');
      return;
    }

    this.logger.info('Starting integrated MCP Server service...');

    try {
      // This is the integrated MCP server - it runs directly within OpenSearch Dashboards
      // No need to spawn external processes

      this.isRunning = true;
      this.logger.info('Integrated MCP Server started successfully');
    } catch (error) {
      this.logger.error(`Failed to start MCP Server: ${error}`);
      this.isRunning = false;
    }
  }

  public stop(): void {
    if (!this.isRunning) {
      this.logger.debug('MCP Server is not running');
      return;
    }

    this.logger.info('Stopping integrated MCP Server service...');

    this.isRunning = false;
    this.logger.info('Integrated MCP Server stopped successfully');
  }

  public getStatus(): { running: boolean } {
    return {
      running: this.isRunning,
    };
  }
}
