/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IRouter } from '../../../../core/server';
import { ConfigService, AgentClient } from '../services';

export function defineRoutes(
  router: IRouter,
  configService: ConfigService,
  agentClient?: AgentClient
) {
  router.get(
    {
      path: '/api/assistant/config',
      validate: false,
    },
    async (context, request, response) => {
      return response.ok({
        body: configService.getClientConfig(),
      });
    }
  );

  router.get(
    {
      path: '/api/assistant/health',
      validate: false,
    },
    async (context, request, response) => {
      if (!agentClient) {
        return response.ok({
          body: {
            enabled: false,
            healthy: null,
            message: 'Agent client not initialized',
          },
        });
      }

      try {
        const healthy = await agentClient.isHealthy();
        return response.ok({
          body: {
            enabled: true,
            healthy,
            message: healthy ? 'Agent service is healthy' : 'Agent service is not responding',
          },
        });
      } catch (error) {
        return response.ok({
          body: {
            enabled: true,
            healthy: false,
            message: `Health check failed: ${(error as Error).message}`,
          },
        });
      }
    }
  );

  router.get(
    {
      path: '/api/assistant/example',
      validate: false,
    },
    async (context, request, response) => {
      return response.ok({
        body: {
          time: new Date().toISOString(),
        },
      });
    }
  );
}
