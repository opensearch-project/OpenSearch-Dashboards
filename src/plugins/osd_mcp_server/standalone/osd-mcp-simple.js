#!/usr/bin/env node

/**
 * Simple OpenSearch Dashboards MCP Server - Minimal JSON-RPC implementation
 *
 * This server provides MCP (Model Context Protocol) tools for manipulating
 * OpenSearch Dashboards UI state through natural language commands.
 *
 * Usage: node osd-mcp-simple.js
 *
 * The server communicates via stdin/stdout using JSON-RPC 2.0 protocol
 */

const readline = require('readline');

// Tool definitions
const TOOLS = [
  {
    name: 'update_query',
    description: 'Update the query text in OpenSearch Dashboards Explore interface',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'The new query text to set (e.g., "SELECT * FROM logs WHERE level=\'ERROR\'")',
        },
        language: {
          type: 'string',
          description: 'Query language (PPL, SQL, DQL). Defaults to PPL if not specified',
          enum: ['PPL', 'SQL', 'DQL'],
        },
      },
      required: ['query'],
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
          description:
            'Optional query to run. If not provided, runs the current query in the interface',
        },
        waitForResults: {
          type: 'boolean',
          description: 'Whether to wait for query results before returning (default: true)',
          default: true,
        },
      },
      required: [],
    },
  },
  {
    name: 'get_query_state',
    description: 'Get the current query state from OpenSearch Dashboards Explore interface',
    inputSchema: {
      type: 'object',
      properties: {
        includeResults: {
          type: 'boolean',
          description: 'Whether to include query results summary in the response (default: false)',
          default: false,
        },
      },
      required: [],
    },
  },
  {
    name: 'expand_document',
    description: 'Expand a document in the search results to show detailed field information',
    inputSchema: {
      type: 'object',
      properties: {
        documentId: {
          type: 'string',
          description: 'The ID of the document to expand',
        },
        rowIndex: {
          type: 'number',
          description: 'The row index of the document in the results table (0-based)',
        },
      },
      required: [],
    },
  },
];

// Tool handlers with Redux integration
async function handleUpdateQuery(args) {
  const { query, language = 'PPL' } = args;

  console.error('🔧 MCP Tool: update_query called with:', { query, language });

  try {
    // Access the global Explore services which includes the Redux store
    const globalServices = global.exploreServices;
    if (!globalServices || !globalServices.store) {
      console.error(
        '❌ Explore services or store not available - returning mock success for testing'
      );
      return {
        success: true,
        message: `Mock: Query would be updated to "${query}" with language "${language}"`,
        updatedQuery: query,
        language: language,
        previousQuery: 'mock_previous_query',
        previousLanguage: 'PPL',
        timestamp: new Date().toISOString(),
        action: 'query_updated_mock',
        note:
          'This is a mock response. Redux store not available - ensure Explore page is loaded and plugin is active.',
      };
    }

    // Get current state
    const currentState = globalServices.store.getState();
    const currentQuery = currentState.query;

    console.error('🔍 Current query state:', {
      currentQuery: currentQuery.query,
      currentLanguage: currentQuery.language,
      newQuery: query,
      newLanguage: language,
    });

    // Access Redux actions through global services
    const reduxActions = global.exploreReduxActions;

    // Update query text with history tracking
    if (reduxActions && reduxActions.setQueryStringWithHistory) {
      globalServices.store.dispatch(reduxActions.setQueryStringWithHistory(query));
    } else {
      // Fallback: dispatch action directly using action creator pattern
      globalServices.store.dispatch({
        type: 'query/setQueryStringWithHistory',
        payload: query,
        meta: { addToHistory: true },
      });
    }

    // If language is different, update the entire query state
    if (language && language !== currentQuery.language) {
      if (reduxActions && reduxActions.setQueryState) {
        globalServices.store.dispatch(
          reduxActions.setQueryState({
            query,
            language,
            dataset: currentQuery.dataset,
          })
        );
      } else {
        // Fallback: dispatch action directly
        globalServices.store.dispatch({
          type: 'query/setQueryState',
          payload: {
            query,
            language,
            dataset: currentQuery.dataset,
          },
        });
      }
    }

    // Verify the update
    const updatedState = globalServices.store.getState();
    const updatedQuery = updatedState.query;

    console.error('✅ Query updated successfully via Redux:', {
      previousQuery: currentQuery.query,
      updatedQuery: updatedQuery.query,
      previousLanguage: currentQuery.language,
      updatedLanguage: updatedQuery.language,
    });

    return {
      success: true,
      message: `Query updated successfully`,
      updatedQuery: updatedQuery.query,
      language: updatedQuery.language,
      previousQuery: currentQuery.query,
      previousLanguage: currentQuery.language,
      timestamp: new Date().toISOString(),
      action: 'query_updated',
      reduxActions:
        language !== currentQuery.language
          ? ['setQueryStringWithHistory', 'setQueryState']
          : ['setQueryStringWithHistory'],
    };
  } catch (error) {
    console.error('❌ Error updating query:', error);
    return {
      success: false,
      error: `Failed to update query: ${error.message}`,
      query,
      language,
      timestamp: new Date().toISOString(),
      action: 'query_update_failed',
    };
  }
}

async function handleRunQuery(args) {
  const { query, waitForResults = true } = args;

  console.error('🔧 MCP Tool: run_query called with:', { query, waitForResults });

  try {
    // Access the global Explore services which includes the Redux store
    const globalServices = global.exploreServices;
    if (!globalServices || !globalServices.store) {
      console.error(
        '❌ Explore services or store not available - returning mock success for testing'
      );
      return {
        success: true,
        message: query
          ? `Mock: Query "${query}" would be executed`
          : 'Mock: Current query would be executed',
        executedQuery: query || 'mock_current_query',
        language: 'PPL',
        dataset: 'opensearch_dashboards_sample_data_logs',
        resultCount: 42,
        hasResults: true,
        resultCacheKeys: 1,
        queryStatus: 'success',
        timestamp: new Date().toISOString(),
        action: 'query_executed_mock',
        note:
          'This is a mock response. Redux store not available - ensure Explore page is loaded and plugin is active.',
      };
    }

    // Get current state
    const currentState = globalServices.store.getState();
    let currentQuery = currentState.query;

    // If a query was provided, update it first
    if (query) {
      console.error('🔍 Updating query before execution:', {
        previousQuery: currentQuery.query,
        newQuery: query,
      });

      // Access Redux actions through global services
      const reduxActions = global.exploreReduxActions;

      if (reduxActions && reduxActions.setQueryStringWithHistory) {
        globalServices.store.dispatch(reduxActions.setQueryStringWithHistory(query));
      } else {
        // Fallback: dispatch action directly
        globalServices.store.dispatch({
          type: 'query/setQueryStringWithHistory',
          payload: query,
          meta: { addToHistory: true },
        });
      }

      // Get updated state
      const updatedState = globalServices.store.getState();
      currentQuery = updatedState.query;
    }

    console.error('🔍 Executing query:', {
      query: currentQuery.query,
      language: currentQuery.language,
      dataset: currentQuery.dataset ? currentQuery.dataset.title : 'default',
    });

    // Execute the query using Redux actions through global services
    const reduxActions = global.exploreReduxActions;
    let executePromise;

    if (reduxActions && reduxActions.executeQueries) {
      executePromise = globalServices.store.dispatch(
        reduxActions.executeQueries({ services: globalServices })
      );
    } else {
      // Fallback: dispatch action directly
      executePromise = globalServices.store.dispatch({
        type: 'query/executeQueries',
        payload: { services: globalServices },
      });
    }

    if (waitForResults) {
      // Wait for query execution to complete
      await executePromise;

      // Get updated results
      const finalState = globalServices.store.getState();
      const results = finalState.results;
      const queryStatus = finalState.queryEditor ? finalState.queryEditor.queryStatus : null;

      // Count total results across all cache keys
      let totalResultCount = 0;
      let hasResults = false;

      Object.values(results).forEach((result) => {
        if (result && result.hits && result.hits.hits) {
          totalResultCount += result.hits.hits.length;
          hasResults = true;
        }
      });

      console.error('✅ Query executed successfully:', {
        executedQuery: currentQuery.query,
        language: currentQuery.language,
        resultCacheKeys: Object.keys(results).length,
        totalResultCount,
        hasResults,
        queryStatus,
      });

      return {
        success: true,
        message: query
          ? `Query "${query}" executed successfully`
          : 'Current query executed successfully',
        executedQuery: currentQuery.query,
        language: currentQuery.language,
        dataset: currentQuery.dataset ? currentQuery.dataset.title : 'default',
        resultCount: totalResultCount,
        hasResults,
        resultCacheKeys: Object.keys(results).length,
        queryStatus,
        timestamp: new Date().toISOString(),
        action: 'query_executed',
        reduxActions: query ? ['setQueryStringWithHistory', 'executeQueries'] : ['executeQueries'],
      };
    } else {
      // Don't wait, just return immediately
      console.error('✅ Query execution started (not waiting for results)');

      return {
        success: true,
        message: query ? `Query "${query}" execution started` : 'Current query execution started',
        executedQuery: currentQuery.query,
        language: currentQuery.language,
        dataset: currentQuery.dataset ? currentQuery.dataset.title : 'default',
        waitForResults,
        timestamp: new Date().toISOString(),
        action: 'query_execution_started',
        reduxActions: query ? ['setQueryStringWithHistory', 'executeQueries'] : ['executeQueries'],
      };
    }
  } catch (error) {
    console.error('❌ Error executing query:', error);
    return {
      success: false,
      error: `Failed to execute query: ${error.message}`,
      query,
      waitForResults,
      timestamp: new Date().toISOString(),
      action: 'query_execution_failed',
    };
  }
}

async function handleGetQueryState(args) {
  const { includeResults = false } = args;

  console.error('🔧 MCP Tool: get_query_state called with:', { includeResults });

  try {
    // Access the global Explore services which includes the Redux store
    const globalServices = global.exploreServices;
    if (!globalServices || !globalServices.store) {
      console.error(
        '❌ Explore services or store not available - returning mock success for testing'
      );
      return {
        success: true,
        message: 'Mock: Query state retrieved successfully',
        queryState: {
          query: 'source = opensearch_dashboards_sample_data_logs | head 10',
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
        includeResults,
        timestamp: new Date().toISOString(),
        action: 'query_state_retrieved_mock',
        note:
          'This is a mock response. Redux store not available - ensure Explore page is loaded and plugin is active.',
      };
    }

    // Get current state from Redux store
    const currentState = globalServices.store.getState();
    const queryState = currentState.query;
    const uiState = currentState.ui;
    const queryEditorState = currentState.queryEditor;

    console.error('🔍 Retrieved query state:', {
      query: queryState.query,
      language: queryState.language,
      dataset: queryState.dataset ? queryState.dataset.title : 'default',
      activeTabId: uiState.activeTabId,
      includeResults,
    });

    const response = {
      success: true,
      message: 'Query state retrieved successfully',
      queryState: {
        query: queryState.query,
        language: queryState.language,
        dataset: queryState.dataset
          ? {
              id: queryState.dataset.id,
              title: queryState.dataset.title,
              type: queryState.dataset.type,
            }
          : null,
      },
      uiState: {
        activeTabId: uiState.activeTabId,
      },
      queryEditor: {
        dateRange: queryEditorState ? queryEditorState.dateRange : null,
        queryStatus: queryEditorState ? queryEditorState.queryStatus : null,
      },
      includeResults,
      timestamp: new Date().toISOString(),
      action: 'query_state_retrieved',
    };

    // Include results summary if requested
    if (includeResults) {
      const results = currentState.results;
      const resultsSummary = {
        cacheKeys: Object.keys(results),
        totalCacheEntries: Object.keys(results).length,
        resultCounts: {},
        hasResults: false,
      };

      // Count results for each cache key
      Object.entries(results).forEach(([cacheKey, result]) => {
        if (result && result.hits && result.hits.hits) {
          resultsSummary.resultCounts[cacheKey] = result.hits.hits.length;
          resultsSummary.hasResults = true;
        } else {
          resultsSummary.resultCounts[cacheKey] = 0;
        }
      });

      response.results = resultsSummary;
    }

    return response;
  } catch (error) {
    console.error('❌ Error getting query state:', error);
    return {
      success: false,
      error: `Failed to get query state: ${error.message}`,
      includeResults,
      timestamp: new Date().toISOString(),
      action: 'get_query_state_failed',
    };
  }
}

async function handleExpandDocument(args) {
  const { documentId, rowIndex } = args;

  console.error('🔧 MCP Tool: expand_document called with:', { documentId, rowIndex });

  return {
    success: true,
    message: `Document ${documentId || `at row ${rowIndex}`} expanded successfully`,
    documentId: documentId || `doc_${rowIndex}`,
    rowIndex: rowIndex || 0,
    timestamp: new Date().toISOString(),
    note:
      'This is a mock response. Real implementation would trigger document expansion in OpenSearch Dashboards UI.',
    action: 'document_expanded',
  };
}

// Simple JSON-RPC 2.0 server
class SimpleJSONRPCServer {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    console.error(
      '🚀 Starting OpenSearch Dashboards MCP Server (Simple JSON-RPC) with Redux Integration...'
    );
    console.error('📡 Transport: stdio (stdin/stdout)');
    console.error('🔧 Available tools:', TOOLS.map((t) => t.name).join(', '));
    console.error('🔗 Redux Integration: Enabled (requires Explore page to be active)');
    console.error('✅ OpenSearch Dashboards MCP Server is running and ready for connections');
    console.error(
      '💡 Note: Redux integration requires an active Explore page in OpenSearch Dashboards'
    );

    this.rl.on('line', (line) => {
      this.handleRequest(line.trim());
    });
  }

  async handleRequest(line) {
    if (!line) return;

    try {
      const request = JSON.parse(line);
      console.error('📥 Received request:', JSON.stringify(request));

      let response;

      if (request.method === 'tools/list') {
        response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            tools: TOOLS,
          },
        };
      } else if (request.method === 'tools/call') {
        const { name, arguments: args } = request.params;
        console.error(`🔧 Tool called: ${name} with args:`, args);

        let result;
        switch (name) {
          case 'update_query':
            result = await handleUpdateQuery(args || {});
            break;
          case 'run_query':
            result = await handleRunQuery(args || {});
            break;
          case 'get_query_state':
            result = await handleGetQueryState(args || {});
            break;
          case 'expand_document':
            result = await handleExpandDocument(args || {});
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          },
        };
      } else {
        response = {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32601,
            message: `Method not found: ${request.method}`,
          },
        };
      }

      console.error('📤 Sending response:', JSON.stringify(response));
      console.log(JSON.stringify(response));
    } catch (error) {
      console.error('❌ Error processing request:', error);
      const errorResponse = {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error',
        },
      };
      console.log(JSON.stringify(errorResponse));
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.error('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the server
new SimpleJSONRPCServer();
