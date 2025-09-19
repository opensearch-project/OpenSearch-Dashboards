/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IRouter } from '../../../../core/server';

export function registerCallAgentRoute(router: IRouter) {
  router.post(
    {
      path: '/api/osd-mcp-server/redux/call-agent',
      validate: {
        body: (value: any) => ({ value }),
      },
    },
    async (context, request, response) => {
      const { question, language = 'PPL' } = request.body;

      try {
        // This route acts as a bridge to trigger callAgentActionCreator
        // The actual implementation will be handled by the client-side Redux integration

        // For now, return a response indicating that this should be handled client-side
        return response.ok({
          body: {
            success: false,
            message:
              'callAgentActionCreator should be called directly from client-side Redux store',
            error: 'SERVER_SIDE_BRIDGE_NOT_IMPLEMENTED',
            question,
            language,
            timestamp: new Date().toISOString(),
            note: 'Use the server-side GenerateQueryTool instead, which has direct Redux access',
          },
        });
      } catch (error) {
        return response.customError({
          statusCode: 500,
          body: {
            message: `Failed to process call-agent request: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          },
        });
      }
    }
  );
}
