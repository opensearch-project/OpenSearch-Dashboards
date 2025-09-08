/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { ContextData, AgentTool } from '../types';

export class ClaudeOSDAgent {
  private apiKey: string;
  private uiActions: any;
  private tools: AgentTool[];

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.uiActions = (window as any).aiChatbotServices?.uiActions;
    this.tools = this.initializeTools();
  }

  private initializeTools(): AgentTool[] {
    return [
      {
        name: 'add_filter',
        description: 'Add a filter to the current dashboard or explore view',
        parameters: {
          type: 'object',
          properties: {
            field: { type: 'string', description: 'Field name to filter on (e.g., level, service, message)' },
            value: { type: 'string', description: 'Value to filter for (e.g., ERROR, auth-service)' },
            operation: { type: 'string', enum: ['is', 'is_not', 'exists'], description: 'Filter operation' }
          },
          required: ['field', 'value']
        },
        execute: this.addFilter.bind(this)
      },
      {
        name: 'expand_panel',
        description: 'Expand a dashboard panel to full screen view',
        parameters: {
          type: 'object',
          properties: {
            panelId: { type: 'string', description: 'ID of the panel to expand' }
          },
          required: ['panelId']
        },
        execute: this.expandPanel.bind(this)
      },
      {
        name: 'expand_document',
        description: 'Expand a document in the explore logs view to see full details',
        parameters: {
          type: 'object',
          properties: {
            documentId: { type: 'string', description: 'ID of document to expand' }
          },
          required: ['documentId']
        },
        execute: this.expandDocument.bind(this)
      }
    ];
  }

  private async addFilter(params: { field: string; value: string; operation?: string }): Promise<string> {
    try {
      console.log(`🔧 Agent executing: Add filter ${params.field}=${params.value}`);
      
      if (this.uiActions) {
        await this.uiActions.executeTriggerActions('ADD_FILTER_TRIGGER', {
          field: params.field,
          value: params.value,
          operation: params.operation || 'is'
        });
        return `✅ Added filter: ${params.field} = ${params.value}`;
      } else {
        return `❌ UI Actions not available. Make sure you're on a dashboard or explore page.`;
      }
    } catch (error) {
      console.error('❌ Error adding filter:', error);
      return `❌ Error adding filter: ${error.message}`;
    }
  }

  private async expandPanel(params: { panelId: string }): Promise<string> {
    try {
      console.log(`🔧 Agent executing: Expand panel ${params.panelId}`);
      
      if (this.uiActions) {
        await this.uiActions.executeTriggerActions('EXPAND_PANEL_TRIGGER', {
          panelId: params.panelId
        });
        return `✅ Expanded panel: ${params.panelId}`;
      } else {
        return `❌ UI Actions not available. Make sure you're on a dashboard page.`;
      }
    } catch (error) {
      console.error('❌ Error expanding panel:', error);
      return `❌ Error expanding panel: ${error.message}`;
    }
  }

  private async expandDocument(params: { documentId: string }): Promise<string> {
    try {
      console.log(`🔧 Agent executing: Expand document ${params.documentId}`);
      
      if (this.uiActions) {
        await this.uiActions.executeTriggerActions('EXPLORE_DOCUMENT_EXPAND_TRIGGER', {
          documentId: params.documentId,
          action: 'expand'
        });
        return `✅ Expanded document: ${params.documentId}`;
      } else {
        return `❌ UI Actions not available. Make sure you're on an explore page.`;
      }
    } catch (error) {
      console.error('❌ Error expanding document:', error);
      return `❌ Error expanding document: ${error.message}`;
    }
  }

  async processRequest(userMessage: string, context: ContextData): Promise<string> {
    try {
      console.log('🤖 Claude Agent processing request:', userMessage);
      console.log('📋 Current context:', context);

      const response = await this.callClaudeAPI(userMessage, context);
      
      // Parse response for tool calls
      const toolCalls = this.parseToolCalls(response);
      
      if (toolCalls.length > 0) {
        const results = [];
        for (const toolCall of toolCalls) {
          const tool = this.tools.find(t => t.name === toolCall.name);
          if (tool) {
            const result = await tool.execute(toolCall.parameters);
            results.push(result);
          } else {
            results.push(`❌ Unknown tool: ${toolCall.name}`);
          }
        }
        return results.join('\n');
      }

      return response;
    } catch (error) {
      console.error('❌ Claude Agent error:', error);
      return `Sorry, I encountered an error: ${error.message}`;
    }
  }

  private async callClaudeAPI(userMessage: string, context: ContextData): Promise<string> {
    // Use server-side proxy to avoid CORS issues
    const response = await fetch('/api/ai-chatbot/claude', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'osd-xsrf': 'true', // Required for OpenSearch Dashboards API calls
      },
      body: JSON.stringify({
        message: userMessage,
        context: context,
        apiKey: this.apiKey,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.response;
  }

  private parseToolCalls(response: string): Array<{ name: string; parameters: any }> {
    const toolCalls = [];
    const toolCallRegex = /TOOL_CALL:\s*(\w+)\(({[^}]*})\)/g;
    let match;

    while ((match = toolCallRegex.exec(response)) !== null) {
      try {
        const toolName = match[1];
        const parameters = JSON.parse(match[2]);
        toolCalls.push({ name: toolName, parameters });
      } catch (error) {
        console.error('❌ Error parsing tool call:', error);
      }
    }

    return toolCalls;
  }

  getAvailableTools(): AgentTool[] {
    return this.tools;
  }
}