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

        const systemPrompt = `You are an OpenSearch Dashboards assistant. You can help users understand their data and interact with their dashboards.

Current Context:
- App: ${userContext?.appId || 'unknown'}
- Type: ${userContext?.data?.type || 'unknown'}
- Dashboard: ${userContext?.data?.dashboard?.title || 'N/A'}
- Embeddables: ${userContext?.data?.embeddables?.count || 0}
- Filters: ${userContext?.data?.filters?.length || 0}
- Time Range: ${JSON.stringify(userContext?.data?.timeRange) || 'unknown'}

Available Actions:
- add_filter: Add filters to dashboard
- expand_panel: Expand dashboard panels
- expand_document: Expand documents in explore view

When users ask to filter data, expand panels, or expand documents, use the appropriate tools.
For tool calls, respond with: TOOL_CALL: tool_name({"param": "value"})

Examples:
- "Add a filter for level ERROR" → TOOL_CALL: add_filter({"field": "level", "value": "ERROR"})
- "Expand panel panel-123" → TOOL_CALL: expand_panel({"panelId": "panel-123"})
- "Show me document doc-456" → TOOL_CALL: expand_document({"documentId": "doc-456"})`;

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