/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreStart, Logger } from '../../../../core/server';
import { UpdateQueryTool } from './tools/explore/update_query_tool';
import { RunQueryTool } from './tools/explore/run_query_tool';
import { ExpandDocumentTool } from './tools/explore/expand_document_tool';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  execute(input: any): Promise<any>;
}

export class MCPServer {
  private logger: Logger;
  private tools: Map<string, MCPTool> = new Map();
  private core?: CoreStart;

  constructor(logger: Logger) {
    this.logger = logger;
    this.initializeTools();
  }

  private initializeTools(): void {
    // Register explore tools
    const updateQueryTool = new UpdateQueryTool(this.logger);
    const runQueryTool = new RunQueryTool(this.logger);
    const expandDocumentTool = new ExpandDocumentTool(this.logger);

    this.tools.set(updateQueryTool.name, updateQueryTool);
    this.tools.set(runQueryTool.name, runQueryTool);
    this.tools.set(expandDocumentTool.name, expandDocumentTool);

    this.logger.info(`Initialized ${this.tools.size} MCP tools`);
  }

  public initialize(core: CoreStart): void {
    this.core = core;

    // Pass core services to tools that need them
    for (const tool of this.tools.values()) {
      if ('initialize' in tool && typeof tool.initialize === 'function') {
        (tool as any).initialize(core);
      }
    }

    this.logger.info('MCP Server initialized with core services');
  }

  public getServerInfo(): any {
    return {
      name: 'OpenSearch Dashboards MCP Server',
      version: '1.0.0',
      protocol: 'mcp',
      capabilities: {
        tools: true,
        resources: false,
        prompts: false,
      },
      description: 'MCP server for OpenSearch Dashboards UI manipulation',
      toolCount: this.tools.size,
    };
  }

  public getTools(): any[] {
    return Array.from(this.tools.values()).map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
  }

  public async executeTool(toolName: string, input: any): Promise<any> {
    const tool = this.tools.get(toolName);

    if (!tool) {
      throw new Error(
        `Tool '${toolName}' not found. Available tools: ${Array.from(this.tools.keys()).join(', ')}`
      );
    }

    this.logger.info(`Executing tool: ${toolName}`, { input });

    try {
      const result = await tool.execute(input);
      this.logger.info(`Tool ${toolName} executed successfully`, { result });
      return result;
    } catch (error) {
      this.logger.error(`Tool ${toolName} execution failed:`, error);
      throw error;
    }
  }

  public cleanup(): void {
    this.logger.info('Cleaning up MCP Server');
    this.tools.clear();
  }
}
