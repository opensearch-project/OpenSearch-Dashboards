/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';

// Agent config IDs
export const TEXT2PPL_AGENT_CONFIG_ID = 'os_query_assist_ppl';
export const TEXT2PPL_TIME_RANGE_PARSER_AGENT_CONFIG_ID = 'os_query_time_range_parser';

export const configSchema = schema.object({
  enabled: schema.boolean({ defaultValue: true }),
  queryAssist: schema.object({
    supportedLanguages: schema.arrayOf(
      schema.object({
        language: schema.string(),
        agentConfig: schema.string(),
      }),
      {
        defaultValue: [{ language: 'PPL', agentConfig: TEXT2PPL_AGENT_CONFIG_ID }],
      }
    ),
    summary: schema.object({
      enabled: schema.boolean({ defaultValue: false }),
      branding: schema.object({
        label: schema.string({ defaultValue: '' }),
      }),
    }),
  }),
});

export type ConfigSchema = TypeOf<typeof configSchema>;
