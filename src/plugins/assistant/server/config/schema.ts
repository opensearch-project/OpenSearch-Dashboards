/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';

export const configSchema = schema.object(
  {
    agent: schema.object({
      enabled: schema.boolean({ defaultValue: false }),
      endpoint: schema.string({
        defaultValue: 'http://localhost:3000',
        validate: (value) => {
          try {
            new URL(value);
          } catch {
            return 'agent.endpoint must be a valid URL';
          }
        },
      }),
      type: schema.oneOf([schema.literal('jarvis'), schema.literal('langgraph')], {
        defaultValue: 'jarvis',
      }),
      timeout: schema.number({
        defaultValue: 30000,
        min: 1000,
        max: 300000, // 5 minutes max
      }),
      debug: schema.boolean({ defaultValue: false }),
      maxRetries: schema.number({
        defaultValue: 3,
        min: 0,
        max: 10,
      }),
      retryDelay: schema.number({
        defaultValue: 1000,
        min: 100,
        max: 10000,
      }),
      auth: schema.object(
        {
          type: schema.oneOf(
            [
              schema.literal('none'),
              schema.literal('basic'),
              schema.literal('bearer'),
              schema.literal('custom'),
            ],
            {
              defaultValue: 'none',
            }
          ),
          username: schema.maybe(schema.string()),
          password: schema.maybe(schema.string()),
          token: schema.maybe(schema.string()),
          headers: schema.maybe(schema.recordOf(schema.string(), schema.string())),
        },
        {
          defaultValue: {
            type: 'none' as const,
          },
        }
      ),
    }),
  },
  {
    validate: (config) => {
      if (config.agent.enabled) {
        if (!config.agent.endpoint) {
          return 'agent.endpoint is required when agent.enabled is true';
        }

        if (config.agent.auth.type === 'basic') {
          if (!config.agent.auth.username || !config.agent.auth.password) {
            return 'agent.auth.username and agent.auth.password are required when auth.type is "basic"';
          }
        }

        if (config.agent.auth.type === 'bearer') {
          if (!config.agent.auth.token) {
            return 'agent.auth.token is required when auth.type is "bearer"';
          }
        }
      }
    },
  }
);

export type AssistantConfigType = TypeOf<typeof configSchema>;
