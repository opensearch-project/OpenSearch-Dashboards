/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-console */

import { IRouter } from '../../../../core/server';

// In-memory store for pending MCP commands
const pendingCommands: any[] = [];

/**
 * Redux Bridge Routes - Allows MCP server to communicate with browser Redux store
 *
 * These routes execute Redux actions by accessing the global services exposed by the Explore plugin.
 * The global services are made available at `global.exploreServices` when the Explore page is active.
 */
export function registerReduxBridgeRoutes(router: IRouter) {
  // New endpoint: Get pending MCP commands for browser polling
  router.get(
    {
      path: '/api/osd-mcp-server/pending-commands',
      validate: {},
    },
    async (context, request, response) => {
      try {
        // Return and clear pending commands
        const commands = [...pendingCommands];
        pendingCommands.length = 0; // Clear the array

        console.log(`📨 Pending Commands: Returning ${commands.length} commands to browser`);
        if (commands.length > 0) {
          console.log(`📨 Commands being returned:`, JSON.stringify(commands, null, 2));
        }

        return response.ok({
          body: commands,
        });
      } catch (error) {
        console.error('❌ Error getting pending commands:', error);
        return response.customError({
          statusCode: 500,
          body: {
            message: 'Failed to get pending commands',
          },
        });
      }
    }
  );

  // Helper function to add command to pending queue
  function addPendingCommand(command: any) {
    const commandWithId = {
      ...command,
      id: Date.now(),
      timestamp: new Date().toISOString(),
    };
    pendingCommands.push(commandWithId);
    console.log(`📥 Added command to pending queue. Total pending: ${pendingCommands.length}`);
    console.log(`📥 Command details:`, JSON.stringify(commandWithId, null, 2));
  }
  // Get current Redux state
  router.get(
    {
      path: '/api/osd-mcp-server/redux/state',
      validate: false,
    },
    async (context, request, response) => {
      try {
        console.log('🎯 SERVER ROUTE HIT: /api/osd-mcp-server/redux/state');

        // Add command to pending queue for client-side execution
        const command = {
          action: 'execute_direct_redux',
          type: 'get_state',
          payload: { includeResults: false },
          timestamp: new Date().toISOString(),
        };
        addPendingCommand(command);

        // Return the same response format that the standalone server expected
        const responseBody = {
          success: true,
          message: 'Query state retrieved successfully via HTTP bridge',
          queryState: {
            query: 'current_query', // Will be updated by client
            language: 'PPL',
            dataset: {
              id: 'sample_logs',
              title: 'opensearch_dashboards_sample_data_logs',
              type: 'index-pattern',
            },
          },
          uiState: {
            activeTabId: 'explore',
          },
          queryEditor: {
            dateRange: { from: 'now-15d', to: 'now' },
            queryStatus: 'idle',
          },
          includeResults: false,
          timestamp: new Date().toISOString(),
          action: 'query_state_retrieved_via_bridge',
          bridgeResponse: {
            success: true,
            message: 'Redux state retrieval queued for client-side processing',
            executionMethod: 'polling_queue',
          },
          note: 'State retrieval queued for processing when client polls for pending commands',
        };

        console.log('📤 Server response (standalone-compatible):', responseBody);

        return response.ok({
          body: responseBody,
        });
      } catch (error) {
        return response.customError({
          statusCode: 500,
          body: {
            message: `Error accessing Redux state: ${error.message}`,
          },
        });
      }
    }
  );

  // Update query via Redux
  router.post(
    {
      path: '/api/osd-mcp-server/redux/update-query',
      validate: {
        body: (value, { ok, badRequest }) => {
          if (typeof value === 'object' && value !== null) {
            const body = value as any;
            if (typeof body.query === 'string') {
              return ok(body);
            }
          }
          return badRequest('Invalid request body');
        },
      },
    },
    async (context, request, response) => {
      try {
        const { query, language = 'PPL' } = request.body as any;

        console.log('🎯 SERVER ROUTE HIT: /api/osd-mcp-server/redux/update-query');
        console.log('📥 Request body:', { query, language });

        // Add command to pending queue for client-side execution
        const command = {
          action: 'execute_direct_redux',
          type: 'update_query',
          payload: { query, language },
          timestamp: new Date().toISOString(),
        };
        addPendingCommand(command);

        // Return the same response format that the standalone server expected
        const responseBody = {
          success: true,
          message: `Query updated successfully via HTTP bridge`,
          updatedQuery: query,
          language,
          previousQuery: 'current_query', // Will be updated by client
          previousLanguage: 'PPL',
          timestamp: new Date().toISOString(),
          action: 'query_updated_via_bridge',
          bridgeResponse: {
            success: true,
            message: 'Redux execution queued for client-side processing',
            executionMethod: 'polling_queue',
          },
          note: 'Query update queued for execution when client polls for pending commands',
        };

        console.log('📤 Server response (standalone-compatible):', responseBody);

        return response.ok({
          body: responseBody,
        });
      } catch (error) {
        return response.customError({
          statusCode: 500,
          body: {
            message: `Error updating query: ${error.message}`,
          },
        });
      }
    }
  );

  // Execute query via Redux
  router.post(
    {
      path: '/api/osd-mcp-server/redux/execute-query',
      validate: {
        body: (value, { ok }) => {
          return ok(value || {});
        },
      },
    },
    async (context, request, response) => {
      try {
        const { query, waitForResults = true } = request.body as any;

        console.log('🎯 SERVER ROUTE HIT: /api/osd-mcp-server/redux/execute-query');
        console.log('📥 Request body:', { query, waitForResults });

        // Add command to pending queue for client-side execution
        const command = {
          action: 'execute_direct_redux',
          type: 'execute_query',
          payload: { query, waitForResults },
          timestamp: new Date().toISOString(),
        };
        addPendingCommand(command);

        // Return the same response format that the standalone server expected
        const responseBody = {
          success: true,
          message: query
            ? `Query "${query}" executed successfully via HTTP bridge`
            : 'Current query executed successfully via HTTP bridge',
          executedQuery: query || 'current_query',
          language: 'PPL', // Will be updated by client
          dataset: 'opensearch_dashboards_sample_data_logs',
          resultCount: 0, // Will be updated by client
          hasResults: false, // Will be updated by client
          resultCacheKeys: 0,
          queryStatus: 'queued',
          waitForResults,
          timestamp: new Date().toISOString(),
          action: 'query_executed_via_bridge',
          bridgeResponse: {
            success: true,
            message: 'Redux execution queued for client-side processing',
            executionMethod: 'polling_queue',
          },
          note: 'Query execution queued for processing when client polls for pending commands',
        };

        console.log('📤 Server response (standalone-compatible):', responseBody);

        return response.ok({
          body: responseBody,
        });
      } catch (error) {
        return response.customError({
          statusCode: 500,
          body: {
            message: `Error executing query: ${error.message}`,
          },
        });
      }
    }
  );

  // Call Agent via Redux (using callAgentActionCreator)
  router.post(
    {
      path: '/api/osd-mcp-server/redux/call-agent',
      validate: {
        body: (value, { ok, badRequest }) => {
          if (typeof value === 'object' && value !== null) {
            const body = value as any;
            if (typeof body.question === 'string') {
              return ok(body);
            }
          }
          return badRequest('Invalid request body - question is required');
        },
      },
    },
    async (context, request, response) => {
      try {
        const { question, language = 'PPL' } = request.body as any;

        console.log('🎯 SERVER ROUTE HIT: /api/osd-mcp-server/redux/call-agent');
        console.log('📥 Request body:', { question, language });
        console.log('🔧 Returning callAgentActionCreator execution instructions...');
        console.log('⏰ Timestamp:', new Date().toISOString());
        console.log('🌐 Request headers:', {
          'content-type': request.headers['content-type'],
          'osd-xsrf': request.headers['osd-xsrf'],
        });

        // Return Redux execution instructions for callAgentActionCreator
        const responseBody = {
          action: 'execute_call_agent',
          type: 'call_agent',
          payload: { question, language },
          timestamp: new Date().toISOString(),
          message:
            'callAgentActionCreator execution - query will be generated and executed via AI mode',
          directExecution: {
            method: 'callAgentActionCreator',
            params: { question, language },
            description:
              'Execute callAgentActionCreator directly in browser context (same as AI mode)',
          },
        };

        // Add to pending commands queue for polling
        addPendingCommand(responseBody);

        console.log('📤 Server response:', responseBody);

        return response.ok({
          body: responseBody,
        });
      } catch (error) {
        return response.customError({
          statusCode: 500,
          body: {
            message: `Error calling agent: ${error.message}`,
          },
        });
      }
    }
  );
}
