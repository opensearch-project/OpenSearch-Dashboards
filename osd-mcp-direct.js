#!/usr/bin/env node

/**
 * Direct MCP Server - No SSH, direct HTTP to localhost
 *
 * Since AG-UI and OSD are both on EC2, we can make direct HTTP requests
 * without SSH complexity.
 */

const readline = require('readline');
const http = require('http');

// Tool definitions (same as before)
const TOOLS = [
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
];

// Direct HTTP helper (no SSH)
async function makeDirectHttpRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5601,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'osd-xsrf': 'true',
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

// Tool handlers
async function handleUpdateQuery(args) {
  const { query, language = 'PPL' } = args;

  console.error('🔧 MCP Tool: update_query called with:', { query, language });

  try {
    const response = await makeDirectHttpRequest('/api/osd-mcp-server/redux/update-query', 'POST', {
      query,
      language,
    });

    console.error('🔍 Direct HTTP response:', response);

    if (response.statusCode === 200) {
      return {
        success: true,
        message: `Query updated successfully - added to polling queue`,
        updatedQuery: query,
        language: language,
        timestamp: new Date().toISOString(),
        action: 'query_updated_via_polling',
        response: response.data,
      };
    } else {
      return {
        success: false,
        error: `HTTP error: ${response.statusCode}`,
        query,
        language,
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error) {
    console.error('❌ Error with direct HTTP request:', error);
    return {
      success: false,
      error: error.message,
      query,
      language,
      timestamp: new Date().toISOString(),
      note: 'Direct HTTP request failed - ensure OpenSearch Dashboards is running',
    };
  }
}

async function handleRunQuery(args) {
  const { query, waitForResults = true } = args;
  console.error('🔧 MCP Tool: run_query called with:', { query, waitForResults });

  // For now, return success (can be implemented later)
  return {
    success: true,
    message: 'Query execution simulated',
    query: query || 'current_query',
    waitForResults,
    timestamp: new Date().toISOString(),
  };
}

async function handleGetQueryState(args) {
  console.error('🔧 MCP Tool: get_query_state called');

  // For now, return mock state (can be implemented later)
  return {
    success: true,
    message: 'Query state retrieved',
    queryState: {
      query: 'current query from state',
      language: 'PPL',
    },
    timestamp: new Date().toISOString(),
  };
}

// Simple JSON-RPC server
class DirectMCPServer {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    console.error('🚀 Starting Direct MCP Server (No SSH)...');
    console.error('📡 Transport: stdio (stdin/stdout)');
    console.error('🔧 Available tools:', TOOLS.map((t) => t.name).join(', '));
    console.error('🔗 Direct HTTP to localhost:5601 (no SSH complexity)');
    console.error('✅ Direct MCP Server is running and ready');

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
new DirectMCPServer();
