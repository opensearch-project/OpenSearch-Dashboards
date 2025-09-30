#!/usr/bin/env ts-node

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-console */

/**
 * Universal AG UI Server Entry Point
 *
 * This script creates an AG UI protocol compliant HTTP server that exposes
 * any agent functionality through standardized REST API endpoints.
 *
 * Features:
 * - HTTP REST API for AG UI protocol
 * - MCP server integration
 * - Tool calling support
 * - Conversation management
 * - Multi-agent support (jarvis, langgraph, strands)
 */

import * as dotenv from 'dotenv';
import { BaseAGUIAdapter, BaseAGUIConfig } from './ag_ui/base_ag_ui_adapter';
import { LangGraphAGUIAdapter } from './ag_ui/langgraph_ag_ui_adapter';
import { AgentFactory } from './agents/agent_factory';
import { MCPServerConfig } from './types/mcp_types';
import { Logger } from './utils/logger';
import { AGUIAuditLogger } from './utils/ag_ui_audit_logger';
import { ConfigLoader } from './config/config_loader';
import { HTTPServer } from './server/http_server';

// Load environment variables
dotenv.config();

class BaseAGUIServer {
  private adapter: BaseAGUIAdapter;
  private logger: Logger;
  private auditLogger: AGUIAuditLogger;
  private config: BaseAGUIConfig;
  private httpServer: HTTPServer;
  private agentType: string;

  constructor(agentType: string, config: BaseAGUIConfig) {
    this.agentType = agentType;
    this.config = config;
    this.logger = new Logger();

    // Initialize audit logger with optional custom directory
    const auditDir = process.env.AG_UI_AUDIT_LOG_DIR;
    this.auditLogger = new AGUIAuditLogger(auditDir);

    // Create agent and appropriate adapter
    const agent = AgentFactory.createAgent(agentType);

    this.adapter = new BaseAGUIAdapter(agent, config, this.logger, this.auditLogger);
    this.logger.info(`Using BaseAGUIAdapter for ${agentType} agent`);

    this.httpServer = new HTTPServer(config, this.adapter, this.logger, this.auditLogger);
  }

  async initialize(mcpConfigs: Record<string, MCPServerConfig>): Promise<void> {
    this.logger.info(`Initializing ${this.agentType} AG UI Server`);

    // Initialize adapter
    await this.adapter.initialize(mcpConfigs);

    // Setup HTTP server
    this.httpServer.setupMiddleware();
    this.httpServer.setupRoutes();

    this.logger.info(`${this.agentType} AG UI Server initialized`);
  }

  async start(): Promise<void> {
    await this.httpServer.start();
  }

  async stop(): Promise<void> {
    await this.httpServer.stop();
    this.adapter.cleanup();
    this.auditLogger.cleanup();
    this.logger.info(`${this.agentType} AG UI Server stopped`);
  }
}

// Main execution
async function main() {
  const logger = new Logger();

  // Parse CLI arguments for agent selection
  const args = process.argv.slice(2);
  const agentTypeIndex = args.findIndex((arg) => arg === '--agent' || arg === '-a');

  // Get agent type from multiple sources (CLI args, env var, or default)
  const agentType =
    agentTypeIndex !== -1 && args[agentTypeIndex + 1]
      ? args[agentTypeIndex + 1]
      : process.env.AGENT_TYPE ||
        args[0] || // Legacy support for direct agent type as first arg
        AgentFactory.getDefaultAgentType();

  logger.info(`🚀 Starting ${agentType} AG UI Server`);
  console.log(`🚀 Starting ${agentType} AG UI Server...\n`);

  // Load configuration using shared config loader
  const config = ConfigLoader.loadServerConfig();
  const mcpConfigs = await ConfigLoader.loadMCPConfig();

  try {
    const server = new BaseAGUIServer(agentType, config);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully');
      console.log('\n🛑 Shutting down HTTP server...');
      await server.stop();
      process.exit(0);
    });

    await server.initialize(mcpConfigs);
    await server.start();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to start server', { error: errorMessage, agentType });
    console.error('Failed to start server:', errorMessage);

    if (errorMessage.includes('Unknown agent type')) {
      const availableAgents = AgentFactory.getAvailableAgents();
      console.log('\nAvailable agent types:');
      availableAgents.forEach((type, index) => {
        const isDefault = type === AgentFactory.getDefaultAgentType();
        console.log(`  - ${type}${isDefault ? ' (default)' : ''}`);
      });
      console.log('\nUsage:');
      console.log('  npm run start:ag-ui [agent-type]              # Legacy format');
      console.log('  npm run start:ag-ui -- --agent langgraph      # Preferred format');
      console.log('  AGENT_TYPE=langgraph npm run start:ag-ui      # Environment variable');
    }

    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
