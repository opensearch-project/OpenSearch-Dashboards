/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';

export const configSchema = schema.object({
  enabled: schema.boolean({ defaultValue: true }),
  queryAssist: schema.object({
    supportedLanguages: schema.arrayOf(
      schema.object({
        language: schema.string(),
        agentConfig: schema.string(),
      }),
      {
        defaultValue: [{ language: 'PPL', agentConfig: 'os_query_assist_ppl' }],
      }
    ),
    summary: schema.object({
      enabled: schema.boolean({ defaultValue: false }),
    }),
  }),
});

export type ConfigSchema = TypeOf<typeof configSchema>;
