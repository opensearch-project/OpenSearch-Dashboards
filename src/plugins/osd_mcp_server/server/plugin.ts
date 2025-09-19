/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../core/server';
import { OsdMcpServerPluginSetup, OsdMcpServerPluginStart } from './types';
import { defineRoutes } from './routes';
import { McpServerService } from './services/mcp_server_service';

export class OsdMcpServerPlugin
  implements Plugin<OsdMcpServerPluginSetup, OsdMcpServerPluginStart> {
  private readonly logger: Logger;
  private mcpServerService?: McpServerService;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.info('osd_mcp_server: Setup - Starting MCP Server as integrated plugin');

    const router = core.http.createRouter();

    // Define API routes for MCP server
    defineRoutes(router, this.logger);

    // Initialize and start MCP server service
    this.mcpServerService = new McpServerService(this.logger);
    this.mcpServerService.start();

    return {};
  }

  public start(core: CoreStart) {
    this.logger.info('osd_mcp_server: Started - MCP Server is running as integrated plugin');
    return {};
  }

  public stop() {
    if (this.mcpServerService) {
      this.logger.info('Stopping MCP Server plugin...');
      this.mcpServerService.stop();
    }
  }
}

export { OsdMcpServerPluginSetup, OsdMcpServerPluginStart };
