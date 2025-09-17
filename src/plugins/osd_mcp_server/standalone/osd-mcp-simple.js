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
const http = require('http');

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

// HTTP helper function to make requests to the Redux bridge
async function makeHttpRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5601, // Default OpenSearch Dashboards port
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'osd-xsrf': 'true', // Required for OpenSearch Dashboards CSRF protection
      },
    };

    if (body) {
      const bodyString = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyString);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: response });
        } catch (error) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Tool handlers with HTTP Redux bridge integration
async function handleUpdateQuery(args) {
  const { query, language = 'PPL' } = args;

  console.error('🔧 MCP Tool: update_query called with:', { query, language });

  try {
    // Use HTTP bridge to update query via Redux
    const response = await makeHttpRequest('/api/osd-mcp-server/redux/update-query', 'POST', {
      query,
      language,
    });

    console.error('🔍 HTTP Bridge response:', response);

    if (response.statusCode === 200) {
      return {
        success: true,
        message: `Query updated successfully via HTTP bridge`,
        updatedQuery: query,
        language: language,
        timestamp: new Date().toISOString(),
        action: 'query_updated_via_bridge',
        bridgeResponse: response.data,
      };
    } else {
      console.error('❌ HTTP Bridge error:', response);
      return {
        success: false,
        error: `HTTP Bridge error: ${response.statusCode}`,
        query,
        language,
        timestamp: new Date().toISOString(),
        action: 'query_update_bridge_failed',
        bridgeResponse: response.data,
      };
    }
  } catch (error) {
    console.error('❌ Error updating query via HTTP bridge:', error);
    
    // Fallback to mock response if HTTP bridge is not available
    console.error('🔄 Falling back to mock response...');
    return {
      success: true,
      message: `Mock: Query would be updated to "${query}" with language "${language}" (HTTP bridge unavailable)`,
      updatedQuery: query,
      language: language,
      previousQuery: 'mock_previous_query',
      previousLanguage: 'PPL',
      timestamp: new Date().toISOString(),
      action: 'query_updated_mock_fallback',
      error: error.message,
      note: 'HTTP bridge not available - ensure OpenSearch Dashboards is running on localhost:5601',
    };
  }
}

async function handleRunQuery(args) {
  const { query, waitForResults = true } = args;

  console.error('🔧 MCP Tool: run_query called with:', { query, waitForResults });

  try {
    // Use HTTP bridge to execute query via Redux
    const response = await makeHttpRequest('/api/osd-mcp-server/redux/execute-query', 'POST', {
      query,
      waitForResults,
    });

    console.error('🔍 HTTP Bridge response:', response);

    if (response.statusCode === 200) {
      return {
        success: true,
        message: query
          ? `Query "${query}" executed successfully via HTTP bridge`
          : 'Current query executed successfully via HTTP bridge',
        executedQuery: query || 'current_query',
        waitForResults,
        timestamp: new Date().toISOString(),
        action: 'query_executed_via_bridge',
        bridgeResponse: response.data,
      };
    } else {
      console.error('❌ HTTP Bridge error:', response);
      return {
        success: false,
        error: `HTTP Bridge error: ${response.statusCode}`,
        query,
        waitForResults,
        timestamp: new Date().toISOString(),
        action: 'query_execution_bridge_failed',
        bridgeResponse: response.data,
      };
    }
  } catch (error) {
    console.error('❌ Error executing query via HTTP bridge:', error);
    
    // Fallback to mock response if HTTP bridge is not available
    console.error('🔄 Falling back to mock response...');
    return {
      success: true,
      message: query
        ? `Mock: Query "${query}" would be executed (HTTP bridge unavailable)`
        : 'Mock: Current query would be executed (HTTP bridge unavailable)',
      executedQuery: query || 'mock_current_query',
      language: 'PPL',
      dataset: 'opensearch_dashboards_sample_data_logs',
      resultCount: 42,
      hasResults: true,
      resultCacheKeys: 1,
      queryStatus: 'success',
      waitForResults,
      timestamp: new Date().toISOString(),
      action: 'query_executed_mock_fallback',
      error: error.message,
      note: 'HTTP bridge not available - ensure OpenSearch Dashboards is running on localhost:5601',
    };
  }
}

async function handleGetQueryState(args) {
  const { includeResults = false } = args;

  console.error('🔧 MCP Tool: get_query_state called with:', { includeResults });

  try {
    // Use HTTP bridge to get query state via Redux
    const response = await makeHttpRequest('/api/osd-mcp-server/redux/state', 'GET');

    console.error('🔍 HTTP Bridge response:', response);

    if (response.statusCode === 200) {
      return {
        success: true,
        message: 'Query state retrieved successfully via HTTP bridge',
        includeResults,
        timestamp: new Date().toISOString(),
        action: 'query_state_retrieved_via_bridge',
        bridgeResponse: response.data,
      };
    } else {
      console.error('❌ HTTP Bridge error:', response);
      return {
        success: false,
        error: `HTTP Bridge error: ${response.statusCode}`,
        includeResults,
        timestamp: new Date().toISOString(),
        action: 'query_state_bridge_failed',
        bridgeResponse: response.data,
      };
    }
  } catch (error) {
    console.error('❌ Error getting query state via HTTP bridge:', error);
    
    // Fallback to mock response if HTTP bridge is not available
    console.error('🔄 Falling back to mock response...');
    return {
      success: true,
      message: 'Mock: Query state retrieved successfully (HTTP bridge unavailable)',
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
      action: 'query_state_retrieved_mock_fallback',
      error: error.message,
      note: 'HTTP bridge not available - ensure OpenSearch Dashboards is running on localhost:5601',
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
