#!/usr/bin/env node

/**
 * OpenSearch Dashboards MCP Server - Remote stdio Transport
 * 
 * This script runs on the local Mac and connects to the OSD MCP server
 * running on the EC2 instance via SSH tunnel.
 */

const { spawn } = require('child_process');
const { URL } = require('url');

class RemoteOSDMCPServer {
  constructor() {
    // Configuration - can be overridden by environment variables
    this.sshHost = process.env.OSD_SSH_HOST || 'ubuntu@ip-172-31-18-229';
    this.sshKey = process.env.OSD_SSH_KEY || '~/.ssh/id_rsa';
    this.osdPath = process.env.OSD_PATH || '/home/ubuntu/OpenSearch-Dashboards';
    
    this.setupStdio();
  }

  setupStdio() {
    // Set up JSON-RPC communication over stdin/stdout
    process.stdin.setEncoding('utf8');
    
    let buffer = '';
    process.stdin.on('data', (chunk) => {
      buffer += chunk;
      
      // Process complete JSON messages
      let lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const message = JSON.parse(line.trim());
            this.handleMessage(message);
          } catch (error) {
            this.sendError(null, -32700, 'Parse error', error.message);
          }
        }
      }
    });

    process.stdin.on('end', () => {
      process.exit(0);
    });

    // Handle process termination
    process.on('SIGINT', () => process.exit(0));
    process.on('SIGTERM', () => process.exit(0));
  }

  async handleMessage(message) {
    const { jsonrpc, id, method, params } = message;

    if (jsonrpc !== '2.0') {
      return this.sendError(id, -32600, 'Invalid Request', 'Invalid JSON-RPC version');
    }

    try {
      // Forward the message to the remote server via SSH
      const result = await this.forwardToRemoteServer(message);
      this.sendResponse(id, result.result || result);
    } catch (error) {
      this.sendError(id, -32603, 'Internal error', error.message);
    }
  }

  async forwardToRemoteServer(message) {
    return new Promise((resolve, reject) => {
      // Execute the remote MCP server via SSH
      const sshCommand = [
        'ssh',
        '-i', this.sshKey,
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'UserKnownHostsFile=/dev/null',
        '-o', 'LogLevel=ERROR',
        this.sshHost,
        `cd ${this.osdPath} && node src/plugins/osd_mcp_server/standalone/osd-mcp-stdio.js`
      ];

      const ssh = spawn(sshCommand[0], sshCommand.slice(1), {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let responseData = '';
      let errorData = '';

      ssh.stdout.on('data', (data) => {
        responseData += data.toString();
      });

      ssh.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      ssh.on('close', (code) => {
        if (code === 0 && responseData.trim()) {
          try {
            const response = JSON.parse(responseData.trim());
            resolve(response);
          } catch (e) {
            reject(new Error(`Invalid JSON response: ${responseData}`));
          }
        } else {
          reject(new Error(`SSH command failed (code ${code}): ${errorData}`));
        }
      });

      ssh.on('error', (error) => {
        reject(new Error(`SSH error: ${error.message}`));
      });

      // Send the message to the remote server
      ssh.stdin.write(JSON.stringify(message) + '\n');
      ssh.stdin.end();
    });
  }

  sendResponse(id, result) {
    const response = {
      jsonrpc: '2.0',
      id: id,
      result: result
    };
    process.stdout.write(JSON.stringify(response) + '\n');
  }

  sendError(id, code, message, data) {
    const response = {
      jsonrpc: '2.0',
      id: id,
      error: {
        code: code,
        message: message,
        data: data
      }
    };
    process.stdout.write(JSON.stringify(response) + '\n');
  }
}

// Start the remote server
new RemoteOSDMCPServer();
