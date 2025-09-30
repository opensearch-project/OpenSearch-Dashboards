#!/usr/bin/env node

/**
 * Direct MCP Bridge - Connects to manually running MCP server via SSH pipe
 */

const { spawn } = require('child_process');
const path = require('path');
const { Server } = require('@modelcontextprotocol/sdk/server');
const { StdioServerTransport } = require(path.join(
  __dirname,
  'node_modules/@modelcontextprotocol/sdk/dist/cjs/server/stdio.js'
));
const { CallToolRequestSchema, ListToolsRequestSchema } = require(path.join(
  __dirname,
  'node_modules/@modelcontextprotocol/sdk/dist/cjs/types.js'
));

class DirectMCPBridge {
  constructor() {
    this.sshHost = process.env.OSD_SSH_HOST || 'ubuntu@35.86.147.162';
    // Expand tilde to home directory
    const sshKeyPath = process.env.OSD_SSH_KEY || '~/.ssh/osd-dev.pem';
    this.sshKey = sshKeyPath.replace('~', require('os').homedir());

    console.error('🌉 Starting Direct MCP Bridge...');
    console.error(`🔗 Connecting to EC2 via SSH: ${this.sshHost}`);
    console.error(`🔑 Using SSH key: ${this.sshKey}`);

    this.setupMCPServer();
  }

  async setupMCPServer() {
    // Create MCP server
    this.server = new Server(
      {
        name: 'osd-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Set up SSH pipe connection
    await this.connectToRemoteServer();

    // Set up MCP handlers that forward to remote server
    this.setupMCPHandlers();

    // Start the MCP server
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.error('✅ SSH pipe established');
    console.error('📡 MCP Bridge is running on stdio');
  }

  async connectToRemoteServer() {
    return new Promise((resolve, reject) => {
      // Create SSH connection that directly executes the MCP server
      const sshCommand = [
        'ssh',
        '-i',
        this.sshKey,
        '-o',
        'StrictHostKeyChecking=no',
        '-o',
        'UserKnownHostsFile=/dev/null',
        '-o',
        'LogLevel=ERROR',
        '-T', // Disable pseudo-terminal allocation
        this.sshHost,
        `cd /home/ubuntu/OpenSearch-Dashboards && exec node src/plugins/osd_mcp_server/standalone/osd-mcp-simple.js`,
      ];

      this.ssh = spawn(sshCommand[0], sshCommand.slice(1), {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let initBuffer = '';
      let isConnected = false;

      this.ssh.stdout.on('data', (data) => {
        const output = data.toString();

        // Check for MCP server startup messages
        if (!isConnected && output.includes('OpenSearch Dashboards MCP Server is running')) {
          isConnected = true;
          console.error('✅ Connected to remote MCP server');
          resolve();
        }

        // Store data for response handling after connection
        if (isConnected) {
          this.handleRemoteData(output);
        } else {
          initBuffer += output;
          if (initBuffer.includes('OpenSearch Dashboards MCP Server is running')) {
            isConnected = true;
            console.error('✅ Connected to remote MCP server');
            resolve();
          }
        }
      });

      this.ssh.stderr.on('data', (data) => {
        const errorOutput = data.toString();
        console.error(`SSH Debug: ${errorOutput}`);

        // Also check stderr for startup messages (MCP server logs to stderr)
        if (!isConnected && errorOutput.includes('OpenSearch Dashboards MCP Server is running')) {
          isConnected = true;
          console.error('✅ Connected to remote MCP server');
          resolve();
        }
      });

      this.ssh.on('close', (code) => {
        console.error(`SSH connection closed with code ${code}`);
        process.exit(code);
      });

      this.ssh.on('error', (error) => {
        console.error(`SSH error: ${error.message}`);
        reject(error);
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!isConnected) {
          reject(new Error('Connection timeout - could not connect to remote MCP server'));
        }
      }, 10000);
    });
  }

  handleRemoteData(data) {
    // Store incoming data for response processing
    if (!this.responseBuffer) {
      this.responseBuffer = '';
    }
    this.responseBuffer += data;
  }

  setupMCPHandlers() {
    // Handle list tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      // Return hardcoded tools since we know what the server provides
      return {
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
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const response = await this.forwardToRemote({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: request.params,
      });

      return response.result || { content: [{ type: 'text', text: 'No response' }] };
    });
  }

  async forwardToRemote(message) {
    return new Promise((resolve, reject) => {
      if (!this.ssh) {
        console.error('❌ SSH connection not available');
        reject(new Error('Not connected to remote server'));
        return;
      }

      console.error('🔧 Forwarding MCP request:', JSON.stringify(message));

      // Send to remote server
      try {
        this.ssh.stdin.write(JSON.stringify(message) + '\n');
        console.error('✅ Request sent to remote server via SSH');
      } catch (error) {
        console.error('❌ Failed to write to SSH stdin:', error);
        reject(error);
        return;
      }

      let responseBuffer = '';
      const responseHandler = (data) => {
        const dataStr = data.toString();
        console.error('📥 Received data from remote:', dataStr);
        responseBuffer += dataStr;

        // Look for complete JSON responses
        const lines = responseBuffer.split('\n');

        for (const line of lines) {
          if (line.trim()) {
            try {
              const response = JSON.parse(line.trim());
              console.error('📤 Parsed JSON response:', JSON.stringify(response));
              if (response.id) {
                this.ssh.stdout.removeListener('data', responseHandler);
                console.error('✅ Returning response for ID:', response.id);
                resolve(response);
                return;
              }
            } catch (error) {
              console.error('⚠️ Non-JSON line received:', line.trim());
            }
          }
        }
      };

      this.ssh.stdout.on('data', responseHandler);

      // Timeout after 30 seconds (increased)
      setTimeout(() => {
        console.error('⏰ Request timeout after 30 seconds');
        this.ssh.stdout.removeListener('data', responseHandler);
        reject(new Error('Request timeout'));
      }, 30000);
    });
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

// Start the bridge
async function startBridge() {
  try {
    new DirectMCPBridge();
  } catch (error) {
    console.error('Failed to start MCP bridge:', error);
    process.exit(1);
  }
}

startBridge();
