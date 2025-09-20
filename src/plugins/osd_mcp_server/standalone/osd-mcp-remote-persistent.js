#!/usr/bin/env node

/**
 * OpenSearch Dashboards MCP Server - Persistent Remote stdio Transport
 * 
 * This script runs on the local Mac and maintains a persistent connection
 * to the OSD MCP server running on the EC2 instance via SSH tunnel.
 */

const { spawn } = require('child_process');
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

class PersistentRemoteOSDMCPServer {
  constructor() {
    // Configuration - can be overridden by environment variables
    this.sshHost = process.env.OSD_SSH_HOST || 'ubuntu@35.86.147.162';
    this.sshKey = process.env.OSD_SSH_KEY || '~/.ssh/osd-dev.pem';
    this.osdPath = process.env.OSD_PATH || '/home/ubuntu/OpenSearch-Dashboards';
    
    this.sshProcess = null;
    this.isConnected = false;
    
    this.setupMCPServer();
  }

  async setupMCPServer() {
    console.error('🌉 Starting OSD MCP Remote Bridge...');
    console.error(`🔗 Connecting to EC2 via SSH: ${this.sshHost}`);
    
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

    // Set up persistent SSH connection
    await this.connectToRemoteServer();
<<<<<<< HEAD

=======
    
>>>>>>> ac304b9a894... Revert "[mcp] remove standalone mcp and reset mcp server"
    // Set up MCP handlers
    this.setupMCPHandlers();

    // Start the MCP server
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('✅ SSH connection established');
    console.error('📡 MCP Bridge is running on stdio');
  }

  async connectToRemoteServer() {
    return new Promise((resolve, reject) => {
      const sshCommand = [
        'ssh',
        '-i', this.sshKey,
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'UserKnownHostsFile=/dev/null',
        '-o', 'LogLevel=ERROR',
        '-o', 'ServerAliveInterval=30',
        '-o', 'ServerAliveCountMax=3',
        this.sshHost,
        `cd ${this.osdPath} && node src/plugins/osd_mcp_server/standalone/osd-mcp-stdio.js`
      ];

      this.sshProcess = spawn(sshCommand[0], sshCommand.slice(1), {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let initBuffer = '';
      
      this.sshProcess.stdout.on('data', (data) => {
        const output = data.toString();
        
        // Check for startup messages
        if (output.includes('OpenSearch Dashboards MCP Server is running')) {
          this.isConnected = true;
          resolve();
        }
        
        // Handle JSON-RPC responses
        if (this.isConnected) {
          this.handleRemoteResponse(output);
        } else {
          initBuffer += output;
          if (initBuffer.includes('OpenSearch Dashboards MCP Server is running')) {
            this.isConnected = true;
            resolve();
          }
        }
      });

      this.sshProcess.stderr.on('data', (data) => {
        console.error(`SSH Error: ${data.toString()}`);
      });

      this.sshProcess.on('close', (code) => {
        console.error(`SSH connection closed with code ${code}`);
        this.isConnected = false;
      });

      this.sshProcess.on('error', (error) => {
        console.error(`SSH error: ${error.message}`);
        reject(error);
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error('SSH connection timeout'));
        }
      }, 10000);
    });
  }

  setupMCPHandlers() {
    // Store pending requests
    this.pendingRequests = new Map();
    this.requestId = 1;

    // Handle list tools
    this.server.setRequestHandler('tools/list', async () => {
      const response = await this.forwardToRemote({
        jsonrpc: '2.0',
        id: this.requestId++,
        method: 'tools/list',
        params: {}
      });
      
      return response.result || { tools: [] };
    });

    // Handle tool calls
    this.server.setRequestHandler('tools/call', async (request) => {
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
      if (!this.isConnected || !this.sshProcess) {
        reject(new Error('Not connected to remote server'));
        return;
      }

      // Store the request
      this.pendingRequests.set(message.id, { resolve, reject });

      // Send to remote server
      this.sshProcess.stdin.write(JSON.stringify(message) + '\n');

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(message.id)) {
          this.pendingRequests.delete(message.id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  handleRemoteResponse(data) {
    const lines = data.split('\n');
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const response = JSON.parse(line.trim());
          
          if (response.id && this.pendingRequests.has(response.id)) {
            const { resolve } = this.pendingRequests.get(response.id);
            this.pendingRequests.delete(response.id);
            resolve(response);
          }
        } catch (error) {
          // Ignore non-JSON lines (startup messages, etc.)
        }
      }
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

// Start the persistent remote server
async function startServer() {
  try {
    new PersistentRemoteOSDMCPServer();
  } catch (error) {
    console.error('Failed to start remote MCP server:', error);
    process.exit(1);
  }
}

startServer();
