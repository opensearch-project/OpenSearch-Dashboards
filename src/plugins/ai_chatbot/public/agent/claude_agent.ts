/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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
        name: 'expand_document',
        description: 'Expand a document in the explore logs view to see full details',
        parameters: {
          type: 'object',
          properties: {
            documentId: { type: 'string', description: 'ID of document to expand' },
          },
          required: ['documentId'],
        },
        execute: this.expandDocument.bind(this),
      },
    ];
  }

  private async expandDocument(params: { documentId: string }): Promise<string> {
    try {
      console.log(`🔧 Agent executing: Expand document ${params.documentId}`);

      if (this.uiActions) {
        await this.uiActions.executeTriggerActions('EXPLORE_DOCUMENT_EXPAND_TRIGGER', {
          documentId: params.documentId,
          action: 'expand',
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
          const tool = this.tools.find((t) => t.name === toolCall.name);
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
        context,
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
