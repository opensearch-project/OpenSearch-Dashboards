#!/usr/bin/env node

/**
 * MCP Bridge - Connects to already running MCP server via SSH with proper MCP protocol
 */

const { spawn } = require('child_process');
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

class MCPBridge {
  constructor() {
    this.sshHost = process.env.OSD_SSH_HOST || 'ubuntu@35.86.147.162';
    this.sshKey = process.env.OSD_SSH_KEY || '~/.ssh/osd-dev.pem';
    this.osdPath = process.env.OSD_PATH || '/home/ubuntu/OpenSearch-Dashboards';
    
    console.error('🌉 Starting MCP Bridge...');
    console.error(`🔗 Connecting to EC2 via SSH: ${this.sshHost}`);
    
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

    // Set up SSH connection to remote MCP server
    await this.connectToRemoteServer();
    
    // Set up MCP handlers that forward to remote server
    this.setupMCPHandlers();

    // Start the MCP server
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('✅ SSH bridge established');
    console.error('📡 MCP Bridge is running on stdio');
  }

  async connectToRemoteServer() {
    return new Promise((resolve, reject) => {
      // Create SSH connection that runs a new instance of the MCP server
      const sshCommand = [
        'ssh',
        '-i', this.sshKey,
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'UserKnownHostsFile=/dev/null',
        '-o', 'LogLevel=ERROR',
        this.sshHost,
        `cd ${this.osdPath} && node src/plugins/osd_mcp_server/standalone/osd-mcp-stdio.js`
      ];

      this.ssh = spawn(sshCommand[0], sshCommand.slice(1), {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let initBuffer = '';
      let isConnected = false;

      this.ssh.stdout.on('data', (data) => {
        const output = data.toString();
        
        // Check for startup messages to confirm connection
        if (!isConnected && output.includes('OpenSearch Dashboards MCP Server is running')) {
          isConnected = true;
          console.error('✅ Connected to remote MCP server');
          resolve();
        }
        
        // Store data for response handling
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
    // Store pending requests
    this.pendingRequests = new Map();
    this.requestId = 1;

    // Handle list tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const response = await this.forwardToRemote({
        jsonrpc: '2.0',
        id: this.requestId++,
        method: 'tools/list',
        params: {}
      });
      
      return response.result || { tools: [] };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const response = await this.forwardToRemote({
        jsonrpc: '2.0',
        id: this.requestId++,
        method: 'tools/call',
        params: request.params
      });
      
      return response.result || { content: [{ type: 'text', text: 'No response' }] };
    });
  }

  async forwardToRemote(message) {
    return new Promise((resolve, reject) => {
      if (!this.ssh) {
        reject(new Error('Not connected to remote server'));
        return;
      }

      // Store the request
      this.pendingRequests.set(message.id, { resolve, reject });

      // Send to remote server
      this.ssh.stdin.write(JSON.stringify(message) + '\n');

      // Set up one-time response handler
      const handleResponse = () => {
        if (this.responseBuffer) {
          const lines = this.responseBuffer.split('\n');
          
          for (const line of lines) {
            if (line.trim()) {
              try {
                const response = JSON.parse(line.trim());
                if (response.id && this.pendingRequests.has(response.id)) {
                  const { resolve } = this.pendingRequests.get(response.id);
                  this.pendingRequests.delete(response.id);
                  resolve(response);
                  return;
                }
              } catch (error) {
                // Ignore non-JSON lines
              }
            }
          }
        }
        
        // If no response found, try again in 100ms
        setTimeout(handleResponse, 100);
      };

      // Start checking for responses
      setTimeout(handleResponse, 100);

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(message.id)) {
          this.pendingRequests.delete(message.id);
          reject(new Error('Request timeout'));
        }
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
    new MCPBridge();
  } catch (error) {
    console.error('Failed to start MCP bridge:', error);
    process.exit(1);
  }
}

startBridge();
