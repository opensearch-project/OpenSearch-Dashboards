/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { IRouter } from '../../../../core/server';
import { schema } from '@osd/config-schema';

export function defineClaudeProxyRoutes(router: IRouter) {
  router.post(
    {
      path: '/api/ai-chatbot/claude',
      validate: {
        body: schema.object({
          message: schema.string(),
          context: schema.any(),
          apiKey: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      try {
        const { message, context: userContext, apiKey } = request.body;

        // Build system prompt with enhanced context support
        let contextSection = '';
        
        // Use formatted system context if available (from memory-enhanced agent)
        if (userContext?.systemContext) {
          contextSection = `Current Context:\n${userContext.systemContext}`;
        } else {
          // Fallback to basic context extraction
          contextSection = `Current Context:
- App: ${userContext?.appId || 'unknown'}
- Type: ${userContext?.data?.type || 'unknown'}
- Dashboard: ${userContext?.data?.dashboard?.title || 'N/A'}
- Embeddables: ${userContext?.data?.embeddables?.count || 0}
- Filters: ${userContext?.data?.filters?.length || 0}
- Time Range: ${JSON.stringify(userContext?.data?.timeRange) || 'unknown'}`;
        }

        // Add memory context if available
        let memorySection = '';
        if (userContext?.memoryContext) {
          memorySection = `\n\nRelevant Previous Conversations (Learn from these patterns):\n${userContext.memoryContext}\n\nIMPORTANT: Use the patterns and examples from previous conversations to inform your current response. If you see similar queries or contexts, adapt the solutions accordingly.`;
        }

        // Add chat history if available
        let chatHistorySection = '';
        if (userContext?.chatHistory && userContext.chatHistory.length > 0) {
          chatHistorySection = '\n\nRecent Chat History:\n';
          userContext.chatHistory.forEach((item: any) => {
            const role = item.type === 'user_query' ? 'User' : 'Assistant';
            chatHistorySection += `${role}: ${item.content}\n`;
          });
        }

        // Add session summary if available
        let sessionSection = '';
        if (userContext?.sessionSummary) {
          sessionSection = `\n\nCurrent Session: ${userContext.sessionSummary}`;
        }

        const systemPrompt = `You are an OpenSearch Dashboards assistant with advanced memory capabilities. You can help users understand their data and interact with their dashboards.

${contextSection}${memorySection}${chatHistorySection}${sessionSection}

CONTEXT ANALYSIS INSTRUCTIONS:
1. **Current Context**: Use the system context above to understand what the user is currently viewing (dataset, query, chart type, etc.)
2. **Memory Learning**: If memory context is provided, learn from previous patterns and adapt solutions to the current situation
3. **Pattern Recognition**: When you see similar queries or contexts in memory, apply those patterns to new requests
4. **Dataset Adaptation**: If the user switches datasets (e.g., from logs to flights), adapt previous queries by changing the source dataset name

Available Actions:
- add_filter: Add filters to dashboard
- expand_panel: Expand dashboard panels
- expand_document: Expand documents in explore view

When users ask to filter data, expand panels, or expand documents, use the appropriate tools.
For tool calls, respond with: TOOL_CALL: tool_name({"param": "value"})

Examples:
- "Add a filter for level ERROR" → TOOL_CALL: add_filter({"field": "level", "value": "ERROR"})
- "Expand panel panel-123" → TOOL_CALL: expand_panel({"panelId": "panel-123"})
- "Show me document doc-456" → TOOL_CALL: expand_document({"documentId": "doc-456"})

QUERY ADAPTATION EXAMPLES:
- If memory shows "source=opensearch_dashboards_sample_data_logs | stats count()" and user asks for flights data, suggest "source=opensearch_dashboards_sample_data_flights | stats count()"
- If memory shows previous metric queries, adapt the pattern for the current dataset and context

Use ALL the context information above (system, memory, chat history, session) to provide accurate, contextual, and learned responses.`;

        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            messages: [
              {
                role: 'user',
                content: `${systemPrompt}\n\nUser: ${message}`,
              },
            ],
          }),
        });

        if (!claudeResponse.ok) {
          const errorText = await claudeResponse.text();
          return response.customError({
            statusCode: claudeResponse.status,
            body: `Claude API error: ${claudeResponse.status} ${claudeResponse.statusText}: ${errorText}`,
          });
        }

        const data = await claudeResponse.json();
        return response.ok({
          body: {
            response: data.content[0].text,
          },
        });
      } catch (error) {
        return response.customError({
          statusCode: 500,
          body: `Internal server error: ${error.message}`,
        });
      }
    }
  );
}