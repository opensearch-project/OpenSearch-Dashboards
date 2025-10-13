/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Types based on AI Agent MCP configuration format
export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: {
    type?: string;
    properties?: Record<string, any>;
    required?: string[];
    [key: string]: unknown;
  };
}

export interface MCPServerConfig {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string; // For remote connections
  type: 'local' | 'http';
  disabled?: boolean;
  autoApprove?: string[];
  requestInit?: {
    headers?: Record<string, string>;
  };
}
