/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';

export const configSchema = schema.object({
  enabled: schema.boolean({ defaultValue: true }),
  /**
   * @experimental Gates per-dataset SQL/PPL gating for legacy Elasticsearch data sources and
   * Open Distro endpoint routing. When disabled (default), behavior is unchanged: SQL/PPL are
   * shown for all datasets and queries always hit the `/_plugins` endpoints.
   */
  legacyElasticsearchCompatibility: schema.object({
    enabled: schema.boolean({ defaultValue: false }),
  }),
  queryAssist: schema.object({
    supportedLanguages: schema.arrayOf(
      schema.object({
        language: schema.string(),
        agentConfig: schema.string(),
        timeRangeParserAgentConfig: schema.string(),
      }),
      {
        defaultValue: [
          {
            language: 'PPL',
            agentConfig: 'os_query_assist_ppl',
            timeRangeParserAgentConfig: 'os_query_time_range_parser',
          },
        ],
      }
    ),
    summary: schema.object({
      enabled: schema.boolean({ defaultValue: false }),
      branding: schema.object({
        label: schema.string({ defaultValue: '' }),
      }),
    }),
  }),
  // PPL feature flags, read at runtime via DynamicConfigService. Nested as
  // ppl.lint.enabled so future languages/features (ppl.autocomplete, sql.lint)
  // extend the same shape. Surfaced as the flat queryEnhancements.pplLint
  // capability. Disabled by default.
  ppl: schema.object({
    lint: schema.object({
      enabled: schema.boolean({ defaultValue: false }),
    }),
  }),
});

export type ConfigSchema = TypeOf<typeof configSchema>;
