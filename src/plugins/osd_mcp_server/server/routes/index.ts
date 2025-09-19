/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter, Logger } from '../../../../core/server';
import { UpdateQueryTool } from '../tools/explore/update_query_tool';
import { UpdateQueryDirectTool } from '../tools/explore/update_query_direct_tool';
import { RunQueryTool } from '../tools/explore/run_query_tool';
import { GetQueryStateTool } from '../tools/explore/get_query_state_tool';
import { ExpandDocumentTool } from '../tools/explore/expand_document_tool';
import { GenerateAndRunQueryTool } from '../tools/explore/generate_and_run_query_tool';
import { GenerateAndRunQueryToolV2 } from '../tools/explore/generate_and_run_query_tool_v2';
import { registerReduxBridgeRoutes } from './redux_bridge';
import { MCPSSEHandler } from '../mcp_sse_handler';
import { MCPServer } from '../mcp_server';

import { getPendingCommandsArray } from './redux_bridge';

export function defineRoutes(router: IRouter, logger: Logger) {
  // Initialize tool instances
  const updateQueryTool = new UpdateQueryTool(logger);
  const updateQueryDirectTool = new UpdateQueryDirectTool(logger, getPendingCommandsArray);
  const runQueryTool = new RunQueryTool(logger);
  const getQueryStateTool = new GetQueryStateTool(logger);
  const expandDocumentTool = new ExpandDocumentTool(logger);
  const generateQueryTool = new GenerateAndRunQueryTool(logger);
  const generateQueryToolV2 = new GenerateAndRunQueryToolV2(
    logger,
    updateQueryTool,
    runQueryTool,
    getPendingCommandsArray()
  );
  logger.debug('Setting up MCP server routes');

  // Initialize MCP server and SSE handler
  const mcpServer = new MCPServer(logger);
  const sseHandler = new MCPSSEHandler(mcpServer, logger);

  // Register Redux bridge routes for MCP client communication
  logger.info('🔗 Registering Redux bridge routes...');
  registerReduxBridgeRoutes(router);

  // MCP SSE endpoint for AI-Agents connection
  router.get(
    {
      path: '/api/osd-mcp-server/mcp-sse',
      validate: false,
    },
    async (context, request, response) => {
      logger.info('🔌 MCP SSE connection requested from AI-Agents');
      return await sseHandler.handleSSEConnection(request, response);
    }
  );

  // MCP protocol endpoint for AI-Agents tool calls
  router.post(
    {
      path: '/api/osd-mcp-server/mcp',
      validate: {
        body: schema.object({
          method: schema.string(),
          params: schema.maybe(schema.any()),
          id: schema.maybe(schema.oneOf([schema.string(), schema.number()])),
        }),
      },
    },
    async (context, request, response) => {
      const { method, params, id } = request.body;

      logger.info(`🔧 MCP protocol call: ${method}`, { params, id });

      try {
        if (method === 'tools/call') {
          const { name, arguments: args } = params;
          logger.info(`🛠️ MCP Tool called via protocol: ${name}`, args);

          let result;
          switch (name) {
            case 'generate_and_run_query':
            case 'generate_query':
              logger.info('🤖 Executing generate_and_run_query_tool_v2 via MCP protocol');
              result = await generateQueryToolV2.execute(args || {});
              break;
            case 'update_query_direct':
              logger.info('🎯 Executing update_query_direct_tool via MCP protocol');
              result = await updateQueryDirectTool.execute(args || {});
              break;
            case 'update_query':
              result = await updateQueryTool.execute(args || {});
              break;
            case 'run_query':
              result = await runQueryTool.execute(args || {});
              break;
            case 'get_query_state':
              result = await getQueryStateTool.execute(args || {});
              break;
            case 'expand_document':
              result = await expandDocumentTool.execute(args || {});
              break;
            default:
              return response.badRequest({
                body: `Unknown tool: ${name}`,
              });
          }

          logger.info(`✅ MCP Tool ${name} completed successfully`);
          return response.ok({
            body: {
              result,
              id,
            },
          });
        } else if (method === 'tools/list') {
          logger.info('📋 MCP Tools list requested');
          return response.ok({
            body: {
              result: {
                tools: [
                  {
                    name: 'generate_and_run_query',
                    description: generateQueryToolV2.description,
                    inputSchema: generateQueryToolV2.inputSchema,
                  },
                  {
                    name: 'update_query_direct',
                    description: updateQueryDirectTool.description,
                    inputSchema: updateQueryDirectTool.inputSchema,
                  },
                  {
                    name: 'update_query',
                    description: updateQueryTool.description,
                    inputSchema: updateQueryTool.inputSchema,
                  },
                  {
                    name: 'run_query',
                    description: runQueryTool.description,
                    inputSchema: runQueryTool.inputSchema,
                  },
                  {
                    name: 'get_query_state',
                    description: getQueryStateTool.description,
                    inputSchema: getQueryStateTool.inputSchema,
                  },
                  {
                    name: 'expand_document',
                    description: expandDocumentTool.description,
                    inputSchema: expandDocumentTool.inputSchema,
                  },
                ],
              },
              id,
            },
          });
        } else {
          return response.badRequest({
            body: `Unknown method: ${method}`,
          });
        }
      } catch (error) {
        logger.error(`❌ MCP protocol error for ${method}:`, error);
        return response.customError({
          statusCode: 500,
          body: `Internal error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }
  );

  // Health check endpoint
  router.get(
    {
      path: '/api/osd-mcp-server/health',
      validate: false,
    },
    async (context, request, response) => {
      return response.ok({
        body: {
          status: 'ok',
          timestamp: new Date().toISOString(),
          message: 'Integrated MCP Server plugin is running',
        },
      });
    }
  );

  // MCP server status endpoint
  router.get(
    {
      path: '/api/osd-mcp-server/status',
      validate: false,
    },
    async (context, request, response) => {
      return response.ok({
        body: {
          enabled: true,
          mode: 'integrated',
          message: 'MCP Server is running as integrated plugin',
          tools: [
            'update_query',
            'update_query_direct',
            'run_query',
            'get_query_state',
            'expand_document',
            'generate_query',
          ],
        },
      });
    }
  );

  // MCP tools endpoint - handles MCP tool calls
  router.post(
    {
      path: '/api/osd-mcp-server/tools/call',
      validate: {
        body: schema.object({
          name: schema.string(),
          arguments: schema.maybe(schema.any()),
        }),
      },
    },
    async (context, request, response) => {
      const { name, arguments: args } = request.body;

      logger.info(`MCP Tool called: ${name}`, args);

      try {
        let result;

        // For client-side tools that need Redux access, provide helpful guidance
        if (['update_query', 'run_query', 'get_query_state'].includes(name)) {
          // These tools need client-side Redux access
          result = {
            success: false,
            message:
              'This tool requires direct access to the Redux store which is only available on the client side.',
            error: 'CLIENT_SIDE_EXECUTION_REQUIRED',
            toolName: name,
            arguments: args,
            timestamp: new Date().toISOString(),
            action: `${name}_requires_client_execution`,
            guidance: {
              issue:
                'The integrated MCP server runs on the server side but needs client-side Redux store access',
              solution:
                'This tool should work when you are on the Explore page, but there may be a setup issue',
              debugging: {
                step1: 'Open browser console and check if window.mcpClientAPI exists',
                step2: 'Check if window.exploreServices exists',
                step3: 'Verify you are on the Explore page (not just the chat)',
                step4: 'Try refreshing the Explore page',
              },
              technicalNote:
                'The mcpClientAPI should be automatically set up when the Explore page loads, but TypeScript errors may be preventing this.',
            },
            note:
              'You appear to be on the Explore page based on the context, but the client-side API is not accessible from the server-side route.',
          };
        } else {
          // Server-side tools that don't need Redux
          switch (name) {
            case 'expand_document':
              result = await expandDocumentTool.execute(args || {});
              break;

            case 'generate_query':
              result = await generateQueryToolV2.execute(args || {});
              break;

            case 'update_query_direct':
              result = await updateQueryDirectTool.execute(args || {});
              break;

            default:
              return response.badRequest({
                body: `Unknown tool: ${name}`,
              });
          }
        }

        logger.info(`MCP Tool ${name} completed`);

        return response.ok({
          body: result,
        });
      } catch (error) {
        logger.error(`MCP Tool ${name} failed:`, error);
        return response.customError({
          statusCode: 500,
          body: `Tool execution failed: ${error.message}`,
        });
      }
    }
  );

  // List available tools
  router.get(
    {
      path: '/api/osd-mcp-server/tools',
      validate: false,
    },
    async (context, request, response) => {
      return response.ok({
        body: {
          tools: [
            {
              name: 'update_query',
              description: 'Update the query text in OpenSearch Dashboards Explore interface',
              inputSchema: {
                type: 'object',
                properties: {
                  query: {
                    type: 'string',
                    description: 'The new query text to set',
                  },
                  language: {
                    type: 'string',
                    description: 'Query language (PPL, SQL, DQL)',
                    enum: ['PPL', 'SQL', 'DQL'],
                  },
                },
                required: ['query'],
              },
            },
            {
              name: 'update_query_direct',
              description:
                'Generate PPL query from natural language and put it directly in the main query editor (not Generated Query section)',
              inputSchema: {
                type: 'object',
                properties: {
                  question: {
                    type: 'string',
                    description:
                      'Natural language question to convert to PPL query (e.g., "show me HTTP 200 responses")',
                  },
                  executeQuery: {
                    type: 'boolean',
                    description:
                      'Whether to execute the generated query immediately (default: true)',
                    default: true,
                  },
                },
                required: ['question'],
              },
            },
            {
              name: 'run_query',
              description: 'Execute the current query in OpenSearch Dashboards Explore interface',
              inputSchema: {
                type: 'object',
                properties: {
                  query: {
                    type: 'string',
                    description: 'Optional query to run',
                  },
                  waitForResults: {
                    type: 'boolean',
                    description: 'Whether to wait for query results',
                    default: true,
                  },
                },
                required: [],
              },
            },
            {
              name: 'get_query_state',
              description: 'Get the current query state from OpenSearch Dashboards',
              inputSchema: {
                type: 'object',
                properties: {
                  includeResults: {
                    type: 'boolean',
                    description: 'Whether to include query results summary',
                    default: false,
                  },
                },
                required: [],
              },
            },
            {
              name: 'expand_document',
              description: 'Expand a document in the search results',
              inputSchema: {
                type: 'object',
                properties: {
                  documentId: {
                    type: 'string',
                    description: 'The ID of the document to expand',
                  },
                  rowIndex: {
                    type: 'number',
                    description: 'The row index of the document',
                  },
                },
                required: [],
              },
            },
            {
              name: 'generate_query',
              description: 'Generate and execute PPL query from natural language',
              inputSchema: {
                type: 'object',
                properties: {
                  question: {
                    type: 'string',
                    description: 'Natural language question to convert to PPL query and execute',
                  },
                  language: {
                    type: 'string',
                    description: 'Target query language. Defaults to PPL',
                    enum: ['PPL', 'SQL', 'DQL'],
                    default: 'PPL',
                  },
                },
                required: ['question'],
              },
            },
          ],
        },
      });
    }
  );

  // NOTE: Redux bridge endpoints are now registered via registerReduxBridgeRoutes()
  // This includes the /pending-commands endpoint used by the Redux bridge client
}
